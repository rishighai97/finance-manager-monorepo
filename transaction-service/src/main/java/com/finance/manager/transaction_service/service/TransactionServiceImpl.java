package com.finance.manager.transaction_service.service;

import com.finance.manager.transaction_service.dao.TransactionDao;
import com.finance.manager.transaction_service.dto.Transaction;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionServiceImpl implements TransactionService {

    private final TransactionDao transactionDao;

    @Override
    public List<Transaction> getUserTransactions(List<Integer> userAccountIds, String startDate, String endDate) {
        return transactionDao.fetchAll(userAccountIds, startDate, endDate);
    }
}