from datetime import datetime
from enum import Enum


class AccountStatement:
    def __init__(self, extension: str, version: int, start_time: datetime, end_time: datetime, account_id: int, id: int = None):
        self.id: int  = id
        self.extension: str  = extension
        self.version: int = version
        self.start_time: datetime = start_time
        self.end_time: datetime = end_time
        self.account_id: int = account_id

    def __str__(self):
        return self.__dict__.__str__()

class AccountStatementExtension:
    csv = "csv"
    xls = "xls"
    xlsx = "xlsx"
    pdf = "pdf"

    def __str__(self):
        return self.__dict__.__str__()


class AccountExtensionData:
    def __init__(self, account_id: int, extension: str):
        self.account_id: int = account_id
        self.extension: str = extension

    def __str__(self):
        return self.__dict__.__str__()

    def __hash__(self):
        # Return a hash value for the object, typically a combination of its attributes
        return hash((self.account_id, self.extension))  # Hash based on tuple of attributes

    def __eq__(self, other):
        # Check if two objects are equal based on their attributes
        if isinstance(other, AccountExtensionData):
            return self.account_id == other.account_id and self.extension == other.extension
        return False