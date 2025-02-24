from abc import ABC, abstractmethod

import pandas as pd

from model.transaction import Transaction
from typing import List


class StatementReader(ABC):

    @abstractmethod
    def read_statement(self, account_id: str, df: pd.DataFrame) -> List[Transaction]:
        pass

    @abstractmethod
    def read_pdf_statement(self, account_id: str) -> List[Transaction]:
        pass