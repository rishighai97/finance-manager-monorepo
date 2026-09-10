package com.finance.manager.account_service.controller;

import com.finance.manager.account_service.dto.UserAccount;
import com.finance.manager.account_service.dto.UserAccountEditRequest;
import com.finance.manager.account_service.dto.UserAccountSaveRequest;
import com.finance.manager.account_service.service.UserAccountService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserAccountControllerTest {

    @Mock
    private UserAccountService service;

    @InjectMocks
    private UserAccountController controller;

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
    @DisplayName("fetchAllAccountsByUserIds")
    class FetchAllAccountsByUserIds {

        @Test
        @DisplayName("returns the service's accounts when user_ids is present")
        void returnsAccountsForValidUserIds() {
            List<UserAccount> accounts = List.of(UserAccount.builder().userAccountId(1).userId(1).build());
            when(service.getAllAccounts(List.of(1))).thenReturn(accounts);

            assertThat(controller.fetchAllAccountsByUserIds(List.of(1))).isEqualTo(accounts);
        }

        @Test
        @DisplayName("rejects a null user_ids list with a 400 before calling the service")
        void rejectsNullUserIds() {
            assertThatThrownBy(() -> controller.fetchAllAccountsByUserIds(null))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("Please pass user_account_ids in request");
            verify(service, never()).getAllAccounts(org.mockito.ArgumentMatchers.anyList());
        }

        @Test
        @DisplayName("rejects an empty user_ids list with a 400")
        void rejectsEmptyUserIds() {
            assertThatThrownBy(() -> controller.fetchAllAccountsByUserIds(Collections.emptyList()))
                    .isInstanceOf(ResponseStatusException.class);
        }
    }

    @Nested
    @DisplayName("fetchAllGroupedAccountsByUserIds")
    class FetchAllGroupedAccountsByUserIds {

        @Test
        @DisplayName("rejects an empty user_ids list with a 400 before calling the service")
        void rejectsEmptyUserIds() {
            assertThatThrownBy(() -> controller.fetchAllGroupedAccountsByUserIds(Collections.emptyList()))
                    .isInstanceOf(ResponseStatusException.class);
            verify(service, never()).getAllGroupedAccounts(org.mockito.ArgumentMatchers.anyList());
        }
    }

    @Nested
    @DisplayName("saveUserAccount")
    class SaveUserAccount {

        @Test
        @DisplayName("returns 200 with the new id for a valid request")
        void savesValidRequest() {
            UserAccountSaveRequest request = UserAccountSaveRequest.builder()
                    .userId(1).accountId(6).userAccountName("My Savings").build();
            when(service.saveUserAccount(request)).thenReturn(42);

            ResponseEntity<Integer> response = controller.saveUserAccount(request);

            assertThat(response.getStatusCode().value()).isEqualTo(200);
            assertThat(response.getBody()).isEqualTo(42);
        }

        @Test
        @DisplayName("rejects a non-positive user id with a 400 before calling the service")
        void rejectsNonPositiveUserId() {
            UserAccountSaveRequest request = UserAccountSaveRequest.builder()
                    .userId(0).accountId(6).userAccountName("My Savings").build();

            assertThatThrownBy(() -> controller.saveUserAccount(request))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("User ID must be a positive integer");
            verify(service, never()).saveUserAccount(org.mockito.ArgumentMatchers.any());
        }

        @Test
        @DisplayName("rejects a non-positive account id with a 400")
        void rejectsNonPositiveAccountId() {
            UserAccountSaveRequest request = UserAccountSaveRequest.builder()
                    .userId(1).accountId(-1).userAccountName("My Savings").build();

            assertThatThrownBy(() -> controller.saveUserAccount(request))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("Account ID must be a positive integer");
        }

        @Test
        @DisplayName("rejects a blank account name with a 400")
        void rejectsBlankAccountName() {
            UserAccountSaveRequest request = UserAccountSaveRequest.builder()
                    .userId(1).accountId(6).userAccountName("   ").build();

            assertThatThrownBy(() -> controller.saveUserAccount(request))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("Account userAccountName is required");
        }

        @Test
        @DisplayName("rejects a null account name with a 400")
        void rejectsNullAccountName() {
            UserAccountSaveRequest request = UserAccountSaveRequest.builder()
                    .userId(1).accountId(6).userAccountName(null).build();

            assertThatThrownBy(() -> controller.saveUserAccount(request))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("Account userAccountName is required");
        }
    }

    @Nested
    @DisplayName("deleteUserAccount")
    class DeleteUserAccount {

        @Test
        @DisplayName("returns 200 and deletes for a valid id")
        void deletesValidId() {
            ResponseEntity<Void> response = controller.deleteUserAccount(7);

            assertThat(response.getStatusCode().value()).isEqualTo(200);
            verify(service).deleteUserAccount(7);
        }

        @Test
        @DisplayName("rejects a non-positive id with a 400 before calling the service")
        void rejectsNonPositiveId() {
            assertThatThrownBy(() -> controller.deleteUserAccount(0))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("User account ID must be a positive integer");
            verify(service, never()).deleteUserAccount(org.mockito.ArgumentMatchers.anyInt());
        }
    }

    @Nested
    @DisplayName("editUserAccountName")
    class EditUserAccountName {

        @Test
        @DisplayName("returns 200 for a valid request")
        void editsValidRequest() {
            UserAccountEditRequest request = UserAccountEditRequest.builder()
                    .userAccountId(7).newUserAccountName("Renamed").build();

            ResponseEntity<Void> response = controller.editUserAccountName(request);

            assertThat(response.getStatusCode().value()).isEqualTo(200);
            verify(service).editUserAccountName(request);
        }

        @Test
        @DisplayName("rejects a non-positive user account id with a 400")
        void rejectsNonPositiveId() {
            UserAccountEditRequest request = UserAccountEditRequest.builder()
                    .userAccountId(-1).newUserAccountName("Renamed").build();

            assertThatThrownBy(() -> controller.editUserAccountName(request))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("User account ID must be a positive integer");
        }

        @Test
        @DisplayName("rejects a blank new name with a 400")
        void rejectsBlankNewName() {
            UserAccountEditRequest request = UserAccountEditRequest.builder()
                    .userAccountId(7).newUserAccountName(" ").build();

            assertThatThrownBy(() -> controller.editUserAccountName(request))
                    .isInstanceOf(ResponseStatusException.class)
                    .hasMessageContaining("New account name is required");
        }
    }
}
