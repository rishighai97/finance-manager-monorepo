from datetime import datetime

from model.transaction import Transaction
from service.statement_reader.statement_reader import StatementReader
import pandas as pd
from typing import List


class GrowwStatementReader(StatementReader):

    def read_statement(self, account_id: str, df: pd.DataFrame) -> List[Transaction]:
        transactions = []
        start = False
        for idx, row in df.iterrows():
            if start and type(row[0]) == str:
                transactions.append(
                    Transaction(
                        transaction_id=account_id + "|" + str(row[0]) + "|" + row[1],
                        date=datetime.strptime(row[5], "%d %b %Y"),
                        account_id=account_id,
                        title=row[0],
                        debit_or_credit_amount=row[4],
                        is_credit_amount=str(row[1]).strip() == "PURCHASE",
                        units=row[2],
                        price_per_unit=row[3]
                    )
                )

            if type(row[0]) == str and row[0] == "Scheme Name":
                start = True
        return transactions


