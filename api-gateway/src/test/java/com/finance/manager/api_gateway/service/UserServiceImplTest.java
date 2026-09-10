package com.finance.manager.api_gateway.service;

import com.finance.manager.api_gateway.dto.AuthResponse;
import com.finance.manager.api_gateway.dto.UserDetails;
import com.finance.manager.api_gateway.dto.UserLoginRequest;
import com.finance.manager.api_gateway.dto.UserSignupRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.client.HttpClientErrorException;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private NamedParameterJdbcTemplate jdbcTemplate;

    private UserServiceImpl userService;
    private final BCryptPasswordEncoder realEncoder = new BCryptPasswordEncoder();

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        userService = new UserServiceImpl(jdbcTemplate);
    }

    @Nested
    @DisplayName("createUser")
    class CreateUser {

        @Test
        @DisplayName("creates and returns the new user when the username is free")
        void createsUserWhenUsernameIsFree() {
            UserSignupRequest request = UserSignupRequest.builder().username("newuser").password("secret").build();

            when(jdbcTemplate.queryForObject(anyString(), any(SqlParameterSource.class), eq(Integer.class)))
                    .thenReturn(0);
            when(jdbcTemplate.update(anyString(), any(SqlParameterSource.class), any(KeyHolder.class)))
                    .thenAnswer(invocation -> {
                        KeyHolder keyHolder = invocation.getArgument(2);
                        keyHolder.getKeyList().add(Map.of("id", 7));
                        return 1;
                    });
            when(jdbcTemplate.queryForObject(anyString(), any(SqlParameterSource.class), userDetailsRowMapper()))
                    .thenAnswer(invocation -> {
                        RowMapper<UserDetails> mapper = invocation.getArgument(2);
                        return mapper.mapRow(mockResultSetForUser(7, "newuser"), 0);
                    });

            UserDetails result = userService.createUser(request);

            assertThat(result.getId()).isEqualTo(7);
            assertThat(result.getUsername()).isEqualTo("newuser");
        }

        @Test
        @DisplayName("rejects with 409 when the username is already taken, without attempting the insert")
        void rejectsDuplicateUsername() {
            UserSignupRequest request = UserSignupRequest.builder().username("existing").password("secret").build();
            when(jdbcTemplate.queryForObject(anyString(), any(SqlParameterSource.class), eq(Integer.class)))
                    .thenReturn(1);

            assertThatThrownBy(() -> userService.createUser(request))
                    .isInstanceOf(HttpClientErrorException.class)
                    .satisfies(ex -> assertThat(((HttpClientErrorException) ex).getStatusCode().value()).isEqualTo(409));

            verify(jdbcTemplate, org.mockito.Mockito.never())
                    .update(anyString(), any(SqlParameterSource.class), any(KeyHolder.class));
        }

        @SuppressWarnings("unchecked")
        private RowMapper<UserDetails> userDetailsRowMapper() {
            return any(RowMapper.class);
        }

        private java.sql.ResultSet mockResultSetForUser(int id, String username) throws java.sql.SQLException {
            java.sql.ResultSet rs = mock(java.sql.ResultSet.class);
            when(rs.getInt("id")).thenReturn(id);
            when(rs.getString("username")).thenReturn(username);
            when(rs.getBoolean("is_active")).thenReturn(true);
            Timestamp now = Timestamp.valueOf(LocalDateTime.now());
            when(rs.getTimestamp("last_login")).thenReturn(now);
            when(rs.getTimestamp("created_at")).thenReturn(now);
            when(rs.getTimestamp("updated_at")).thenReturn(now);
            return rs;
        }
    }

    @Nested
    @DisplayName("authenticateUser")
    class AuthenticateUser {

        @Test
        @DisplayName("returns a token and updates last_login for a correct password")
        void returnsTokenForCorrectPassword() {
            String hashedPassword = realEncoder.encode("correct-password");
            UserLoginRequest request = UserLoginRequest.builder().username("existinguser").password("correct-password").build();

            when(jdbcTemplate.queryForObject(anyString(), any(SqlParameterSource.class), userDetailsRowMapper()))
                    .thenAnswer(invocation -> {
                        RowMapper<UserDetails> mapper = invocation.getArgument(2);
                        return mapper.mapRow(mockLoginResultSet(3, "existinguser", hashedPassword), 0);
                    });

            AuthResponse response = userService.authenticateUser(request);

            assertThat(response.getUserId()).isEqualTo(3);
            assertThat(response.getUsername()).isEqualTo("existinguser");
            assertThat(response.getAccessToken()).isNotBlank();
            assertThat(response.getTokenType()).isEqualTo("Bearer");
            verify(jdbcTemplate).update(anyString(), any(SqlParameterSource.class));
        }

        @Test
        @DisplayName("rejects with 401 for an incorrect password, without updating last_login")
        void rejectsIncorrectPassword() {
            String hashedPassword = realEncoder.encode("correct-password");
            UserLoginRequest request = UserLoginRequest.builder().username("existinguser").password("wrong-password").build();

            when(jdbcTemplate.queryForObject(anyString(), any(SqlParameterSource.class), userDetailsRowMapper()))
                    .thenAnswer(invocation -> {
                        RowMapper<UserDetails> mapper = invocation.getArgument(2);
                        return mapper.mapRow(mockLoginResultSet(3, "existinguser", hashedPassword), 0);
                    });

            assertThatThrownBy(() -> userService.authenticateUser(request))
                    .isInstanceOf(HttpClientErrorException.class)
                    .satisfies(ex -> assertThat(((HttpClientErrorException) ex).getStatusCode().value()).isEqualTo(401));

            verify(jdbcTemplate, org.mockito.Mockito.never()).update(anyString(), any(SqlParameterSource.class));
        }

        @Test
        @DisplayName("rejects with 400 when no active user matches the username")
        void rejectsUnknownUsername() {
            UserLoginRequest request = UserLoginRequest.builder().username("ghost").password("whatever").build();

            when(jdbcTemplate.queryForObject(anyString(), any(SqlParameterSource.class), userDetailsRowMapper()))
                    .thenThrow(new EmptyResultDataAccessException(1));

            assertThatThrownBy(() -> userService.authenticateUser(request))
                    .isInstanceOf(HttpClientErrorException.class)
                    .satisfies(ex -> assertThat(((HttpClientErrorException) ex).getStatusCode().value()).isEqualTo(400));
        }

        @SuppressWarnings("unchecked")
        private RowMapper<UserDetails> userDetailsRowMapper() {
            return any(RowMapper.class);
        }

        private java.sql.ResultSet mockLoginResultSet(int id, String username, String password) throws java.sql.SQLException {
            java.sql.ResultSet rs = mock(java.sql.ResultSet.class);
            when(rs.getInt("id")).thenReturn(id);
            when(rs.getString("username")).thenReturn(username);
            when(rs.getString("password")).thenReturn(password);
            return rs;
        }
    }

    @Nested
    @DisplayName("logout")
    class Logout {

        @Test
        @DisplayName("does not throw for a well-formed Bearer header")
        void handlesBearerHeader() {
            userService.logout("Bearer token-123");
        }

        @Test
        @DisplayName("does not throw when the header has no Bearer prefix (no-op)")
        void toleratesMissingBearerPrefix() {
            userService.logout("token-123");
        }

        @Test
        @DisplayName("does not throw for a null Authorization header (no-op)")
        void toleratesNullHeader() {
            userService.logout(null);
        }
    }
}
