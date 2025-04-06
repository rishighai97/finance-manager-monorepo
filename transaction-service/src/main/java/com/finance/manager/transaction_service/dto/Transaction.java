package com.finance.manager.transaction_service.dto;

import java.math.BigDecimal;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;

@Builder
public record Transaction(
        @JsonProperty("transaction_id") String transactionId,
        @JsonProperty("date") String date,
        @JsonProperty("user_account_id") int userAccountId,
        @JsonProperty("title") String title,
        @JsonProperty("debit_or_credit_amount") BigDecimal debitOrCreditAmount,
        @JsonProperty("is_debit_or_credit") String isDebitOrCredit,
        @JsonProperty("closing_balance") BigDecimal closingBalance,
        @JsonProperty("category_id") Integer categoryId,
        @JsonProperty("type") String type,
        @JsonProperty("units") Integer units,
        @JsonProperty("price_per_unit") BigDecimal pricePerUnit,
        @JsonProperty("user_category_ids") Set<Integer> userCategoryIds
) {}