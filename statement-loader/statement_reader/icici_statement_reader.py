from datetime import datetime
from model.transaction import Transaction
from statement_reader.statement_reader import StatementReader
import pandas as pd
from typing import List


class IciciStatementReader(StatementReader):

    def read_pdf_statement(self, account_id: str) -> List[Transaction]:
        pass

    def read_statement(self, account_id: str, df: pd.DataFrame) -> List[Transaction]:
        transactions = []
        start = False
        for idx, row in df.iterrows():
            if start is True and (type(row.iloc[1]) != str or "legends" in row.iloc[1].lower()):
                break
            if start is True:
                date_string = str(row.iloc[3]) if type(row.iloc[3]) == str else None
                date = datetime.strptime(date_string, "%d/%m/%Y")
                title = row.iloc[5]
                debit_amount = float(row.iloc[6]) if row.iloc[6] != None else float(0)
                credit_amount = float(row.iloc[7]) if row.iloc[7] != None else float(0)
                is_credit_amount = credit_amount is not None and credit_amount > 0
                amount = credit_amount if is_credit_amount else debit_amount
                closing_balance = float(row.iloc[8]) if row.iloc[8] != None else float(0)
                transactions.append(
                    Transaction(
                        transaction_id=account_id + "|" + date_string + "|" + title,
                        date=date,
                        account_id=account_id,
                        title=title,
                        debit_or_credit_amount=amount,
                        is_credit_amount=is_credit_amount,
                        closing_balance=closing_balance
                    )
                )
            if type(row.iloc[1]) == str and row.iloc[1] == "S No.":
                start = True
        return transactions


