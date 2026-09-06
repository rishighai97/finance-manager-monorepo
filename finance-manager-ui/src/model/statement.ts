export interface Statement {
  account_id: number;
  user_id: number;
  user_account_id: number;
  file_name: string;
  file_extension: string;
  file: string;
  request_id: string;
}

export interface UploadResult {
  statement: Statement;
  response: AccountStatementUploadResponse;
}

export interface AccountStatementUploadResponse {
  status: boolean;
  request_id: string;
  transaction_count: number;
  error_messages: string[];
}