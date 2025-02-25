from datetime import datetime

from model.transaction import Transaction
from service.statement_reader.statement_reader import StatementReader
import pandas as pd
from typing import List

class HdfcStatementReader(StatementReader):

    def read_pdf_statement(self, account_id: str) -> List[Transaction]:
        pass


    def read_statement(self, account_id: str, df: pd.DataFrame) -> List[Transaction]:
        asterix_row_count = 0
        transactions = []
        for idx, row in df.iterrows():
            if type(row.iloc[0]) == str and row.iloc[0][0] == "*":
                asterix_row_count += 1
            if asterix_row_count == 2 and type(row.iloc[0]) == str and row.iloc[0][0] != '*':
                transactions.append(
                    Transaction(
                        transaction_id=account_id + "|" + str(row.iloc[0]) + "|" + row.iloc[1],
                        date=datetime.strptime(row.iloc[0], "%d/%m/%y"),
                        account_id=account_id,
                        title=row.iloc[1],
                        debit_or_credit_amount=row.iloc[4] if type(row.iloc[4]) == str else row.iloc[5],
                        is_credit_amount=type(row.iloc[4]) != str,
                        closing_balance=row.iloc[6]
                    )
                )
            if asterix_row_count == 3:
                break
        return transactions


