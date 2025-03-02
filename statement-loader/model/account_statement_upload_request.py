from typing import List
import base64
from io import BytesIO

class AccountStatementUploadRequest:
    def __init__(self, account_id: int, user_id: int, file: str, file_extension: str, request_id: str):
        self.account_id: int = int(account_id)
        self.user_id: int = int(user_id)
        self.file: str = str(file) # base 64 encoded file
        self.extension: str = str(file_extension)
        self.request_id: str = str(request_id)

    def __str__(self):
        return self.__dict__.__str__()