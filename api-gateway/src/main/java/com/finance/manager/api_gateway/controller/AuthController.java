package com.finance.manager.api_gateway.controller;

import com.finance.manager.api_gateway.dto.AuthResponse;
import com.finance.manager.api_gateway.dto.UserLoginRequest;
import com.finance.manager.api_gateway.dto.UserSignupRequest;
import com.finance.manager.api_gateway.dto.UserDetails;
import com.finance.manager.api_gateway.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @PostMapping("/signup")
    public ResponseEntity<UserDetails> signup(@RequestBody UserSignupRequest request) {
        try {
            UserDetails userDetails = userService.createUser(request);
            return ResponseEntity.ok(userDetails);
        } catch (HttpClientErrorException e) {
            return ResponseEntity.status(HttpStatusCode.valueOf(e.getStatusCode().value())).build();
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody UserLoginRequest request) {
        try {
            AuthResponse response = userService.authenticateUser(request);
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