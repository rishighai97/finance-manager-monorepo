package com.finance.manager.account_service.service;

import com.finance.manager.account_service.dao.UserAccountDao;
import com.finance.manager.account_service.dto.GroupedUserAccount;
import com.finance.manager.account_service.dto.UserAccount;
import com.finance.manager.account_service.dto.UserAccountEditRequest;
import com.finance.manager.account_service.dto.UserAccountSaveRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserAccountServiceImplTest {

    @Mock
    private UserAccountDao dao;

    @InjectMocks
    private UserAccountServiceImpl userAccountService;

    @Nested
    @DisplayName("getAllAccounts")
    class GetAllAccounts {

        @Test
        @DisplayName("returns whatever the DAO returns for the given user ids")
        void delegatesToDao() {
            List<Integer> userIds = List.of(1, 2);
            List<UserAccount> accounts = List.of(UserAccount.builder().userAccountId(1).userId(1).build());
            when(dao.getAllAccounts(userIds)).thenReturn(accounts);

            assertThat(userAccountService.getAllAccounts(userIds)).isEqualTo(accounts);
        }

        @Test
        @DisplayName("returns an empty list when the DAO finds no accounts for those users")
        void returnsEmptyListWhenNoneFound() {
            when(dao.getAllAccounts(List.of(999))).thenReturn(Collections.emptyList());

            assertThat(userAccountService.getAllAccounts(List.of(999))).isEmpty();
        }
    }

    @Nested
    @DisplayName("getAllGroupedAccounts")
    class GetAllGroupedAccounts {

        @Test
        @DisplayName("groups the DAO's user accounts by account type")
        void groupsAccountsFromDao() {
            UserAccount hdfc = UserAccount.builder()
                    .userAccountId(1).userId(1)
                    .accountType1("Assets").accountType2("Bank")
                    .latestBalance(new BigDecimal("100.00"))
                    .build();
            when(dao.getAllAccounts(List.of(1))).thenReturn(List.of(hdfc));

            List<GroupedUserAccount> result = userAccountService.getAllGroupedAccounts(List.of(1));

            assertThat(result).hasSize(1);
            assertThat(result.get(0).level2Amount()).isEqualByComparingTo("100.00");
        }
    }

    @Nested
    @DisplayName("saveUserAccount")
    class SaveUserAccount {

        @Test
        @DisplayName("returns the new user account id from the DAO")
        void returnsNewIdFromDao() {
            UserAccountSaveRequest request = UserAccountSaveRequest.builder()
                    .userId(1).accountId(6).userAccountName("My Savings").build();
            when(dao.saveUserAccount(request)).thenReturn(42);

            assertThat(userAccountService.saveUserAccount(request)).isEqualTo(42);
        }
    }

    @Nested
    @DisplayName("deleteUserAccount")
    class DeleteUserAccount {

        @Test
        @DisplayName("deletes transaction categories and transactions before the user account itself")
        void deletesInDependencyOrder() {
            userAccountService.deleteUserAccount(7);

            InOrder order = inOrder(dao);
            order.verify(dao).deleteTransactionCategories(7);
            order.verify(dao).deleteTransactions(7);
            order.verify(dao).deleteUserAccount(7);
        }
    }

    @Nested
    @DisplayName("editUserAccountName")
    class EditUserAccountName {

        @Test
        @DisplayName("passes the edit request straight through to the DAO")
        void delegatesToDao() {
            UserAccountEditRequest request = UserAccountEditRequest.builder()
                    .userAccountId(7).newUserAccountName("Renamed").build();

            userAccountService.editUserAccountName(request);

            verify(dao).editUserAccountName(request);
            verify(dao, never()).deleteUserAccount(anyInt());
        }
    }
}
