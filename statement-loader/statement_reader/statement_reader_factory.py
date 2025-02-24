from model.account import Account
from statement_reader.canara_statement_reader import CanaraStatementReader
from statement_reader.groww_statement_reader import GrowwStatementReader
from statement_reader.hdfc_statement_reader import HdfcStatementReader
from statement_reader.icici_statement_reader import IciciStatementReader
from statement_reader.statement_reader import *


class StatementReaderFactory:
    def __init__(self):
        pass

    def get_statement_reader(account: Account) -> StatementReader:
        match account:
            case Account.HDFC:
                return HdfcStatementReader()
            case Account.GROWW:
                return GrowwStatementReader()
            case Account.ICICI:
                return IciciStatementReader()
            case Account.CANARA:
                return CanaraStatementReader()
            case _:
                raise Exception(f"No Statement Reader found for account -> {account}")
