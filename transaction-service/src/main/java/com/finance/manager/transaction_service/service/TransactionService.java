
package com.finance.manager.transaction_service.service;

import com.finance.manager.transaction_service.dto.Transaction;
import com.finance.manager.transaction_service.dto.TransactionsDto;

import java.util.List;
import java.util.Set;

public interface TransactionService {

    // Add overloaded method with categoryIds parameter
    TransactionsDto getUserTransactions(List<Integer> userAccountIds, String startDate, String endDate, Set<Integer> categoryIds, String debitCreditIndicator);

    void saveAll(List<Transaction> transactions);
}

