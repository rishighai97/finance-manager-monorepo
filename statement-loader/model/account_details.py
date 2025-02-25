from typing import List


class AccountDetails:
    def __init__(self, bank_name, valid_formats=None):
        self.bank_name : str = bank_name
        self.valid_formats: List[str] = valid_formats

    def __str__(self):
        return self.__dict__.__str__()