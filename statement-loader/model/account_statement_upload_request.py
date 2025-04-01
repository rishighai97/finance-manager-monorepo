

class AccountStatementUploadRequest:
    def __init__(self, account_id: int, user_id: int,user_account_id: int, file: str, file_name :str, file_extension: str, request_id: str):
        self.account_id: int = int(account_id)
        self.user_account_id: int = int(user_account_id)
        self.user_id: int = int(user_id)
        self.file_name: str = file_name # file name with extension
        self.file: str = str(file) # base 64 encoded file
        self.file_extension: str = str(file_extension)
        self.request_id: str = str(request_id)

    def __str__(self):
        return self.__dict__.__str__()