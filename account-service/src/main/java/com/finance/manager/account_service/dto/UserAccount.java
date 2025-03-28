package com.finance.manager.account_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;

import java.math.BigDecimal;

@Builder
public record UserAccount(
        @JsonProperty("user_account_id")
        int userAccountId,

        @JsonProperty("account_id")
        int accountId,

        @JsonProperty("user_id")
        int userId,

        @JsonProperty("user_account_name")
        String userAccountName,

        @JsonProperty("account_type_id")
        int accountTypeId,

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

        @JsonProperty("latest_balance")
        BigDecimal latestBalance,

        @JsonProperty("latest_balance_date")
        String latestBalanceDate
) {

}