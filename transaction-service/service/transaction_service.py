from typing import List
from datetime import datetime

from model.transaction import Transaction
from transasction_dao.transaction_dao import TransactionPostgresDao, TransactionDao


class TransactionService:

    def __init__(self):
        self.dao: TransactionDao = TransactionPostgresDao()

    def fetch_all(self, user_account_ids: List[int], start_date: str, end_date: str) -> List[Transaction]:
        return self.dao.fetch_all(user_account_ids=user_account_ids, start_date=start_date, end_date=end_date)