from datetime import datetime

# todo add logic to calculate opening and closing balance. Store transaction order per date when upload transactions
class Transaction:
    def __init__(self, date: datetime, user_account_id: int, title: str, debit_or_credit_amount: float, is_credit_amount: bool, transaction_id: str = None , closing_balance: float = None,
                 category_id: str = None, type: str = None, units: int = None, price_per_unit: float = None):
        self.transaction_id: str = transaction_id if transaction_id != None else str(user_account_id) +"|"+date.strftime("%Y-%m-%d")+"|"+title
        self.date: datetime = date
        self.user_account_id: int = user_account_id
        self.title: str = title
        self.debit_or_credit_amount: float = debit_or_credit_amount
        self.is_debit_or_credit: str = "CR" if is_credit_amount else "DR"
        self.closing_balance: float = closing_balance
        self.category_id: str = category_id
        self.type: str = type
        self.units: int = units
        self.price_per_unit: float = price_per_unit

    def __str__(self):
        return self.__dict__.__str__()

    def to_dict(self):
        return {
            "transaction_id": self.transaction_id,
            "date": self.date.strftime('%Y-%m-%d'),  # or ISO format if Spring expects that
            "user_account_id": self.user_account_id,
            "title": self.title,
            "debit_or_credit_amount": self.debit_or_credit_amount,
            "is_debit_or_credit": self.is_debit_or_credit,
            "closing_balance": self.closing_balance,
            "category_id": self.category_id,
            "type": self.type,
            "units": self.units,
            "price_per_unit": self.price_per_unit,
            "user_category_ids": None  # assuming not used, or set accordingly
        }