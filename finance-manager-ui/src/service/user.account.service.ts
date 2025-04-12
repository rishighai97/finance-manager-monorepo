
import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable } from "rxjs";
import { UserAccount } from "../model/user-account"; // Import the UserAccount model
import { GroupedUserAccount } from "src/model/grouped-user-account";
import { UserAccountSaveRequest } from "src/model/user-account-save-request";
import { UserAccountEditRequest } from "src/model/user-account-edit-request";
import { environment } from "../environments/environment";

@Injectable({
  providedIn: "root",
})
export class UserAccountService {
  private accountApiUri = `${environment.apiEndpoints.accountService}/user_account`; // API URL

  constructor(private http: HttpClient) {}

  private groupedUserAccountsSubject = new BehaviorSubject<
    GroupedUserAccount[]
  >([]);
  groupedUserAccounts$ = this.groupedUserAccountsSubject.asObservable();

  loadGroupedUserAccounts() {
    this.fetchGroupedUserAccounts([2]).subscribe(
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
        console.error("Error fetching accounts:", error);
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
    const url = `${this.accountApiUri}/v1/fetch_all?user_ids=${userIdsQuery}`;
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
    const url = `${this.accountApiUri}/v1/fetch_all/grouped?user_ids=${userIdsQuery}`;
    console.log(`Fetching grouped accounts for users ${userIdsQuery}`);
    // Send the GET request to the API and return the observable
    return this.http.get<GroupedUserAccount[]>(url);
  }

  /**
   * Creates a new user account with the given details.
   * @param request - The user account creation request
   * @returns An observable of the created user account ID
   */
  saveUserAccount(request: UserAccountSaveRequest): Observable<number> {
    const url = `${this.accountApiUri}/v1/save`;
    console.log(`Creating new user account for user_id: ${request.user_id}`);
    return this.http.post<number>(url, request);
  }

  /**
   * Deletes a user account with the given ID.
   * @param userAccountId - The ID of the user account to delete
   * @returns An observable of the void response
   */
  deleteUserAccount(userAccountId: number): Observable<void> {
    const url = `${this.accountApiUri}/v1/delete?user_account_id=${userAccountId}`;
    console.log(`Deleting user account with ID: ${userAccountId}`);
    return this.http.delete<void>(url);
  }

  /**
   * Updates the name of a user account with the given details.
   * @param request - The user account edit request
   * @returns An observable of the void response
   */
  editUserAccountName(request: UserAccountEditRequest): Observable<void> {
    const url = `${this.accountApiUri}/v1/edit`;
    console.log(
      `Updating name for user account with ID: ${request.user_account_id}`
    );
    return this.http.put<void>(url, request);
  }

  /**
   * Refreshes the accounts list by fetching the latest data
   */
  refreshAccounts() {
    // Fetch fresh data with a cache-busting parameter
    this.fetchGroupedUserAccounts([1]).subscribe(
      (groupedAccounts) => {
        // Process icons
        groupedAccounts.forEach((group) => {
          group.user_accounts.forEach((acct) => {
            acct.icon = `data:image/png;base64,${acct.icon}`;
          });
        });

        // Update the accounts subject with new data
        this.groupedUserAccountsSubject.next(groupedAccounts);
      },
      (error) => {
        console.error("Error refreshing accounts:", error);
      }
    );
  }
}
