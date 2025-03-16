import json
from typing import List
from model.user_account import UserAccount
class GroupedUserAccount:
    def __init__(self, level_1_title: str, level_2_title, level_2_amount: float, date: str, user_accounts : List[UserAccount], level_1_amount: float = str(None)):
        self.level_1_title: str = level_1_title
        self.level_1_amount: float = level_1_amount
        self.level_2_title: str = level_2_title
        self.level_2_amount: float = level_2_amount
        self.date: str = date
        self.user_accounts: List[UserAccount] = user_accounts

    def to_dict(self):
        return self.__dict__


# Define a custom JSON encoder that handles your classes
class GroupedUserAccountCustomJsonEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (UserAccount, GroupedUserAccount)):
            # Convert the object to a dictionary
            obj_dict = obj.__dict__.copy()

            # Special handling for nested UserAccount objects
            if 'user_accounts' in obj_dict:
                obj_dict['user_accounts'] = [account.__dict__ for account in obj_dict['user_accounts']]

            return obj_dict

        return super().default(obj)