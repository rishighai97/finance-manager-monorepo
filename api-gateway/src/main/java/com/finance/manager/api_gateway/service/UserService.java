package com.finance.manager.api_gateway.service;

import com.finance.manager.api_gateway.dto.AuthResponse;
import com.finance.manager.api_gateway.dto.UserDetails;
import com.finance.manager.api_gateway.dto.UserLoginRequest;
import com.finance.manager.api_gateway.dto.UserSignupRequest;

public interface UserService {
    UserDetails createUser(UserSignupRequest request);
    AuthResponse authenticateUser(UserLoginRequest request);
    void logout(String authHeader);
}
