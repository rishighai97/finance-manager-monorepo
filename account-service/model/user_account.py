class UserAccount:
    def __init__(self, user_account_id: int, account_id: int, user_id: int, account_type_id: int, account_name: str, icon: str, account_type_1: str, account_type_2: str, account_type_3: str, balance: float, balance_date: str):
        self.user_account_id: int = user_account_id
        self.account_id: int = account_id
        self.user_id: int = user_id
        self.account_type_id: int = account_type_id
        self.account_name: str = account_name
        self.icon: str = icon
        self.account_type_1: str = account_type_1
        self.account_type_2: str = account_type_2
        self.account_type_3: str = account_type_3
        self.latest_balance: float = balance
        self.latest_balance_date: str = balance_date
