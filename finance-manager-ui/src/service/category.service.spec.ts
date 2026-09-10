import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { firstValueFrom } from "rxjs";

import { environment } from "../environments/environment";
import { TransactionUserCategory, TransactionUserCategoryAction } from "../model/transaction-user-category";
import { UserCategory } from "../model/user-category";
import { CategoryService } from "./category.service";
import { UserService } from "./user.service";

describe("CategoryService", () => {
  let service: CategoryService;
  let httpMock: HttpTestingController;
  let userService: { currentUserId: number };
  const apiUrl = `${environment.apiEndpoints.transactionService}/category`;

  beforeEach(() => {
    userService = { currentUserId: 1 };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: UserService, useValue: userService },
      ],
    });
    service = TestBed.inject(CategoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe("fetchAllCategories", () => {
    it("GETs categories for a comma-separated list of user ids", async () => {
      const promise = firstValueFrom(service.fetchAllCategories([1, 2]));

      const req = httpMock.expectOne(`${apiUrl}/v1/fetch_all?user_ids=1,2`);
      expect(req.request.method).toBe("GET");
      req.flush([]);

      expect(await promise).toEqual([]);
    });
  });

  describe("loadUserCategories", () => {
    it("defaults to the current user id when none are given", (done) => {
      service.userCategories$.subscribe((categories) => {
        if (categories.length === 0) {
          return;
        }
        expect(categories[0].category_title).toBe("Salary");
        done();
      });

      service.loadUserCategories();
      httpMock.expectOne(`${apiUrl}/v1/fetch_all?user_ids=1`).flush([{ id: 1, user_id: 1, category_title: "Salary" }]);
    });

    it("does not throw when the fetch fails", () => {
      expect(() => {
        service.loadUserCategories([1]);
        httpMock.expectOne(`${apiUrl}/v1/fetch_all?user_ids=1`).flush("error", { status: 500, statusText: "Server Error" });
      }).not.toThrow();
    });
  });

  describe("deleteCategories", () => {
    it("DELETEs with the categories in the request body", async () => {
      const categories: UserCategory[] = [{ id: 1, user_id: 1, category_title: "Salary" }];
      const promise = firstValueFrom(service.deleteCategories(categories));

      const req = httpMock.expectOne(`${apiUrl}/v1/delete_all`);
      expect(req.request.method).toBe("DELETE");
      expect(req.request.body).toEqual(categories);
      req.flush(null);

      await promise;
    });
  });

  describe("updateCategories", () => {
    it("PUTs the categories to update", async () => {
      const categories: UserCategory[] = [{ id: 1, user_id: 1, category_title: "Renamed" }];
      const promise = firstValueFrom(service.updateCategories(categories));

      const req = httpMock.expectOne(`${apiUrl}/v1/edit_all`);
      expect(req.request.method).toBe("PUT");
      req.flush(null);

      await promise;
    });
  });

  describe("addNewCategory", () => {
    it("defaults user_id to the current user when not set", async () => {
      const category = { id: 0, user_id: 0, category_title: "Groceries" } as UserCategory;
      const promise = firstValueFrom(service.addNewCategory(category));

      const req = httpMock.expectOne(`${apiUrl}/v1/save_all`);
      expect(req.request.body).toEqual([{ ...category, user_id: 1 }]);
      req.flush(null);

      await promise;
    });
  });

  describe("editTransactionCategories", () => {
    it("PUTs the mappings", async () => {
      const mappings: TransactionUserCategory[] = [
        { transaction_id: "t1", user_category_id: 1, action: TransactionUserCategoryAction.INSERT },
      ];
      const promise = firstValueFrom(service.editTransactionCategories(mappings));

      const req = httpMock.expectOne(`${apiUrl}/v1/transaction_user_category/edit_all`);
      expect(req.request.body).toEqual(mappings);
      req.flush(null);

      await promise;
    });
  });

  describe("applyPendingChanges", () => {
    function seedCategories(categories: UserCategory[]) {
      (service as any).userCategoriesSubject.next(categories);
    }

    it("resolves immediately without any HTTP call when nothing is pending", async () => {
      seedCategories([{ id: 1, user_id: 1, category_title: "Salary" }]);

      const result = await firstValueFrom(service.applyPendingChanges());

      expect(result).toBeTrue();
      httpMock.expectNone(`${apiUrl}/v1/delete_all`);
      httpMock.expectNone(`${apiUrl}/v1/edit_all`);
    });

    it("only deletes when only deletions are pending", async () => {
      seedCategories([{ id: 1, user_id: 1, category_title: "Salary", delete: true }]);

      const resultPromise = firstValueFrom(service.applyPendingChanges());
      httpMock.expectOne(`${apiUrl}/v1/delete_all`).flush(null);
      // applyPendingChanges refreshes the list afterward
      httpMock.expectOne(`${apiUrl}/v1/fetch_all?user_ids=1`).flush([]);

      expect(await resultPromise).toBeTrue();
      httpMock.expectNone(`${apiUrl}/v1/edit_all`);
    });

    it("only updates when only renames are pending", async () => {
      seedCategories([{ id: 1, user_id: 1, category_title: "Salary", new_title: "Income" }]);

      const resultPromise = firstValueFrom(service.applyPendingChanges());
      httpMock.expectNone(`${apiUrl}/v1/delete_all`);
      const updateReq = httpMock.expectOne(`${apiUrl}/v1/edit_all`);
      expect(updateReq.request.body[0].category_title).toBe("Income");
      updateReq.flush(null);
      httpMock.expectOne(`${apiUrl}/v1/fetch_all?user_ids=1`).flush([]);

      expect(await resultPromise).toBeTrue();
    });

    it("propagates an error and never calls update when the delete call fails", async () => {
      seedCategories([{ id: 1, user_id: 1, category_title: "Salary", delete: true }]);

      const resultPromise = firstValueFrom(service.applyPendingChanges());
      httpMock.expectOne(`${apiUrl}/v1/delete_all`).flush("error", { status: 500, statusText: "Server Error" });

      await expectAsync(resultPromise).toBeRejected();
      httpMock.expectNone(`${apiUrl}/v1/edit_all`);
    });
  });

  describe("refreshCategories", () => {
    it("re-fetches and re-publishes categories for the current user", (done) => {
      service.userCategories$.subscribe((categories) => {
        if (categories.length === 0) {
          return;
        }
        expect(categories[0].category_title).toBe("Salary");
        done();
      });

      service.refreshCategories();
      httpMock.expectOne(`${apiUrl}/v1/fetch_all?user_ids=1`).flush([{ id: 1, user_id: 1, category_title: "Salary" }]);
    });
  });
});
