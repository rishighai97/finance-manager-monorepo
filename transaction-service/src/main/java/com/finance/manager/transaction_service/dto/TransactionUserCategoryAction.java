package com.finance.manager.transaction_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public enum TransactionUserCategoryAction {
    @JsonProperty("DELETE")
    DELETE("DELETE"),
    
    @JsonProperty("INSERT")
    INSERT("INSERT");

    @Getter
    private final String name;
}