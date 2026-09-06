package com.finance.manager.api_gateway.dto;

import lombok.Builder;
import lombok.Data;

// Enhance the existing AuthResponse DTO
@Data
@Builder
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private int expiresIn;
    private String tokenType;
    private int userId;
    private String username;
}