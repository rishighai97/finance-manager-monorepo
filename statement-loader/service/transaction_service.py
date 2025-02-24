from dao.transaction_dao import TransactionDao
from model.transaction import Transaction
from typing import List
from utils.iterable_utils import IterableUtils

class TransactionService:
    def __init__(self):
        self.dao = TransactionDao()

    def save(self, transactions: List[Transaction]):
        print(f"Saving {len(transactions)} transactions in database")
        for batch in IterableUtils.batch(transactions, 500):
            self.dao.upsert(batch)
