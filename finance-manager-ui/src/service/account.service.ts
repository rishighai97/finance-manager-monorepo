// src/app/services/account.service.ts

import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { UserAccount } from "../model/user-account"; // Import the UserAccount model

@Injectable({
  providedIn: "root",
})
export class AccountService {
  private accountApiUri = "http://localhost:5003"; // API URL

  constructor(private http: HttpClient) {}

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
}
