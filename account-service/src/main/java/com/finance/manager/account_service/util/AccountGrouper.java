package com.finance.manager.account_service.util;

import com.finance.manager.account_service.dto.Account;
import com.finance.manager.account_service.dto.GroupedAccount;
import com.finance.manager.account_service.dto.GroupedUserAccount;
import com.finance.manager.account_service.dto.UserAccount;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class AccountGrouper {

    /**
     * Groups Account objects by account type levels
     *
     * @param accounts List of accounts to group
     * @return List of grouped accounts
     */
    public static List<GroupedAccount> groupAccounts(List<Account> accounts) {
        // Using a map of maps to organize accounts by level 1 and level 2
        Map<String, Map<String, List<Account>>> groupedAccounts = new HashMap<>();

        // Group accounts by level 1 and level 2
        for (Account account : accounts) {
            String level1 = account.accountType1();
            String level2 = account.accountType2();

            // Add account to the appropriate group
            groupedAccounts.computeIfAbsent(level1, k -> new HashMap<>())
                    .computeIfAbsent(level2, k -> new ArrayList<>())
                    .add(account);
        }

        // List to store the final GroupedAccount objects
        List<GroupedAccount> result = new ArrayList<>();

        // Create GroupedAccount objects for each group
        for (Map.Entry<String, Map<String, List<Account>>> level1Entry : groupedAccounts.entrySet()) {
            String level1Title = level1Entry.getKey();

            for (Map.Entry<String, List<Account>> level2Entry : level1Entry.getValue().entrySet()) {
                String level2Title = level2Entry.getKey();
                List<Account> accountList = level2Entry.getValue();

                // Create a GroupedAccount for this group (without amount fields)
                GroupedAccount groupedAccount = GroupedAccount.builder()
                        .level1Title(level1Title)
                        .level2Title(level2Title)
                        .accounts(accountList)
                        .build();

                result.add(groupedAccount);
            }
        }

        return result;
    }

    /**
     * Groups UserAccount objects by account type levels
     *
     * @param userAccounts List of user accounts to group
     * @return List of grouped user accounts
     */
    public static List<GroupedUserAccount> groupUserAccounts(List<UserAccount> userAccounts) {
        // Using a map of maps to organize accounts by level 1 and level 2
        Map<String, Map<String, List<UserAccount>>> groupedAccounts = new HashMap<>();

        // Group accounts by level 1 and level 2
        for (UserAccount account : userAccounts) {
            String level1 = account.accountType1();
            String level2 = account.accountType2();

            // Add account to the appropriate group
            groupedAccounts.computeIfAbsent(level1, k -> new HashMap<>())
                    .computeIfAbsent(level2, k -> new ArrayList<>())
                    .add(account);
        }

        // List to store the final GroupedUserAccount objects
        List<GroupedUserAccount> groupedAccountsWithoutLevel1Amounts = new ArrayList<>();
        // Map to track level 1 totals
        Map<String, BigDecimal> level1Amounts = new HashMap<>();

        // Calculate level 2 totals, create GroupedUserAccount objects
        for (Map.Entry<String, Map<String, List<UserAccount>>> level1Entry : groupedAccounts.entrySet()) {
            String level1Title = level1Entry.getKey();
            BigDecimal level1Total = BigDecimal.ZERO;

            for (Map.Entry<String, List<UserAccount>> level2Entry : level1Entry.getValue().entrySet()) {
                String level2Title = level2Entry.getKey();
                List<UserAccount> userAccountList = level2Entry.getValue();
                BigDecimal level2Total = BigDecimal.ZERO;

                // Sum up balances for level_2 total
                for (UserAccount account : userAccountList) {
                    level2Total = level2Total.add(account.latestBalance() != null ? account.latestBalance() : BigDecimal.ZERO);
                }

                // Add to level_1 total
                level1Total = level1Total.add(level2Total);

                // Get the date from the first account
                String date = userAccountList.isEmpty() ? null : userAccountList.get(0).latestBalanceDate();

                // Create a GroupedUserAccount for this level_2 group
                GroupedUserAccount groupedAccount = GroupedUserAccount.builder()
                        .level1Title(level1Title)
                        .level2Title(level2Title)
                        .level2Amount(level2Total)
                        .date(date)
                        .userAccounts(userAccountList)
                        .build();

                groupedAccountsWithoutLevel1Amounts.add(groupedAccount);
            }

            // Store level1Title total for updating later
            level1Amounts.put(level1Title, level1Total);
        }

        // Update level_1_amount with correct totals
        List<GroupedUserAccount> result = new ArrayList<>();
        for (GroupedUserAccount account : groupedAccountsWithoutLevel1Amounts) {
            result.add(
                    GroupedUserAccount.builder()
                            .level1Title(account.level1Title())
                            .level1Amount(level1Amounts.get(account.level1Title()))
                            .level2Title(account.level2Title())
                            .level2Amount(account.level2Amount())
                            .date(account.date())
                            .userAccounts(account.userAccounts())
                            .build()
            );
        }

        return result;
    }
}