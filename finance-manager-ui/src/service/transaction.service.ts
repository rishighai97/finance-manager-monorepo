
import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { Transactions } from "src/model/transactions";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root",
})
export class TransactionService {
  private apiUrl = `${environment.apiEndpoints.transactionService}/transaction`;

  constructor(private http: HttpClient) {}

  // Get transactions for a specific date range
  fetchAllTransactions(
    userAccountIds: number[],
    startDate: string,
    endDate: string,
    categoryIds: number[] | null = null
  ): Observable<Transactions> {
    const accounts = userAccountIds.join(",");
    let url = `${this.apiUrl}/v1/fetch_all?user_account_ids=${accounts}&start_date=${startDate}&end_date=${endDate}`;

    // Add category filter if provided
    if (categoryIds && categoryIds.length > 0) {
      const categories = categoryIds.join(",");
      url += `&category_ids=${categories}`;
    }

    console.log(`Fetching transactions for accounts ${accounts}, dates ${startDate} to ${endDate}${categoryIds ? ', categories ' + categoryIds : ''}`);

    // Send the GET request to the API and return the observable
    return this.http.get<Transactions>(url);
  }
}
