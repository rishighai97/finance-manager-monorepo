package com.finance.manager.api_gateway.service;

import com.finance.manager.api_gateway.dto.AuthResponse;
import com.finance.manager.api_gateway.dto.UserLoginRequest;
import com.finance.manager.api_gateway.dto.UserSignupRequest;
import com.finance.manager.api_gateway.dto.UserDetails;
import com.finance.manager.api_gateway.exception.AuthenticationException;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatusCode;
import org.springframework.jdbc.core.ResultSetExtractor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class UserServiceImpl implements UserService {

    private final NamedParameterJdbcTemplate namedParameterJdbcTemplate;
    private final BCryptPasswordEncoder passwordEncoder;

    // In-memory token storage (in a real app, use Redis or similar)
    private final Map<String, Integer> activeTokens = new HashMap<>();

    public UserServiceImpl(NamedParameterJdbcTemplate namedParameterJdbcTemplate) {
        this.namedParameterJdbcTemplate = namedParameterJdbcTemplate;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    @Override
    @Transactional
    public UserDetails createUser(UserSignupRequest request) throws HttpClientErrorException {
        // Check if username already exists
        String checkSql = "SELECT COUNT(*) FROM user_detail WHERE username = :username";
        MapSqlParameterSource checkParams = new MapSqlParameterSource();
        checkParams.addValue("username", request.getUsername());

        Integer count = namedParameterJdbcTemplate.queryForObject(checkSql, checkParams, Integer.class);
        if (count != null && count > 0) {
            throw new HttpClientErrorException(HttpStatusCode.valueOf(409));
        }

        // Hash the password
        String hashedPassword = passwordEncoder.encode(request.getPassword());

        // Insert new user
        String sql = """
                INSERT INTO user_detail (username, password, is_active, last_login, created_at, updated_at)
                VALUES (:username, :password, true, :now, :now, :now)
                RETURNING id
                """;

        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("username", request.getUsername());
        params.addValue("password", hashedPassword);
        params.addValue("now", Timestamp.valueOf(LocalDateTime.now()));

        KeyHolder keyHolder = new GeneratedKeyHolder();
        namedParameterJdbcTemplate.update(sql, params, keyHolder);

        int userId = Objects.requireNonNull(keyHolder.getKey()).intValue();

        // Return user details
        return getUserById(userId);
    }

    @Override
    public AuthResponse authenticateUser(UserLoginRequest request) throws HttpClientErrorException {
        // Fetch user by username
        String sql = "SELECT id, username, password FROM user_detail WHERE username = :username AND is_active = true";
        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("username", request.getUsername());

        UserDetails userDetails;

        try {
            userDetails = namedParameterJdbcTemplate.queryForObject(sql, params, (rs, rowNum) ->
                    UserDetails.builder()
                            .id(rs.getInt("id"))
                            .username(rs.getString("username"))
                            .password(rs.getString("password"))
                            .build()
            );
        } catch (EmptyResultDataAccessException e) {
            throw new HttpClientErrorException(HttpStatusCode.valueOf(400));
        }

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), userDetails.getPassword())) {
            throw new HttpClientErrorException(HttpStatusCode.valueOf(401));
        }


        // Update last login time
        String updateSql = "UPDATE users SET last_login = :now WHERE id = :id";
        MapSqlParameterSource updateParams = new MapSqlParameterSource();
        updateParams.addValue("now", Timestamp.valueOf(LocalDateTime.now()));
        updateParams.addValue("id", userDetails.getId());
        namedParameterJdbcTemplate.update(updateSql, updateParams);

        // Generate token (in a real app, use JWT)
        String token = generateToken();
        activeTokens.put(token, (Integer) userDetails.getId());

        // Build response
        return AuthResponse.builder()
                .accessToken(token)
                .refreshToken("refresh-" + token) // In a real app, generate a proper refresh token
                .expiresIn(3600) // 1 hour expiry
                .tokenType("Bearer")
                .userId(userDetails.getId())
                .username(userDetails.getUsername())
                .build();

    }

    @Override
    public void logout(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            activeTokens.remove(token);
        }
    }

    private UserDetails getUserById(int userId) {
        String sql = """
                SELECT id, username, is_active,
                       last_login, created_at, updated_at
                FROM user_detail
                WHERE id = :userId
                """;

        MapSqlParameterSource params = new MapSqlParameterSource();
        params.addValue("userId", userId);

        return namedParameterJdbcTemplate.queryForObject(sql, params, (rs, rowNum) ->
                UserDetails.builder()
                        .id(rs.getInt("id"))
                        .username(rs.getString("username"))
                        .isActive(rs.getBoolean("is_active"))
                        .lastLogin(rs.getTimestamp("last_login").toString())
                        .createdAt(rs.getTimestamp("created_at").toString())
                        .updatedAt(rs.getTimestamp("updated_at").toString())
                        .build()
        );
    }

    private String generateToken() {
        // In a real app, use a proper JWT library
        return "token-" + System.currentTimeMillis();
    }
}