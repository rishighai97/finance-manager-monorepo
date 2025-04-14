package com.finance.manager.api_gateway.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserDetails {
    private int id;
    private String username;
    @JsonIgnore
    private String password;
    private boolean isActive;
    private String lastLogin;
    private String createdAt;
    private String updatedAt;
}