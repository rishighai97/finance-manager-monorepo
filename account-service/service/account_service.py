from typing import List

from dao.account_dao import AccountPostgresDao
from dto.user_account import UserAccount


class AccountService:
    def __init__(self):
        self.dao = AccountPostgresDao()

    def get_all_accounts(self, user_ids: List[int]) -> List[UserAccount]:
        return self.dao.get_all_accounts(user_ids=user_ids)