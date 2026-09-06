from typing import List

class AccountStatementUploadResponse:
    def __init__(self, status: bool, request_id: str = None, transaction_count: int = 0, error_messages: List[str] = None):
        self.status: bool = status
        self.request_id: str = request_id
        self.transaction_count : int = transaction_count
        self.error_messages: List[str] = error_messages

    def __str__(self):
        return self.__dict__.__str__()