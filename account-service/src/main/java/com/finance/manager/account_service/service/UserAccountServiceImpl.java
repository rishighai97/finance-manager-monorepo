package com.finance.manager.account_service.service;

import com.finance.manager.account_service.dao.UserAccountDao;
import com.finance.manager.account_service.dto.GroupedUserAccount;
import com.finance.manager.account_service.dto.UserAccount;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserAccountServiceImpl implements UserAccountService {

    private final UserAccountDao dao;

    @Override
    public List<UserAccount> getAllAccounts(List<Integer> userIds) {
        return dao.getAllAccounts(userIds);
    }

    @Override
    public List<GroupedUserAccount> getAllGroupedAccounts(List<Integer> userIds) {
        List<UserAccount> accounts = getAllAccounts(userIds);

        // Using a map of maps to organize accounts by level 1 and level 2
        Map<String, Map<String, List<UserAccount>>> groupedAccounts = new HashMap<>();

        // Group accounts by level 1 and level 2 only
        for (UserAccount account : accounts) {
            String level1 = account.accountType1();
            String level2 = account.accountType2();

            // Add account to the appropriate group, ignoring level_3
            groupedAccounts.computeIfAbsent(level1, k -> new HashMap<>())
                    .computeIfAbsent(level2, k -> new ArrayList<>())
                    .add(account);
        }

        // List to store the final GroupedUserAccount objects
        List<GroupedUserAccount> groupedAccountsWithoutLevel1Amounts = new ArrayList<>();
        // Map to track level 1 totals
        Map<String, BigDecimal> level1Amounts = new HashMap<>();

        // Calculate level 2 totals, create GroupedUserAccount objects and store them in groupedAccountsWithouLevel1Amounts list
        for (Map.Entry<String, Map<String, List<UserAccount>>> level1Entry : groupedAccounts.entrySet()) {
            String level1Title = level1Entry.getKey();
            BigDecimal level1Total = BigDecimal.ZERO;

            for (Map.Entry<String, List<UserAccount>> level2Entry : level1Entry.getValue().entrySet()) {
                String level2Title = level2Entry.getKey();
                List<UserAccount> userAccounts = level2Entry.getValue();
                BigDecimal level2Total = BigDecimal.ZERO;

                // Sum up balances for level_2 total
                for (UserAccount account : userAccounts) {
                    level2Total = level2Total.add(account.latestBalance() != null ? account.latestBalance() : BigDecimal.ZERO);
                }

                // Add to level_1 total
                level1Total = level1Total.add(level2Total);

                // Get the date from the first account
                String date = userAccounts.isEmpty() ? null
                        : userAccounts.getFirst().latestBalanceDate();

                // Create a GroupedUserAccount for this level_2 group
                GroupedUserAccount groupedAccount = GroupedUserAccount
                        .builder()
                        .level1Title(level1Title) // level_1_title
                        // level 1 amount will be added in end as sum of level 2 amounts
                        .level2Title(level2Title) // level_2_title
                        .level2Amount(level2Total) // level_2_amount
                        .date(date) // date
                        .userAccounts(userAccounts) // user_accounts
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
                    GroupedUserAccount
                            .builder()
                            .level1Amount(level1Amounts.get(account.level1Title()))
                            .level1Title(account.level1Title()) // level_1_title
                            .level2Amount(account.level2Amount()) // level_2_amount
                            .level2Title(account.level2Title()) // level_2_title
                            .date(account.date()) // date
                            .userAccounts(account.userAccounts()) // user_accounts
                            .build()
            );
        }

        return result;
    }
}
