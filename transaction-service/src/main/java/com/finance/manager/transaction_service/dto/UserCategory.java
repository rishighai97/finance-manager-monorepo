package com.finance.manager.transaction_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;

@Builder
public record UserCategory(
        @JsonProperty("id") Integer id,
        @JsonProperty("user_id") Integer userId,
        @JsonProperty("category_title") String categoryTitle
) {}