package com.finance.manager.transaction_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;

import java.math.BigDecimal;
import java.util.List;

@Builder
public record TransactionsDto(
        @JsonProperty("start_date")
        String startDate,
        @JsonProperty("end_date")
        String endDate,
        @JsonProperty("opening_balance")
        BigDecimal openingBalance,
        @JsonProperty("total_credit")
        BigDecimal totalCredit,
        @JsonProperty("total_debit")
        BigDecimal totalDebit,
        @JsonProperty("closing_balance")
        BigDecimal closingBalance,
        @JsonProperty("transactions")
        List<Transaction> transactions
) {

}
