package com.finance.manager.transaction_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;

@Builder
public record TransactionUserCategory(
        @JsonProperty("transaction_id")
        String transactionId,
        
        @JsonProperty("user_category_id")
        Integer userCategoryId,
        
        @JsonProperty("action")
        TransactionUserCategoryAction action
) {}