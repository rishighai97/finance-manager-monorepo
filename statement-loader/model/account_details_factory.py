from enum import Enum
from model.account_details import AccountDetails


class AccountDetailsFactory:
    HDFC = AccountDetails(bank_name = "HDFC", valid_formats=['.xls','.csv'])
    ICICI = AccountDetails(bank_name = "ICICI")
    CANARA = AccountDetails(bank_name = "CANARA")
    SARASWAT = AccountDetails(bank_name = "SARASWAT")
    AXIS = AccountDetails(bank_name="AXIS")
    GROWW = AccountDetails(bank_name="GROWW")
    ZERODHA = AccountDetails(bank_name="ZERODHA")
    HDFC_FD = AccountDetails(bank_name="HDFC_FD")
    ICICI_FD = AccountDetails(bank_name="ICICI_FD")
    AXIS_FD = AccountDetails(bank_name="AXIS_FD")
    CANARA_PPF = AccountDetails(bank_name="CANARA_PPF")

    def __str__(self):
        return self.__dict__.__str__()