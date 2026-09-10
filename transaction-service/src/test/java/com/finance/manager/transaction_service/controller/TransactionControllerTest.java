package com.finance.manager.transaction_service.controller;

import com.finance.manager.transaction_service.dto.Transaction;
import com.finance.manager.transaction_service.dto.TransactionsDto;
import com.finance.manager.transaction_service.service.TransactionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransactionControllerTest {

    @Mock
    private TransactionService transactionService;

    @InjectMocks
    private TransactionController controller;

    @Nested
    @DisplayName("healthcheck")
    class Healthcheck {

        @Test
        @DisplayName("returns status OK without touching the service")
        void returnsStatusOk() {
            assertThat(controller.healthcheck()).isEqualTo(Map.of("status", "OK"));
        }
    }

    @Nested
    @DisplayName("saveAll")
    class SaveAll {

        @Test
        @DisplayName("passes the transactions straight through to the service")
        void delegatesToService() {
            List<Transaction> transactions = List.of(Transaction.builder().transactionId("t1").build());

            controller.saveAll(transactions);

            verify(transactionService).saveAll(transactions);
        }
    }

    @Nested
    @DisplayName("fetchAllTransactionsByUserIdsStartDateAndEndDate")
    class FetchAllTransactions {

        @Test
        @DisplayName("returns 200 with the service's result for a valid request")
        void returnsTransactionsForValidRequest() {
            TransactionsDto dto = TransactionsDto.builder().startDate("2026-09-01").endDate("2026-09-09").build();
            when(transactionService.getUserTransactions(List.of(1), "2026-09-01", "2026-09-09", null, null))
                    .thenReturn(dto);

            ResponseEntity<TransactionsDto> response = controller.fetchAllTransactionsByUserIdsStartDateAndEndDate(
                    List.of("1"), "2026-09-01", "2026-09-09", null, null);

            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isEqualTo(dto);
        }

        @Test
        @DisplayName("rejects a null user_account_ids list with a 400 before calling the service")
        void rejectsNullUserAccountIds() {
            assertThatThrownBy(() -> controller.fetchAllTransactionsByUserIdsStartDateAndEndDate(
                    null, "2026-09-01", "2026-09-09", null, null))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("Please pass valid list of user_account_ids");
        }

        @Test
        @DisplayName("rejects a non-numeric user_account_id with a 400")
        void rejectsNonNumericUserAccountId() {
            assertThatThrownBy(() -> controller.fetchAllTransactionsByUserIdsStartDateAndEndDate(
                    List.of("not-a-number"), "2026-09-01", "2026-09-09", null, null))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("Invalid user_account_ids");
        }

        @Test
        @DisplayName("rejects a null start_date with a 400")
        void rejectsNullStartDate() {
            assertThatThrownBy(() -> controller.fetchAllTransactionsByUserIdsStartDateAndEndDate(
                    List.of("1"), null, "2026-09-09", null, null))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("Please pass valid date");
        }

        @Test
        @DisplayName("rejects a malformed date with a 400")
        void rejectsMalformedDate() {
            assertThatThrownBy(() -> controller.fetchAllTransactionsByUserIdsStartDateAndEndDate(
                    List.of("1"), "09/01/2026", "2026-09-09", null, null))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("Invalid date passed in request");
        }

        @Test
        @DisplayName("rejects a non-numeric category id with a 400")
        void rejectsNonNumericCategoryId() {
            assertThatThrownBy(() -> controller.fetchAllTransactionsByUserIdsStartDateAndEndDate(
                    List.of("1"), "2026-09-01", "2026-09-09", List.of("not-a-number"), null))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("Invalid category_ids");
        }

        @Test
        @DisplayName("parses valid category ids and passes them through as a Set")
        void parsesValidCategoryIds() {
            TransactionsDto dto = TransactionsDto.builder().build();
            when(transactionService.getUserTransactions(List.of(1), "2026-09-01", "2026-09-09", java.util.Set.of(3, 4), "DR"))
                    .thenReturn(dto);

            ResponseEntity<TransactionsDto> response = controller.fetchAllTransactionsByUserIdsStartDateAndEndDate(
                    List.of("1"), "2026-09-01", "2026-09-09", List.of("3", "4"), "DR");

            assertThat(response.getBody()).isEqualTo(dto);
        }
    }
}
