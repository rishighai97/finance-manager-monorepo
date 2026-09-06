
import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable } from "rxjs";
import { Account } from "../model/account";
import { GroupedAccount } from "../model/grouped-account";
import { environment } from "../environments/environment";

@Injectable({
  providedIn: "root",
})
export class AccountService {
  private accountApiUri = `${environment.apiEndpoints.accountService}/account`; // API URL

  constructor(private http: HttpClient) {}

  private groupedAccountsSubject = new BehaviorSubject<GroupedAccount[]>([]);
  groupedAccounts$ = this.groupedAccountsSubject.asObservable();

  loadGroupedAccounts() {
    this.fetchGroupedAccounts().subscribe(
      (groupedAccounts) => {
        // Process icons
        groupedAccounts.forEach((group) => {
          group.accounts.forEach((acct) => {
            acct.icon = `data:image/png;base64,${acct.icon}`;
          });
        });
        this.groupedAccountsSubject.next(groupedAccounts);
      },
      (error) => {
        console.error('Error fetching accounts:', error);
      }
    );
  }

  /**
   * Fetches all accounts.
   * @returns An observable of Account[].
   */
  fetchAccounts(): Observable<Account[]> {
    const url = `${this.accountApiUri}/v1/fetch_all`;
    console.log("Fetching all accounts");
    return this.http.get<Account[]>(url);
  }

  /**
   * Fetches grouped accounts.
   * Accounts are grouped by level_1 and level_2 categories.
   * @returns An observable of GroupedAccount[].
   */
  fetchGroupedAccounts(): Observable<GroupedAccount[]> {
    const url = `${this.accountApiUri}/v1/fetch_all/grouped`;
    console.log("Fetching all grouped accounts");
    return this.http.get<GroupedAccount[]>(url);
  }

  /**
   * Gets the first available account ID
   * @returns The first account ID or null if none available
   */
  getFirstAccountId(): number | null {
    const accounts = this.groupedAccountsSubject.value;
    if (accounts.length > 0 && accounts[0].accounts.length > 0) {
      return accounts[0].accounts[0].account_id;
    }
    return null;
  }
}
