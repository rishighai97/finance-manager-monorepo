package com.finance.manager.transaction_service.dao;

import com.finance.manager.transaction_service.dto.Transaction;

import java.util.List;

public interface TransactionDao {
    List<Transaction> fetchAll(List<Integer> userAccountIds, String startDate, String endDate);
}
