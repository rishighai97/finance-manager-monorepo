package com.finance.manager.account_service.util;

import com.finance.manager.account_service.dto.Account;
import com.finance.manager.account_service.dto.GroupedAccount;
import com.finance.manager.account_service.dto.GroupedUserAccount;
import com.finance.manager.account_service.dto.UserAccount;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class AccountGrouperTest {

    @Nested
    @DisplayName("groupAccounts")
    class GroupAccounts {

        @Test
        @DisplayName("groups accounts sharing the same level 1/level 2 into one row")
        void groupsAccountsByLevel1AndLevel2() {
            Account savings1 = accountWithType(1, "HDFC Savings", "Assets", "Bank");
            Account savings2 = accountWithType(2, "ICICI Savings", "Assets", "Bank");
            Account mutualFund = accountWithType(3, "Zerodha", "Assets", "Investments");

            List<GroupedAccount> grouped = AccountGrouper.groupAccounts(List.of(savings1, savings2, mutualFund));

            assertThat(grouped).hasSize(2);
            GroupedAccount bankGroup = grouped.stream()
                    .filter(g -> "Bank".equals(g.level2Title()))
                    .findFirst()
                    .orElseThrow();
            assertThat(bankGroup.level1Title()).isEqualTo("Assets");
            assertThat(bankGroup.accounts()).containsExactlyInAnyOrder(savings1, savings2);

            GroupedAccount investmentsGroup = grouped.stream()
                    .filter(g -> "Investments".equals(g.level2Title()))
                    .findFirst()
                    .orElseThrow();
            assertThat(investmentsGroup.accounts()).containsExactly(mutualFund);
        }

        @Test
        @DisplayName("returns an empty list when given no accounts")
        void returnsEmptyListForEmptyInput() {
            List<GroupedAccount> grouped = AccountGrouper.groupAccounts(Collections.emptyList());

            assertThat(grouped).isEmpty();
        }

        @Test
        @DisplayName("keeps a null level 2 title as its own group rather than dropping the account")
        void toleratesNullLevel2Title() {
            Account noSubtype = accountWithType(1, "Misc", "Assets", null);

            List<GroupedAccount> grouped = AccountGrouper.groupAccounts(List.of(noSubtype));

            assertThat(grouped).hasSize(1);
            assertThat(grouped.get(0).level2Title()).isNull();
            assertThat(grouped.get(0).accounts()).containsExactly(noSubtype);
        }

        @Test
        @DisplayName("the returned accounts list is unmodifiable")
        void returnedAccountsListIsUnmodifiable() {
            List<GroupedAccount> grouped = AccountGrouper.groupAccounts(
                    List.of(accountWithType(1, "HDFC", "Assets", "Bank")));

            assertThat(grouped.get(0).accounts())
                    .as("GroupedAccount.accounts() should be defensively unmodifiable")
                    .isUnmodifiable();
        }

        private Account accountWithType(int id, String name, String level1, String level2) {
            return Account.builder()
                    .accountId(id)
                    .accountName(name)
                    .accountType1(level1)
                    .accountType2(level2)
                    .build();
        }
    }

    @Nested
    @DisplayName("groupUserAccounts")
    class GroupUserAccounts {

        @Test
        @DisplayName("sums level 2 balances and rolls them up into the level 1 total")
        void sumsBalancesAtBothLevels() {
            UserAccount hdfc = userAccountWithBalance(1, "Assets", "Bank", new BigDecimal("100.00"));
            UserAccount icici = userAccountWithBalance(2, "Assets", "Bank", new BigDecimal("50.00"));
            UserAccount zerodha = userAccountWithBalance(3, "Assets", "Investments", new BigDecimal("200.00"));

            List<GroupedUserAccount> grouped = AccountGrouper.groupUserAccounts(List.of(hdfc, icici, zerodha));

            GroupedUserAccount bankGroup = grouped.stream()
                    .filter(g -> "Bank".equals(g.level2Title()))
                    .findFirst()
                    .orElseThrow();
            assertThat(bankGroup.level2Amount()).isEqualByComparingTo("150.00");
            assertThat(bankGroup.level1Amount()).isEqualByComparingTo("350.00");

            GroupedUserAccount investmentsGroup = grouped.stream()
                    .filter(g -> "Investments".equals(g.level2Title()))
                    .findFirst()
                    .orElseThrow();
            assertThat(investmentsGroup.level2Amount()).isEqualByComparingTo("200.00");
            assertThat(investmentsGroup.level1Amount()).isEqualByComparingTo("350.00");
        }

        @Test
        @DisplayName("treats a null latest balance as zero rather than throwing")
        void treatsNullBalanceAsZero() {
            UserAccount noBalanceYet = userAccountWithBalance(1, "Assets", "Bank", null);

            List<GroupedUserAccount> grouped = AccountGrouper.groupUserAccounts(List.of(noBalanceYet));

            assertThat(grouped).hasSize(1);
            assertThat(grouped.get(0).level2Amount()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(grouped.get(0).level1Amount()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("returns an empty list when given no user accounts")
        void returnsEmptyListForEmptyInput() {
            List<GroupedUserAccount> grouped = AccountGrouper.groupUserAccounts(Collections.emptyList());

            assertThat(grouped).isEmpty();
        }

        private UserAccount userAccountWithBalance(int id, String level1, String level2, BigDecimal balance) {
            return UserAccount.builder()
                    .userAccountId(id)
                    .accountType1(level1)
                    .accountType2(level2)
                    .latestBalance(balance)
                    .latestBalanceDate(balance == null ? null : "2026-09-09")
                    .build();
        }
    }
}
