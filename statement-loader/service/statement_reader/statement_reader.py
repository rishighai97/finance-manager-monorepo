from abc import ABC, abstractmethod

import pandas as pd
from werkzeug.datastructures import FileStorage

from model.account_statement_upload_request import AccountStatementUploadRequest
from model.transaction import Transaction
from typing import List
from io import BytesIO
import base64

class StatementReader(ABC):

    @abstractmethod
    def read_statement(self, request: AccountStatementUploadRequest, file: bytes) -> List[Transaction]:
        pass

    @abstractmethod
    def account_id(self) -> int:
        pass

    @abstractmethod
    def version(self) -> int:
        pass

    @abstractmethod
    def extension(self) -> str:
        pass

class StatementReaderKey:

    def __init__(self, account_id: int, version: int, extension: str):
        self.account_id: int = account_id
        self.version: int = version
        self.extension: str = extension

    def __hash__(self):
        # Return a hash value for the object, typically a combination of its attributes
        return hash((self.account_id, self.version, self.extension))  # Hash based on tuple of attributes

    def __eq__(self, other):
        # Check if two objects are equal based on their attributes
        if isinstance(other, StatementReaderKey):
            return self.account_id == other.account_id and self.version == other.version and self.extension == other.extension
        return False