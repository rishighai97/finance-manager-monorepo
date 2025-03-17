package com.finance.manager.transaction_service.service;

import com.finance.manager.transaction_service.dto.Transaction;

import java.util.List;

public interface TransactionService {
    List<Transaction> getUserTransactions(List<Integer> userAccountIds, String startDate, String endDate);
}