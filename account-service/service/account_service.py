from collections import defaultdict
from typing import List

from dao.account_dao import AccountPostgresDao, AccountDao
from model.grouped_user_account import GroupedUserAccount
from model.user_account import UserAccount


class AccountService:
    def __init__(self):
        self.dao: AccountDao = AccountPostgresDao()

    def get_all_accounts(self, user_ids: List[int]) -> List[UserAccount]:
        return self.dao.get_all_accounts(user_ids=user_ids)

    def get_all_grouped_accounts(self, user_ids: List[int]) -> List[GroupedUserAccount]:
        accounts : List[UserAccount] = self.get_all_accounts(user_ids=user_ids)
        # Create a nested dictionary to organize accounts by level 1 and level 2 only
        grouped_dict = defaultdict(lambda: defaultdict(list))

        # Group accounts by level 1 and level 2 only
        for account in accounts:
            level_1 = account.account_type_1
            level_2 = account.account_type_2

            # Add account to the appropriate group, ignoring level_3
            grouped_dict[level_1][level_2].append(account)

        # List to store the final GroupedUserAccount objects
        result: List[GroupedUserAccount] = []

        # Calculate level 2 totals, create GroupedUserAccount objects and store them in result list
        for level_1, level_2_dict in grouped_dict.items():
            level_1_total = 0

            for level_2, accounts in level_2_dict.items():
                level_2_total = 0

                # Sum up balances for level_2 total
                for account in accounts:
                    level_2_total += account.latest_balance if account.latest_balance is not None else float(0)

                # Add to level_1 total
                level_1_total += level_2_total

                # Get the date from the first account
                date = accounts[0].latest_balance_date if accounts else str(None)

                # Create a GroupedUserAccount for this level_2 group
                grouped_account = GroupedUserAccount(
                    level_1_title=level_1,
                    # level_1_amount=level_1_total,  # This will be overwritten later with the correct total
                    level_2_title=level_2,
                    level_2_amount=level_2_total,
                    date=date,
                    user_accounts=accounts
                )

                result.append(grouped_account)

        # Update level_1_amount with correct totals
        level_1_totals = {}
        for account in result:
            if account.level_1_title not in level_1_totals:
                level_1_totals[account.level_1_title] = 0
            level_1_totals[account.level_1_title] += account.level_2_amount

        for account in result:
            account.level_1_amount = level_1_totals[account.level_1_title]

        return result

