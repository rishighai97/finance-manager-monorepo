import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { Transactions } from "src/model/transactions";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root",
})
export class TransactionService {
  private apiUrl = "http://localhost:5004/transaction";

  constructor(private http: HttpClient) {}

  // Get transactions for a specific date range
  fetchAllTransactions(
    userAccountIds: number[],
    startDate: string,
    endDate: string
  ): Observable<Transactions> {
    const accounts = userAccountIds.join(",");
    const url = `${this.apiUrl}/v1/fetch_all?user_account_ids=${accounts}&start_date=${startDate}&end_date=${endDate}`;
    console.log(`Fetching grouped accounts for users ${accounts}`);
    // Send the GET request to the API and return the observable
    return this.http.get<Transactions>(url);
  }
}
