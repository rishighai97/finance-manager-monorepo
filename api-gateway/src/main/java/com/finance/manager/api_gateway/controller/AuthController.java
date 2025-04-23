package com.finance.manager.api_gateway.controller;

import com.finance.manager.api_gateway.dto.AuthResponse;
import com.finance.manager.api_gateway.dto.UserLoginRequest;
import com.finance.manager.api_gateway.dto.UserSignupRequest;
import com.finance.manager.api_gateway.dto.UserDetails;
import com.finance.manager.api_gateway.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;

@RestController
@RequestMapping("/auth")
@CrossOrigin
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final UserService userService;

    @GetMapping("/healthcheck")
    public String healthCheck() {
        return "API Gateway is up and running";
    }

    @PostMapping("/signup")
    public ResponseEntity<UserDetails> signup(@RequestBody UserSignupRequest request) {
        try {
            log.info("Received signup request for user - {}", request.getUsername());
            UserDetails userDetails = userService.createUser(request);
            log.info("Signup successful for user - {}", request.getUsername());
            return ResponseEntity.ok(userDetails);
        } catch (HttpClientErrorException e) {
            return ResponseEntity.status(HttpStatusCode.valueOf(e.getStatusCode().value())).build();
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody UserLoginRequest request) {
        try {
            log.info("Received login request for user - {}", request.getUsername());
            AuthResponse response = userService.authenticateUser(request);
            log.info("Signup successful for user - {}", request.getUsername());
            return ResponseEntity.ok(response);
        } catch (HttpClientErrorException e) {
            return ResponseEntity.status(HttpStatusCode.valueOf(e.getStatusCode().value())).build();
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader("Authorization") String authHeader) {
        userService.logout(authHeader);
        return ResponseEntity.ok().build();
    }
}