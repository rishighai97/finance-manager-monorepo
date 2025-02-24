

from config.config_manager import ConfigManager
from typing import List
from model.transaction import Transaction
from psycopg2.extras import execute_values


class TransactionDao:

    def upsert(self, transactions: List[Transaction]):
        sql = f'''
        INSERT INTO transaction (id, date, account_id, title, amount, debit_credit_indicator, closing_balance, category_id) VALUES %s 
        ON CONFLICT (id) 
        DO UPDATE SET
            date = EXCLUDED.date,
            account_id = EXCLUDED.account_id,
            title = EXCLUDED.title,
            amount = EXCLUDED.amount,
            debit_credit_indicator = EXCLUDED.debit_credit_indicator,
            closing_balance = EXCLUDED.closing_balance,
            category_id = EXCLUDED.category_id;
        '''

        values = [(t.transaction_id, t.date, t.account_id, t.title, t.debit_or_credit_amount, t.is_debit_or_credit,
                   t.closing_balance, t.category_id) for t in transactions]
        ConfigManager.postgres.execute_queries_in_transaction([lambda cur: execute_values(cur, sql, values)])
