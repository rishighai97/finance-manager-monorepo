

class Account:
    def __init__(self, id: int, account_type_id: int = None, name: str = None):
        self.id: int  = id
        self.account_type_id: int  = account_type_id
        self.name: str = name

    def __str__(self):
        return self.__dict__.__str__()
