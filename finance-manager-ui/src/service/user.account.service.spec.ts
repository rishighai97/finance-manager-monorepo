import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { firstValueFrom } from "rxjs";

import { environment } from "../environments/environment";
import { UserAccountSaveRequest } from "src/model/user-account-save-request";
import { UserAccountEditRequest } from "src/model/user-account-edit-request";
import { UserAccountService } from "./user.account.service";
import { UserService } from "./user.service";

describe("UserAccountService", () => {
  let service: UserAccountService;
  let httpMock: HttpTestingController;
  let userService: { currentUserId: number };
  const apiUrl = `${environment.apiEndpoints.accountService}/user_account`;

  beforeEach(() => {
    userService = { currentUserId: 1 };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: UserService, useValue: userService },
      ],
    });
    service = TestBed.inject(UserAccountService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe("fetchUserAccounts", () => {
    it("GETs accounts for a comma-separated list of user ids", async () => {
      const promise = firstValueFrom(service.fetchUserAccounts([1, 2]));

      const req = httpMock.expectOne(`${apiUrl}/v1/fetch_all?user_ids=1,2`);
      expect(req.request.method).toBe("GET");
      req.flush([]);

      expect(await promise).toEqual([]);
    });
  });

  describe("fetchGroupedUserAccounts", () => {
    it("GETs grouped accounts for a comma-separated list of user ids", async () => {
      const promise = firstValueFrom(service.fetchGroupedUserAccounts([1]));

      const req = httpMock.expectOne(`${apiUrl}/v1/fetch_all/grouped?user_ids=1`);
      req.flush([]);

      expect(await promise).toEqual([]);
    });
  });

  describe("loadGroupedUserAccounts", () => {
    it("base64-prefixes each account icon and publishes on groupedUserAccounts$", (done) => {
      service.groupedUserAccounts$.subscribe((value) => {
        if (value.length === 0) {
          return;
        }
        expect(value[0].user_accounts[0].icon).toBe("data:image/png;base64,raw-icon");
        done();
      });

      service.loadGroupedUserAccounts();
      httpMock.expectOne(`${apiUrl}/v1/fetch_all/grouped?user_ids=1`).flush([
        { level_1_title: "Assets", level_2_title: "Bank", user_accounts: [{ user_account_id: 1, icon: "raw-icon" }] },
      ]);
    });

    it("does not throw when the fetch fails", () => {
      expect(() => {
        service.loadGroupedUserAccounts();
        httpMock.expectOne(`${apiUrl}/v1/fetch_all/grouped?user_ids=1`).flush("error", { status: 500, statusText: "Server Error" });
      }).not.toThrow();
    });
  });

  describe("getFirstAccountId", () => {
    it("returns null before any accounts have been loaded", () => {
      expect(service.getFirstAccountId()).toBeNull();
    });

    it("returns the first user_account_id once loaded", () => {
      service.loadGroupedUserAccounts();
      httpMock.expectOne(`${apiUrl}/v1/fetch_all/grouped?user_ids=1`).flush([
        { level_1_title: "Assets", level_2_title: "Bank", user_accounts: [{ user_account_id: 42, icon: "x" }] },
      ]);

      expect(service.getFirstAccountId()).toBe(42);
    });
  });

  describe("saveUserAccount", () => {
    it("defaults user_id to the current user when not specified", async () => {
      const request = { account_id: 6, user_account_name: "My Savings" } as UserAccountSaveRequest;
      const promise = firstValueFrom(service.saveUserAccount(request));

      const req = httpMock.expectOne(`${apiUrl}/v1/save`);
      expect(req.request.body.user_id).toBe(1);
      req.flush(42);

      expect(await promise).toBe(42);
    });

    it("keeps an explicitly-provided user_id rather than overriding it", async () => {
      const request = { user_id: 99, account_id: 6, user_account_name: "My Savings" } as UserAccountSaveRequest;
      const promise = firstValueFrom(service.saveUserAccount(request));

      const req = httpMock.expectOne(`${apiUrl}/v1/save`);
      expect(req.request.body.user_id).toBe(99);
      req.flush(1);

      await promise;
    });
  });

  describe("deleteUserAccount", () => {
    it("DELETEs the given user account id", async () => {
      const promise = firstValueFrom(service.deleteUserAccount(7));

      const req = httpMock.expectOne(`${apiUrl}/v1/delete?user_account_id=7`);
      expect(req.request.method).toBe("DELETE");
      req.flush(null);

      await promise;
    });
  });

  describe("editUserAccountName", () => {
    it("PUTs the edit request", async () => {
      const request: UserAccountEditRequest = { user_account_id: 7, new_user_account_name: "Renamed" };
      const promise = firstValueFrom(service.editUserAccountName(request));

      const req = httpMock.expectOne(`${apiUrl}/v1/edit`);
      expect(req.request.method).toBe("PUT");
      expect(req.request.body).toEqual(request);
      req.flush(null);

      await promise;
    });
  });

  describe("refreshAccounts", () => {
    it("re-fetches and re-publishes grouped accounts", (done) => {
      service.groupedUserAccounts$.subscribe((value) => {
        if (value.length === 0) {
          return;
        }
        expect(value[0].user_accounts[0].icon).toBe("data:image/png;base64,raw-icon");
        done();
      });

      service.refreshAccounts();
      httpMock.expectOne(`${apiUrl}/v1/fetch_all/grouped?user_ids=1`).flush([
        { level_1_title: "Assets", level_2_title: "Bank", user_accounts: [{ user_account_id: 1, icon: "raw-icon" }] },
      ]);
    });
  });
});
