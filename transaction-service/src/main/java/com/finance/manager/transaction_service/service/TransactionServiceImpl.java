package com.finance.manager.transaction_service.service;

import com.finance.manager.transaction_service.DebitCreditIndicator;
import com.finance.manager.transaction_service.dao.TransactionDao;
import com.finance.manager.transaction_service.dto.Transaction;
import com.finance.manager.transaction_service.dto.TransactionsDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class TransactionServiceImpl implements TransactionService {

    private final TransactionDao transactionDao;

    @Override
    public TransactionsDto getUserTransactions(List<Integer> userAccountIds, String startDate, String endDate) {
        List<Transaction> transactionList = transactionDao.fetchAll(userAccountIds, startDate, endDate);
//        Map<Integer, List<Transaction>> userAccountIdToTransactionListMap = transactionList
//                .stream()
//                .collect(Collectors.groupingBy(Transaction::userAccountId));
        BigDecimal totalDebitAmount = getTotalDebitOrCreditAmount(transactionList, DebitCreditIndicator.DEBIT);
        BigDecimal totalCreditAmount = getTotalDebitOrCreditAmount(transactionList, DebitCreditIndicator.CREDIT);
        return TransactionsDto
                .builder()
                .startDate(startDate)
                .endDate(endDate)
                .totalDebit(totalDebitAmount)
                .totalCredit(totalCreditAmount)
                .transactions(transactionList)
                .build();
    }

    private BigDecimal getTotalDebitOrCreditAmount(List<Transaction> transactionList, DebitCreditIndicator debitOrCreditIndicator) {
        return transactionList
                .stream()
                .map(t->Objects.nonNull(t) && t.isDebitOrCredit().equalsIgnoreCase(debitOrCreditIndicator.getName()) ? t.debitOrCreditAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

//    private BigDecimal getTransactionOnMinOrMaxDate(List<Transaction> transactions, boolean minDate) {
//        transactions
//                .stream()
//                .sorted(Comparator.comparing(this::getDateStringAndConvertToLocalDate, minDate ? Comparator.reverseOrder(): Comparator.naturalOrder()))
//                .findFirst()
//                .orElseThrow(()-> throw new RuntimeException("Unable to get transaction at min / max date"));
//    }

    private LocalDate getDateStringAndConvertToLocalDate(Transaction t1) {
        return LocalDate.parse(t1.date(), DateTimeFormatter.ofPattern("yyyy-MM-dd"));
    }
}