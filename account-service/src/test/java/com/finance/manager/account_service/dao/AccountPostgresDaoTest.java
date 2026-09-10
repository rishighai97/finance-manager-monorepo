package com.finance.manager.account_service.dao;

import com.finance.manager.account_service.dto.Account;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

import java.sql.ResultSet;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccountPostgresDaoTest {

    @Mock
    private NamedParameterJdbcTemplate jdbcTemplate;

    @InjectMocks
    private AccountPostgresDao dao;

    @Nested
    @DisplayName("getAllAccounts")
    class GetAllAccounts {

        @Test
        @DisplayName("maps each result row into an Account, including the aggregated statement extensions")
        void mapsResultRowsToAccounts() throws Exception {
            ResultSet resultSet = mockRowFor(
                    1, "HDFC Savings", 3, "xls,csv", "bank-icon", "Assets", "Bank", "Savings");

            when(jdbcTemplate.query(anyString(), ArgumentMatchersHelper.<Account>rowMapper()))
                    .thenAnswer(invocation -> {
                        RowMapper<Account> mapper = invocation.getArgument(1);
                        return List.of(mapper.mapRow(resultSet, 0));
                    });

            List<Account> accounts = dao.getAllAccounts();

            assertThat(accounts).hasSize(1);
            Account account = accounts.get(0);
            assertThat(account.accountId()).isEqualTo(1);
            assertThat(account.accountName()).isEqualTo("HDFC Savings");
            assertThat(account.accountTypeId()).isEqualTo(3);
            assertThat(account.statementFileExtensions()).isEqualTo("xls,csv");
            assertThat(account.icon()).isEqualTo("bank-icon");
            assertThat(account.accountType1()).isEqualTo("Assets");
            assertThat(account.accountType2()).isEqualTo("Bank");
            assertThat(account.accountType3()).isEqualTo("Savings");
        }

        @Test
        @DisplayName("returns an empty list when there are no accounts in the database")
        void returnsEmptyListWhenNoRows() {
            when(jdbcTemplate.query(anyString(), ArgumentMatchersHelper.<Account>rowMapper()))
                    .thenReturn(Collections.emptyList());

            assertThat(dao.getAllAccounts()).isEmpty();
        }

        private ResultSet mockRowFor(int id, String name, int typeId, String extensions, String icon,
                                      String type1, String type2, String type3) throws Exception {
            ResultSet rs = org.mockito.Mockito.mock(ResultSet.class);
            when(rs.getInt("account_id")).thenReturn(id);
            when(rs.getString("account_name")).thenReturn(name);
            when(rs.getInt("account_type_id")).thenReturn(typeId);
            when(rs.getString("statement_file_extensions")).thenReturn(extensions);
            when(rs.getString("icon")).thenReturn(icon);
            when(rs.getString("account_type_1")).thenReturn(type1);
            when(rs.getString("account_type_2")).thenReturn(type2);
            when(rs.getString("account_type_3")).thenReturn(type3);
            return rs;
        }
    }

    /**
     * Mockito's generic RowMapper<T> matcher needs a small helper so
     * `any(RowMapper.class)` type-checks cleanly against the generic method
     * signature used by NamedParameterJdbcTemplate#query.
     */
    private static final class ArgumentMatchersHelper {
        @SuppressWarnings("unchecked")
        static <T> RowMapper<T> rowMapper() {
            return any(RowMapper.class);
        }
    }
}
