
package com.finance.manager.transaction_service.dao;

import com.finance.manager.transaction_service.dto.Transaction;

import java.util.List;
import java.util.Set;

public interface TransactionDao {
    List<Transaction> fetchAll(List<Integer> userAccountIds, String startDate, String endDate, Set<Integer> categoryIds, String debitCreditIndicator);

    void saveAll(List<Transaction> transactions);
}

