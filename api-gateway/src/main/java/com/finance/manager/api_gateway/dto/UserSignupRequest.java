package com.finance.manager.api_gateway.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserSignupRequest {
    private String username;
    private String password;
}