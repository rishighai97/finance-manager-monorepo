package com.finance.manager.account_service.dao;

import com.finance.manager.account_service.dto.UserAccount;
import com.finance.manager.account_service.dto.UserAccountEditRequest;
import com.finance.manager.account_service.dto.UserAccountSaveRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.core.namedparam.SqlParameterSource;
import org.springframework.jdbc.support.KeyHolder;

import java.math.BigDecimal;
import java.sql.Date;
import java.sql.ResultSet;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserAccountPostgresDaoTest {

    @Mock
    private NamedParameterJdbcTemplate jdbcTemplate;

    @InjectMocks
    private UserAccountPostgresDao dao;

    @Nested
    @DisplayName("getAllAccounts")
    class GetAllAccounts {

        @Test
        @DisplayName("defaults the latest balance to zero and the balance date to null when there are no transactions yet")
        void defaultsBalanceWhenNoTransactionsExist() throws Exception {
            ResultSet rs = mock(ResultSet.class);
            when(rs.getInt("user_account_id")).thenReturn(1);
            when(rs.getInt("account_id")).thenReturn(6);
            when(rs.getInt("user_id")).thenReturn(1);
            when(rs.getString("user_account_name")).thenReturn("My Savings");
            when(rs.getInt("account_type_id")).thenReturn(3);
            when(rs.getString("account_name")).thenReturn("HDFC");
            when(rs.getString("statement_file_extensions")).thenReturn(null);
            when(rs.getString("icon")).thenReturn("icon");
            when(rs.getString("account_type_1")).thenReturn("Assets");
            when(rs.getString("account_type_2")).thenReturn("Bank");
            when(rs.getString("account_type_3")).thenReturn("Savings");
            when(rs.getObject("closing_balance")).thenReturn(null);
            when(rs.getObject("closing_balance_date")).thenReturn(null);

            when(jdbcTemplate.query(anyString(), any(SqlParameterSource.class), rowMapper()))
                    .thenAnswer(invocation -> {
                        RowMapper<UserAccount> mapper = invocation.getArgument(2);
                        return List.of(mapper.mapRow(rs, 0));
                    });

            List<UserAccount> accounts = dao.getAllAccounts(List.of(1));

            assertThat(accounts).hasSize(1);
            assertThat(accounts.get(0).latestBalance()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(accounts.get(0).latestBalanceDate()).isNull();
        }

        @Test
        @DisplayName("maps the latest closing balance and its date when transactions exist")
        void mapsBalanceWhenTransactionsExist() throws Exception {
            ResultSet rs = mock(ResultSet.class);
            when(rs.getInt("user_account_id")).thenReturn(1);
            when(rs.getInt("account_id")).thenReturn(6);
            when(rs.getInt("user_id")).thenReturn(1);
            when(rs.getString("user_account_name")).thenReturn("My Savings");
            when(rs.getInt("account_type_id")).thenReturn(3);
            when(rs.getString("account_name")).thenReturn("HDFC");
            when(rs.getString("statement_file_extensions")).thenReturn("xls");
            when(rs.getString("icon")).thenReturn("icon");
            when(rs.getString("account_type_1")).thenReturn("Assets");
            when(rs.getString("account_type_2")).thenReturn("Bank");
            when(rs.getString("account_type_3")).thenReturn("Savings");
            when(rs.getObject("closing_balance")).thenReturn(new BigDecimal("500.00"));
            when(rs.getBigDecimal("closing_balance")).thenReturn(new BigDecimal("500.00"));
            when(rs.getObject("closing_balance_date")).thenReturn(Date.valueOf("2026-09-09"));
            when(rs.getDate("closing_balance_date")).thenReturn(Date.valueOf("2026-09-09"));

            when(jdbcTemplate.query(anyString(), any(SqlParameterSource.class), rowMapper()))
                    .thenAnswer(invocation -> {
                        RowMapper<UserAccount> mapper = invocation.getArgument(2);
                        return List.of(mapper.mapRow(rs, 0));
                    });

            List<UserAccount> accounts = dao.getAllAccounts(List.of(1));

            assertThat(accounts.get(0).latestBalance()).isEqualByComparingTo("500.00");
            assertThat(accounts.get(0).latestBalanceDate()).isEqualTo("2026-09-09");
        }

        @SuppressWarnings("unchecked")
        private RowMapper<UserAccount> rowMapper() {
            return any(RowMapper.class);
        }
    }

    @Nested
    @DisplayName("saveUserAccount")
    class SaveUserAccount {

        @Test
        @DisplayName("returns the generated id from the insert")
        void returnsGeneratedId() {
            UserAccountSaveRequest request = UserAccountSaveRequest.builder()
                    .userId(1).accountId(6).userAccountName("My Savings").build();

            when(jdbcTemplate.update(anyString(), any(SqlParameterSource.class), any(KeyHolder.class)))
                    .thenAnswer(invocation -> {
                        KeyHolder keyHolder = invocation.getArgument(2);
                        keyHolder.getKeyList().add(Map.of("id", 42));
                        return 1;
                    });

            assertThat(dao.saveUserAccount(request)).isEqualTo(42);
        }
    }

    @Nested
    @DisplayName("editUserAccountName")
    class EditUserAccountName {

        @Test
        @DisplayName("updates without throwing when a matching row is found")
        void updatesExistingRow() {
            when(jdbcTemplate.update(anyString(), any(SqlParameterSource.class))).thenReturn(1);

            dao.editUserAccountName(UserAccountEditRequest.builder()
                    .userAccountId(7).newUserAccountName("Renamed").build());
        }

        @Test
        @DisplayName("does not throw when no row matches the given id (logs a warning instead)")
        void toleratesNoMatchingRow() {
            when(jdbcTemplate.update(anyString(), any(SqlParameterSource.class))).thenReturn(0);

            dao.editUserAccountName(UserAccountEditRequest.builder()
                    .userAccountId(999).newUserAccountName("Renamed").build());
        }
    }

    @Nested
    @DisplayName("deleteUserAccount")
    class DeleteUserAccount {

        @Test
        @DisplayName("does not throw when no row matches the given id (logs a warning instead)")
        void toleratesNoMatchingRow() {
            when(jdbcTemplate.update(anyString(), any(SqlParameterSource.class))).thenReturn(0);

            dao.deleteUserAccount(999);
        }

        @Test
        @DisplayName("deletes without throwing when a matching row is found")
        void deletesExistingRow() {
            when(jdbcTemplate.update(anyString(), any(SqlParameterSource.class))).thenReturn(1);

            dao.deleteUserAccount(7);
        }
    }

    @Nested
    @DisplayName("deleteTransactions and deleteTransactionCategories")
    class DeleteDependents {

        @Test
        @DisplayName("both run without throwing regardless of how many rows were affected")
        void runWithoutThrowing() {
            when(jdbcTemplate.update(anyString(), any(SqlParameterSource.class))).thenReturn(0);

            dao.deleteTransactionCategories(7);
            dao.deleteTransactions(7);
        }
    }
}
