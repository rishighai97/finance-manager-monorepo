package com.finance.manager.transaction_service.dao;

import com.finance.manager.transaction_service.dto.Transaction;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;

import java.math.BigDecimal;
import java.sql.Date;
import java.sql.ResultSet;
import java.util.Collections;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransactionPostgresDaoTest {

    @Mock
    private NamedParameterJdbcTemplate jdbcTemplate;

    @InjectMocks
    private TransactionPostgresDao dao;

    @Nested
    @DisplayName("fetchAll")
    class FetchAll {

        @Test
        @DisplayName("maps a result row, including a comma-separated user_category_ids column, into a Transaction")
        void mapsResultRowToTransaction() throws Exception {
            ResultSet rs = mockRow("txn-1", Date.valueOf("2026-09-01"), 1, "Salary",
                    new BigDecimal("100.00"), "CR", new BigDecimal("1100.00"), 3, 5, new BigDecimal("2.5"), "1,2,3");

            when(jdbcTemplate.query(anyString(), any(SqlParameterSource.class), rowMapper()))
                    .thenAnswer(invocation -> {
                        RowMapper<Transaction> mapper = invocation.getArgument(2);
                        return List.of(mapper.mapRow(rs, 0));
                    });

            List<Transaction> result = dao.fetchAll(List.of(1), "2026-09-01", "2026-09-09", null, null);

            Transaction transaction = result.get(0);
            assertThat(transaction.transactionId()).isEqualTo("txn-1");
            assertThat(transaction.date()).isEqualTo(java.time.LocalDate.of(2026, 9, 1));
            assertThat(transaction.userCategoryIds()).containsExactlyInAnyOrder(1, 2, 3);
            assertThat(transaction.categoryId()).isEqualTo(3);
            assertThat(transaction.units()).isEqualTo(5);
        }

        @Test
        @DisplayName("defaults user_category_ids to an empty set when the column is null (no mappings yet)")
        void defaultsToEmptySetWhenNoCategoryMappings() throws Exception {
            ResultSet rs = mockRow("txn-1", Date.valueOf("2026-09-01"), 1, "Salary",
                    new BigDecimal("100.00"), "CR", new BigDecimal("1100.00"), null, null, null, null);

            when(jdbcTemplate.query(anyString(), any(SqlParameterSource.class), rowMapper()))
                    .thenAnswer(invocation -> {
                        RowMapper<Transaction> mapper = invocation.getArgument(2);
                        return List.of(mapper.mapRow(rs, 0));
                    });

            Transaction transaction = dao.fetchAll(List.of(1), "2026-09-01", "2026-09-09", null, null).get(0);

            assertThat(transaction.userCategoryIds()).isEmpty();
            assertThat(transaction.categoryId()).isNull();
        }

        @Test
        @DisplayName("wraps a null date column in a RuntimeException instead of returning a broken Transaction")
        void wrapsNullDateInRuntimeException() throws Exception {
            ResultSet rs = mockRow("txn-1", null, 1, "Salary",
                    new BigDecimal("100.00"), "CR", new BigDecimal("1100.00"), null, null, null, null);

            when(jdbcTemplate.query(anyString(), any(SqlParameterSource.class), rowMapper()))
                    .thenAnswer(invocation -> {
                        RowMapper<Transaction> mapper = invocation.getArgument(2);
                        return List.of(mapper.mapRow(rs, 0));
                    });

            assertThatThrownBy(() -> dao.fetchAll(List.of(1), "2026-09-01", "2026-09-09", null, null))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Exception occurred while converting transaction data");
        }

        @Test
        @DisplayName("returns an empty list when there are no matching transactions")
        void returnsEmptyListWhenNoRows() {
            when(jdbcTemplate.query(anyString(), any(SqlParameterSource.class), rowMapper()))
                    .thenReturn(Collections.emptyList());

            assertThat(dao.fetchAll(List.of(1), "2026-09-01", "2026-09-09", null, null)).isEmpty();
        }

        @Test
        @DisplayName("adds the category filter clause's parameter only when category ids are provided")
        void addsCategoryFilterParamOnlyWhenProvided() {
            when(jdbcTemplate.query(anyString(), any(SqlParameterSource.class), rowMapper()))
                    .thenReturn(Collections.emptyList());

            dao.fetchAll(List.of(1), "2026-09-01", "2026-09-09", Set.of(3), "DR");
            dao.fetchAll(List.of(1), "2026-09-01", "2026-09-09", null, "DR");

            // both calls should succeed without throwing regardless of whether categoryIds was supplied
            verify(jdbcTemplate, org.mockito.Mockito.times(2))
                    .query(anyString(), any(SqlParameterSource.class), rowMapper());
        }

        @SuppressWarnings("unchecked")
        private RowMapper<Transaction> rowMapper() {
            return any(RowMapper.class);
        }

        private ResultSet mockRow(String id, Date date, int userAccountId, String title, BigDecimal amount,
                                   String indicator, BigDecimal closingBalance, Integer categoryId, Integer units,
                                   BigDecimal pricePerUnit, String userCategoryIds) throws Exception {
            ResultSet rs = mock(ResultSet.class);
            when(rs.getString("id")).thenReturn(id);
            when(rs.getDate("date")).thenReturn(date);
            when(rs.getInt("user_account_id")).thenReturn(userAccountId);
            when(rs.getString("title")).thenReturn(title);
            when(rs.getBigDecimal("amount")).thenReturn(amount);
            when(rs.getString("debit_credit_indicator")).thenReturn(indicator);
            when(rs.getBigDecimal("closing_balance")).thenReturn(closingBalance);
            when(rs.getObject("category_id")).thenReturn(categoryId);
            if (categoryId != null) {
                when(rs.getInt("category_id")).thenReturn(categoryId);
            }
            when(rs.getObject("units")).thenReturn(units);
            if (units != null) {
                when(rs.getInt("units")).thenReturn(units);
            }
            when(rs.getBigDecimal("price_per_unit")).thenReturn(pricePerUnit);
            when(rs.getString("user_category_ids")).thenReturn(userCategoryIds);
            if (date == null) {
                // only read by the mapper's null-date branch, for the exception message
                when(rs.getObject("date")).thenReturn(null);
            }
            return rs;
        }
    }

    @Nested
    @DisplayName("saveAll")
    class SaveAll {

        @Test
        @DisplayName("batch-inserts every transaction")
        void batchInsertsTransactions() {
            Transaction t1 = Transaction.builder().transactionId("t1").userAccountId(1)
                    .debitOrCreditAmount(BigDecimal.TEN).isDebitOrCredit("DR").closingBalance(BigDecimal.ZERO).build();
            Transaction t2 = Transaction.builder().transactionId("t2").userAccountId(1)
                    .debitOrCreditAmount(BigDecimal.ONE).isDebitOrCredit("CR").closingBalance(BigDecimal.ONE).build();
            when(jdbcTemplate.batchUpdate(anyString(), any(MapSqlParameterSource[].class)))
                    .thenReturn(new int[]{1, 1});

            dao.saveAll(List.of(t1, t2));

            verify(jdbcTemplate).batchUpdate(anyString(), any(MapSqlParameterSource[].class));
        }

        @Test
        @DisplayName("does nothing for an empty list, without calling the JDBC template")
        void doesNothingForEmptyList() {
            dao.saveAll(Collections.emptyList());

            verify(jdbcTemplate, never()).batchUpdate(anyString(), any(MapSqlParameterSource[].class));
        }

        @Test
        @DisplayName("does nothing for a null list")
        void doesNothingForNullList() {
            dao.saveAll(null);

            verify(jdbcTemplate, never()).batchUpdate(anyString(), any(MapSqlParameterSource[].class));
        }
    }
}
