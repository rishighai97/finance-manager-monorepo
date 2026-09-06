import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { Transactions } from "src/model/transactions";
import { environment } from "src/environments/environment";
import { UserService } from "./user.service";

@Injectable({
  providedIn: "root",
})
export class TransactionService {
  private apiUrl = `${environment.apiEndpoints.transactionService}/transaction`;

  constructor(
    private http: HttpClient,
    private userService: UserService
  ) {}

  // Get transactions for a specific date range
  fetchAllTransactions(
    userAccountIds: number[],
    startDate: string,
    endDate: string,
    categoryIds: number[] | null = null,
    debitCreditIndicator: 'DR' | 'CR' | null = null
  ): Observable<Transactions> {
    const accounts = userAccountIds.join(",");
    let url = `${this.apiUrl}/v1/fetch_all?user_account_ids=${accounts}&start_date=${startDate}&end_date=${endDate}`;

    // Add category filter if provided
    if (categoryIds && categoryIds.length > 0) {
      const categories = categoryIds.join(",");
      url += `&category_ids=${categories}`;
    }

    // Add debit_credit_indicator if provided
    if (debitCreditIndicator) {
      url += `&debit_credit_indicator=${debitCreditIndicator}`;
    }

    console.log(`Fetching transactions for accounts ${accounts}, dates ${startDate} to ${endDate}${categoryIds ? ', categories ' + categoryIds : ''}${debitCreditIndicator ? ', indicator ' + debitCreditIndicator : ''}`);

    // Send the GET request to the API and return the observable
    return this.http.get<Transactions>(url);
  }
  
  /**
   * Fetches all transactions for the current user
   * @param startDate Start date for transaction range
   * @param endDate End date for transaction range
   * @param userAccountIds Optional specific account IDs, if not provided will fetch for all user accounts
   * @param categoryIds Optional category IDs to filter by
   * @returns Observable of Transactions
   */
  fetchCurrentUserTransactions(
    startDate: string,
    endDate: string,
    userAccountIds?: number[],
    categoryIds?: number[]
  ): Observable<Transactions> {
    // If no account IDs provided, fetchAllTransactions will need them
    if (!userAccountIds || userAccountIds.length === 0) {
      // This would require a method to get all account IDs for the current user
      // For now, we'll leave it to the caller to provide account IDs
      throw new Error("Account IDs must be provided");
    }
    
    return this.fetchAllTransactions(userAccountIds, startDate, endDate, categoryIds);
  }
}