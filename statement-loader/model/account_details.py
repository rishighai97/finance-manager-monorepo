class AccountDetails:
    def __init__(self, bank_name):
        self.bank_name = bank_name

    def __str__(self):
        return self.__dict__.__str__()