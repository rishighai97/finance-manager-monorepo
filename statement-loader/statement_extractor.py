from utils.env_utils import setup_environment_variables
setup_environment_variables()
import pandas as pd
import xlrd
from model.account_details_factory import Account
from service.transaction_service import TransactionService
from service.statement_reader.statement_reader_factory import StatementReaderFactory



if __name__ == '__main__':

    transaction_service = TransactionService()
    # df = pd.read_excel(xlrd.open_workbook(filename=filename))
    # df = pd.read_excel(filename)
    # df = pd.read_excel(filename,xlrd.open_workbook(filename=filename))
    df = pd.read_excel(xlrd.open_workbook(filename="resources/statements/HDFC.xls"))
    # df = pd.read_csv("resources/statements/CANARA.CSV", header=None)
    transactions = (StatementReaderFactory
                    .get_statement_reader(account=Account.HDFC)
                    .read_statement(account_id="HDFC", df = df)
                    )
    transaction_service.save(transactions)