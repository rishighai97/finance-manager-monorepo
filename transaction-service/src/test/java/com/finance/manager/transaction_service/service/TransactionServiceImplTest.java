package com.finance.manager.transaction_service.service;

import com.finance.manager.transaction_service.dao.TransactionDao;
import com.finance.manager.transaction_service.dto.Transaction;
import com.finance.manager.transaction_service.dto.TransactionsDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransactionServiceImplTest {

    @Mock
    private TransactionDao transactionDao;

    @InjectMocks
    private TransactionServiceImpl transactionService;

    @Nested
    @DisplayName("getUserTransactions")
    class GetUserTransactions {

        @Test
        @DisplayName("returns all-zero totals/balances when there are no transactions in range")
        void returnsZeroesForEmptyRange() {
            when(transactionDao.fetchAll(List.of(1), "2026-09-01", "2026-09-09", null, null))
                    .thenReturn(Collections.emptyList());

            TransactionsDto result = transactionService.getUserTransactions(List.of(1), "2026-09-01", "2026-09-09", null, null);

            assertThat(result.totalDebit()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(result.totalCredit()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(result.openingBalance()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(result.closingBalance()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(result.transactions()).isEmpty();
        }

        @Test
        @DisplayName("derives opening balance by reversing the earliest transaction's effect on the closing balance")
        void derivesOpeningBalanceFromEarliestTransaction() {
            Transaction debitFirst = transaction(1, LocalDate.of(2026, 9, 1), "DR", new BigDecimal("50"), new BigDecimal("950"));
            Transaction creditLater = transaction(1, LocalDate.of(2026, 9, 2), "CR", new BigDecimal("100"), new BigDecimal("1050"));
            when(transactionDao.fetchAll(List.of(1), "2026-09-01", "2026-09-09", null, null))
                    .thenReturn(List.of(debitFirst, creditLater));

            TransactionsDto result = transactionService.getUserTransactions(List.of(1), "2026-09-01", "2026-09-09", null, null);

            // earliest txn is the DR: opening = closingBalance + debitAmount = 950 + 50 = 1000
            assertThat(result.openingBalance()).isEqualByComparingTo("1000");
            // latest txn is the CR: closing = 1050
            assertThat(result.closingBalance()).isEqualByComparingTo("1050");
            assertThat(result.totalDebit()).isEqualByComparingTo("50");
            assertThat(result.totalCredit()).isEqualByComparingTo("100");
        }

        @Test
        @DisplayName("subtracts the debit amount when the earliest transaction is a credit")
        void derivesOpeningBalanceWhenEarliestIsCredit() {
            Transaction creditFirst = transaction(1, LocalDate.of(2026, 9, 1), "CR", new BigDecimal("100"), new BigDecimal("1100"));
            when(transactionDao.fetchAll(List.of(1), "2026-09-01", "2026-09-09", null, null))
                    .thenReturn(List.of(creditFirst));

            TransactionsDto result = transactionService.getUserTransactions(List.of(1), "2026-09-01", "2026-09-09", null, null);

            // credit: opening = closingBalance - amount = 1100 - 100 = 1000
            assertThat(result.openingBalance()).isEqualByComparingTo("1000");
        }

        @Test
        @DisplayName("sums opening/closing balances independently across multiple user accounts")
        void sumsBalancesAcrossMultipleAccounts() {
            Transaction account1 = transaction(1, LocalDate.of(2026, 9, 1), "DR", new BigDecimal("50"), new BigDecimal("950"));
            Transaction account2 = transaction(2, LocalDate.of(2026, 9, 1), "CR", new BigDecimal("200"), new BigDecimal("1200"));
            when(transactionDao.fetchAll(List.of(1, 2), "2026-09-01", "2026-09-09", null, null))
                    .thenReturn(List.of(account1, account2));

            TransactionsDto result = transactionService.getUserTransactions(List.of(1, 2), "2026-09-01", "2026-09-09", null, null);

            // account1 opening: 950 + 50 = 1000, account2 opening: 1200 - 200 = 1000 -> summed = 2000
            assertThat(result.openingBalance()).isEqualByComparingTo("2000");
            // closing: 950 + 1200 = 2150
            assertThat(result.closingBalance()).isEqualByComparingTo("2150");
        }

        @Test
        @DisplayName("KNOWN BUG (see JIRA_7 Implementation notes): a null debit/credit indicator NPEs computing opening balance, even though totalDebit/totalCredit alone null-check it safely")
        void nullIndicatorThrowsWhenComputingOpeningBalance() {
            // calculateOpeningBalance calls t.isDebitOrCredit().equalsIgnoreCase(...) with no
            // null guard, unlike getTotalDebitOrCreditAmount which does Objects.nonNull(...)
            // first. This test pins down the *actual* (buggy) behavior per existing-feature
            // mode's rules - it does not assert what the code *should* do. (Note: this is a
            // separate null-safety gap from the closingBalance one below, which JIRA_8 did fix -
            // this one was left as-is, since nothing in JIRA_8's scope produces a null indicator.)
            Transaction noIndicator = transaction(1, LocalDate.of(2026, 9, 1), null, new BigDecimal("50"), new BigDecimal("950"));
            when(transactionDao.fetchAll(List.of(1), "2026-09-01", "2026-09-09", null, null))
                    .thenReturn(List.of(noIndicator));

            assertThatThrownBy(() -> transactionService.getUserTransactions(List.of(1), "2026-09-01", "2026-09-09", null, null))
                    .isInstanceOf(NullPointerException.class);
        }

        @Test
        @DisplayName("treats a null closing balance as zero instead of throwing (fixed under JIRA_8 - mutual-fund/broker transactions like Groww's have no running bank balance)")
        void treatsNullClosingBalanceAsZero() {
            Transaction noBalance = transaction(1, LocalDate.of(2026, 9, 1), "CR", new BigDecimal("50"), null);
            when(transactionDao.fetchAll(List.of(1), "2026-09-01", "2026-09-09", null, null))
                    .thenReturn(List.of(noBalance));

            TransactionsDto result = transactionService.getUserTransactions(List.of(1), "2026-09-01", "2026-09-09", null, null);

            assertThat(result.openingBalance()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(result.closingBalance()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("matches the debit/credit indicator case-insensitively")
        void matchesIndicatorCaseInsensitively() {
            Transaction lowercaseDebit = transaction(1, LocalDate.of(2026, 9, 1), "dr", new BigDecimal("50"), new BigDecimal("950"));
            when(transactionDao.fetchAll(List.of(1), "2026-09-01", "2026-09-09", null, null))
                    .thenReturn(List.of(lowercaseDebit));

            TransactionsDto result = transactionService.getUserTransactions(List.of(1), "2026-09-01", "2026-09-09", null, null);

            assertThat(result.totalDebit()).isEqualByComparingTo("50");
        }

        @Test
        @DisplayName("passes category ids and the debit/credit filter straight through to the DAO")
        void passesFiltersThroughToDao() {
            when(transactionDao.fetchAll(List.of(1), "2026-09-01", "2026-09-09", java.util.Set.of(3), "DR"))
                    .thenReturn(Collections.emptyList());

            transactionService.getUserTransactions(List.of(1), "2026-09-01", "2026-09-09", java.util.Set.of(3), "DR");

            verify(transactionDao).fetchAll(List.of(1), "2026-09-01", "2026-09-09", java.util.Set.of(3), "DR");
        }

        private Transaction transaction(int userAccountId, LocalDate date, String indicator, BigDecimal amount, BigDecimal closingBalance) {
            return Transaction.builder()
                    .transactionId("txn-" + userAccountId + "-" + date)
                    .userAccountId(userAccountId)
                    .date(date)
                    .isDebitOrCredit(indicator)
                    .debitOrCreditAmount(amount)
                    .closingBalance(closingBalance)
                    .build();
        }
    }

    @Nested
    @DisplayName("saveAll")
    class SaveAll {

        @Test
        @DisplayName("passes the transactions straight through to the DAO")
        void delegatesToDao() {
            List<Transaction> transactions = List.of(Transaction.builder().transactionId("txn-1").build());

            transactionService.saveAll(transactions);

            verify(transactionDao).saveAll(transactions);
        }
    }
}
