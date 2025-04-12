
import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { Statement } from "../model/statement";
import { environment } from "../environments/environment";

// Response object interface matching the Python class
export interface AccountStatementUploadResponse {
  status: boolean;
  request_id: string;
  transaction_count: number;
  error_messages: string[];
}

@Injectable({
  providedIn: "root",
})
export class StatementUploadService {
  private apiUrl = `${environment.apiEndpoints.statementUploaderService}/statement`;

  constructor(private http: HttpClient) {}

  /**
   * Uploads a statement to the API
   * @param statement The statement to upload
   * @returns Observable of the upload response
   */
  uploadStatement(
    statement: Statement
  ): Observable<AccountStatementUploadResponse> {
    const url = `${this.apiUrl}/upload/v1/`;
    console.log(`Uploading statement: ${statement.file_name}`);
    return this.http.post<AccountStatementUploadResponse>(url, statement);
  }

  /**
   * Uploads multiple statements to the API in a single request
   * @param statements Array of statements to upload
   * @returns Observable of the upload response
   */
  uploadAllStatements(
    statements: Statement[]
  ): Observable<AccountStatementUploadResponse[]> {
    const url = `${this.apiUrl}/upload/v1/`;
    console.log(`Uploading ${statements.length} statements in batch`);
    return this.http.post<AccountStatementUploadResponse[]>(url, statements);
  }
}
