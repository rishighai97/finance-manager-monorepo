package com.finance.manager.account_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;

import java.math.BigDecimal;

@Builder
public record Account(
        @JsonProperty("account_id")
        int accountId,

        @JsonProperty("account_name")
        String accountName,

        @JsonProperty("statement_file_extensions")
        String statementFileExtensions,

        @JsonProperty("icon")
        String icon,

        @JsonProperty("account_type_1")
        String accountType1,

        @JsonProperty("account_type_2")
        String accountType2,

        @JsonProperty("account_type_3")
        String accountType3,
        
        @JsonProperty("account_type_id")
        int accountTypeId
) {

}