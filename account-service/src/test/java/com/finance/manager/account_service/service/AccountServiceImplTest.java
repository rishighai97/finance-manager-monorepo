package com.finance.manager.account_service.service;

import com.finance.manager.account_service.dao.AccountDao;
import com.finance.manager.account_service.dto.Account;
import com.finance.manager.account_service.dto.GroupedAccount;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccountServiceImplTest {

    @Mock
    private AccountDao dao;

    @InjectMocks
    private AccountServiceImpl accountService;

    @Nested
    @DisplayName("getAllAccounts")
    class GetAllAccounts {

        @Test
        @DisplayName("returns whatever the DAO returns, unchanged")
        void delegatesToDao() {
            List<Account> accounts = List.of(Account.builder().accountId(1).accountName("HDFC").build());
            when(dao.getAllAccounts()).thenReturn(accounts);

            List<Account> result = accountService.getAllAccounts();

            assertThat(result).isEqualTo(accounts);
        }

        @Test
        @DisplayName("returns an empty list when the DAO has nothing")
        void returnsEmptyListWhenDaoIsEmpty() {
            when(dao.getAllAccounts()).thenReturn(Collections.emptyList());

            assertThat(accountService.getAllAccounts()).isEmpty();
        }
    }

    @Nested
    @DisplayName("getAllGroupedAccounts")
    class GetAllGroupedAccounts {

        @Test
        @DisplayName("groups the DAO's accounts by account type")
        void groupsAccountsFromDao() {
            Account hdfc = Account.builder().accountId(1).accountName("HDFC").accountType1("Assets").accountType2("Bank").build();
            when(dao.getAllAccounts()).thenReturn(List.of(hdfc));

            List<GroupedAccount> result = accountService.getAllGroupedAccounts();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).accounts()).containsExactly(hdfc);
            verify(dao).getAllAccounts();
        }

        @Test
        @DisplayName("returns an empty list when the DAO has no accounts to group")
        void returnsEmptyListWhenNoAccounts() {
            when(dao.getAllAccounts()).thenReturn(Collections.emptyList());

            assertThat(accountService.getAllGroupedAccounts()).isEmpty();
        }
    }
}
