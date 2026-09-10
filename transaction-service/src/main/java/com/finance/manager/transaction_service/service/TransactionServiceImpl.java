
package com.finance.manager.transaction_service.service;

import com.finance.manager.transaction_service.DebitCreditIndicator;
import com.finance.manager.transaction_service.dao.TransactionDao;
import com.finance.manager.transaction_service.dto.Transaction;
import com.finance.manager.transaction_service.dto.TransactionsDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;


@Service
@RequiredArgsConstructor
public class TransactionServiceImpl implements TransactionService {

    private final TransactionDao transactionDao;

    @Override
    public TransactionsDto getUserTransactions(List<Integer> userAccountIds, String startDate, String endDate, Set<Integer> categoryIds, String debitCreditIndicator) {
        List<Transaction> transactionList = transactionDao.fetchAll(userAccountIds, startDate, endDate, categoryIds, debitCreditIndicator);
        return TransactionsDto
                .builder()
                .startDate(startDate)
                .endDate(endDate)
                .totalDebit(getTotalDebitOrCreditAmount(transactionList, DebitCreditIndicator.DEBIT))
                .totalCredit(getTotalDebitOrCreditAmount(transactionList, DebitCreditIndicator.CREDIT))
                .openingBalance(calculateOpeningBalance(transactionList))
                .closingBalance(calculateClosingBalance(transactionList))
                .transactions(transactionList)
                .build();
    }

    @Override
    public void saveAll(List<Transaction> transactions) {
        transactionDao.saveAll(transactions);
    }

    private BigDecimal calculateClosingBalance(List<Transaction> transactionList) {
        return getEarliestOrLatestTransactionPerUserAccountId(transactionList, false)
                // Mutual-fund/broker transactions (e.g. Groww) have no running bank
                // balance concept - closingBalance() is null for those, not just
                // absent-and-zero. Treat null as "doesn't contribute" rather than
                // NPEing, matching getTotalDebitOrCreditAmount's null-safety below.
                .map(t -> t.closingBalance() != null ? t.closingBalance() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calculateOpeningBalance(List<Transaction> transactionList) {
        return getEarliestOrLatestTransactionPerUserAccountId(transactionList, true)
                .map(t -> {
                    BigDecimal closingBalance = t.closingBalance();
                    if (closingBalance == null) {
                        return BigDecimal.ZERO;
                    }
                    BigDecimal debitOrCreditAmount = t.debitOrCreditAmount();
                    boolean credit = t.isDebitOrCredit().equalsIgnoreCase(DebitCreditIndicator.CREDIT.getName());
                    return credit ? closingBalance.subtract(debitOrCreditAmount) : closingBalance.add(debitOrCreditAmount);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);


    }

    private Stream<Transaction> getEarliestOrLatestTransactionPerUserAccountId(List<Transaction> transactionList, boolean earliest) {
        return transactionList
                .stream()
                .collect(Collectors.groupingBy(Transaction::userAccountId))
                .values()
                .stream()
                .map(transactions -> getTransactionOnMinOrMaxDate(transactions, earliest));
    }

    private BigDecimal getTotalDebitOrCreditAmount(List<Transaction> transactionList, DebitCreditIndicator debitOrCreditIndicator) {
        return transactionList
                .stream()
                .filter(t -> Objects.nonNull(t) && Objects.nonNull(t.isDebitOrCredit()) && t.isDebitOrCredit().strip().equalsIgnoreCase(debitOrCreditIndicator.getName()))
                .map(Transaction::debitOrCreditAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private Transaction getTransactionOnMinOrMaxDate(List<Transaction> transactions, boolean earliest) {
        return transactions
                .stream()
                .sorted(Comparator.comparing(Transaction::date, earliest ? Comparator.naturalOrder() : Comparator.reverseOrder()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Unable to get transaction at min / max date"));
    }

    private LocalDate getDateStringAndConvertToLocalDate(Transaction t1) {
        return t1.date();
    }
}

