package com.finance.manager.account_service.controller;

import com.finance.manager.account_service.dto.Account;
import com.finance.manager.account_service.dto.GroupedAccount;
import com.finance.manager.account_service.service.AccountService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccountControllerTest {

    @Mock
    private AccountService service;

    @InjectMocks
    private AccountController controller;

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
    @DisplayName("fetchAllAccounts")
    class FetchAllAccounts {

        @Test
        @DisplayName("returns the accounts from the service")
        void returnsAccountsFromService() {
            List<Account> accounts = List.of(Account.builder().accountId(1).accountName("HDFC").build());
            when(service.getAllAccounts()).thenReturn(accounts);

            assertThat(controller.fetchAllAccounts()).isEqualTo(accounts);
        }

        @Test
        @DisplayName("returns an empty list when the service has no accounts")
        void returnsEmptyListWhenNoAccounts() {
            when(service.getAllAccounts()).thenReturn(Collections.emptyList());

            assertThat(controller.fetchAllAccounts()).isEmpty();
        }
    }

    @Nested
    @DisplayName("fetchAllGroupedAccounts")
    class FetchAllGroupedAccounts {

        @Test
        @DisplayName("returns the grouped accounts from the service")
        void returnsGroupedAccountsFromService() {
            List<GroupedAccount> grouped = List.of(GroupedAccount.builder().level1Title("Assets").accounts(List.of()).build());
            when(service.getAllGroupedAccounts()).thenReturn(grouped);

            assertThat(controller.fetchAllGroupedAccounts()).isEqualTo(grouped);
        }
    }
}
