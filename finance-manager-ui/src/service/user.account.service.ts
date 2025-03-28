// src/app/services/account.service.ts

import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable } from "rxjs";
import { UserAccount } from "../model/user-account"; // Import the UserAccount model
import { GroupedUserAccount } from "src/model/grouped-user-account";

@Injectable({
  providedIn: "root",
})
export class UserAccountService {
  private accountApiUri = "http://localhost:5003"; // API URL

  constructor(private http: HttpClient) {}

  private groupedUserAccountsSubject = new BehaviorSubject<GroupedUserAccount[]>([]);
  groupedUserAccounts$ = this.groupedUserAccountsSubject.asObservable();

  loadGroupedUserAccounts() {
    this.fetchGroupedUserAccounts([1]).subscribe(
      (groupedAccounts) => {
        // Process icons
        groupedAccounts.forEach((group) => {
          group.user_accounts.forEach((acct) => {
            acct.icon = `data:image/png;base64,${acct.icon}`;
          });
        });
        this.groupedUserAccountsSubject.next(groupedAccounts);
      },
      (error) => {
        console.error('Error fetching accounts:', error);
      }
    );
  }

  getFirstAccountId(): number | null {
    const accounts = this.groupedUserAccountsSubject.value;
    if (accounts.length > 0 && accounts[0].user_accounts.length > 0) {
      return accounts[0].user_accounts[0].account_id;
    }
    return null;
  }

  /**
   * Fetches user accounts for the given list of user IDs.
   * @param userIds - An array of user IDs.
   * @returns An observable of UserAccount[].
   */
  fetchUserAccounts(userIds: number[]): Observable<UserAccount[]> {
    // Construct the query string with comma-separated user_ids
    const userIdsQuery = userIds.join(",");
    const url = `${this.accountApiUri}/account/v1/fetch_all?user_ids=${userIdsQuery}`;
    console.log(`Fetching accounts for users ${userIdsQuery}`);
    // Send the GET request to the API and return the observable
    return this.http.get<UserAccount[]>(url);
  }

  /**
   * Fetches grouped user accounts for the given list of user IDs.
   * Accounts are grouped by level_1 and level_2 categories.
   * @param userIds - An array of user IDs.
   * @returns An observable of GroupedUserAccount[].
   */
  fetchGroupedUserAccounts(
    userIds: number[]
  ): Observable<GroupedUserAccount[]> {
    // Construct the query string with comma-separated user_ids
    const userIdsQuery = userIds.join(",");
    const url = `${this.accountApiUri}/user_account/v1/fetch_all/grouped?user_ids=${userIdsQuery}`;
    console.log(`Fetching grouped accounts for users ${userIdsQuery}`);
    // Send the GET request to the API and return the observable
    return this.http.get<GroupedUserAccount[]>(url);
  }
}
