package com.finance.manager.transaction_service.service;

import com.finance.manager.transaction_service.dto.Transaction;
import com.finance.manager.transaction_service.dto.TransactionsDto;

import java.util.List;

public interface TransactionService {
    TransactionsDto getUserTransactions(List<Integer> userAccountIds, String startDate, String endDate);
}