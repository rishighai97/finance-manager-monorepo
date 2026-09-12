import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { Subject } from "rxjs";

import { TransactionListComponent } from "./transaction-list.component";
import { TransactionService } from "src/service/transaction.service";
import { UserAccountService } from "src/service/user.account.service";
import { CategoryService } from "src/service/category.service";
import { Transactions } from "src/model/transactions";
import { GroupedUserAccount } from "src/model/grouped-user-account";
import { UserAccount } from "src/model/user-account";

describe("TransactionListComponent", () => {
  let component: TransactionListComponent;
  let fixture: ComponentFixture<TransactionListComponent>;

  let groupedUserAccounts$: Subject<GroupedUserAccount[]>;
  let userCategories$: Subject<any[]>;
  let fetchAllTransactionsResult$: Subject<Transactions>;
  let transactionServiceStub: { fetchAllTransactions: jasmine.Spy };
  let userAccountServiceStub: {
    groupedUserAccounts$: Subject<GroupedUserAccount[]>;
    getFirstAccountId: jasmine.Spy;
    refreshAccounts: jasmine.Spy;
  };

  function makeAccount(id: number, name: string): UserAccount {
    return new UserAccount(
      id, // user_account_id
      1, // account_id
      1, // user_id
      name, // user_account_name
      1, // account_type_id
      name, // account_name
      ".xls", // statement_file_extensions
      "", // icon
      "cash", // account_type_1
      "bank", // account_type_2
      "savings", // account_type_3
      0, // latest_balance
      "" // latest_balance_date
    );
  }

  beforeEach(waitForAsync(() => {
    groupedUserAccounts$ = new Subject<GroupedUserAccount[]>();
    userCategories$ = new Subject<any[]>();
    fetchAllTransactionsResult$ = new Subject<Transactions>();

    transactionServiceStub = {
      fetchAllTransactions: jasmine
        .createSpy("fetchAllTransactions")
        .and.returnValue(fetchAllTransactionsResult$),
    };
    userAccountServiceStub = {
      groupedUserAccounts$,
      getFirstAccountId: jasmine.createSpy("getFirstAccountId").and.returnValue(1),
      refreshAccounts: jasmine.createSpy("refreshAccounts"),
    };

    // TransactionListComponent is standalone - see LogoutComponent's spec
    // for why this moved from `declarations` to `imports` (JIRA_7).
    TestBed.configureTestingModule({
      imports: [TransactionListComponent, IonicModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: TransactionService, useValue: transactionServiceStub },
        { provide: UserAccountService, useValue: userAccountServiceStub },
        { provide: CategoryService, useValue: { userCategories$ } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("Error handling on the transaction fetch (new - previously had no error UI at all)", () => {
    it("sets hasError and clears isLoading when the fetch errors", () => {
      fetchAllTransactionsResult$.error(new Error("network down"));

      expect(component.hasError).toBe(true);
      expect(component.isLoading).toBe(false);
    });

    it("clears hasError on a subsequent successful load", () => {
      fetchAllTransactionsResult$.error(new Error("network down"));
      expect(component.hasError).toBe(true);

      // retryLoadTransactions() re-subscribes via a fresh call to
      // fetchAllTransactions - reset the spy to return a fresh Subject,
      // matching what the real service does per call.
      const retryResult$ = new Subject<Transactions>();
      transactionServiceStub.fetchAllTransactions.and.returnValue(retryResult$);

      component.retryLoadTransactions();
      expect(component.hasError).toBe(false);

      retryResult$.next({
        start_date: "2026-01-01",
        end_date: "2026-01-31",
        opening_balance: 0,
        closing_balance: 100,
        total_credit: 100,
        total_debit: 0,
        transactions: [],
      });

      expect(component.hasError).toBe(false);
      expect(component.isLoading).toBe(false);
    });
  });

  describe("noAccountsSelected (JIRA_14 - now a derived getter, not a field toggled by the removed account-selector modal)", () => {
    it("is true by default before any account is applied", () => {
      // getFirstAccountId() stub returns 1, and ngOnInit's queryParams
      // subscription selects it immediately - reset to an empty state to
      // exercise the derived getter directly.
      component.selectedAccountIds = [];
      expect(component.noAccountsSelected).toBe(true);
    });

    it("is false once an account is selected", () => {
      component.selectedAccountIds = [1];
      expect(component.noAccountsSelected).toBe(false);
    });
  });

  describe("applyFilters (JIRA_14 - receives the query-defining filters from transaction-search, called directly by TransactionsPageComponent's template)", () => {
    it("adopts the given filters and triggers a reload", () => {
      const freshResult$ = new Subject<Transactions>();
      transactionServiceStub.fetchAllTransactions.and.returnValue(freshResult$);

      component.applyFilters({
        selectedAccountIds: [2, 3],
        startDate: "2026-04-01",
        endDate: "2027-03-31",
        selectedCategoryIds: [5],
        debitCreditIndicator: "DR",
      });

      expect(component.selectedAccountIds).toEqual([2, 3]);
      expect(component.startDate).toBe("2026-04-01");
      expect(component.endDate).toBe("2027-03-31");
      expect(component.selectedCategoryIds).toEqual([5]);
      expect(component.debitCreditIndicator).toBe("DR");
      expect(transactionServiceStub.fetchAllTransactions).toHaveBeenCalledWith(
        [2, 3],
        "2026-04-01",
        "2027-03-31",
        [5],
        "DR"
      );
    });

    it("clears any pending category changes when new filters are applied", () => {
      const freshResult$ = new Subject<Transactions>();
      transactionServiceStub.fetchAllTransactions.and.returnValue(freshResult$);
      component.catInsertMap.set("t1", []);
      component.hasCategoryChanges = true;

      component.applyFilters({
        selectedAccountIds: [1],
        startDate: "2026-04-01",
        endDate: "2027-03-31",
        selectedCategoryIds: [],
        debitCreditIndicator: null,
      });

      expect(component.hasCategoryChanges).toBe(false);
      expect(component.catInsertMap.size).toBe(0);
    });
  });

  // JIRA_15 - "Revert Categorize" used to render unconditionally even with
  // nothing pending to revert; it now shares "Update Categories"'
  // existing hasCategoryChanges condition so both appear/disappear together.
  describe("Revert Categorize / Update Categories visibility (JIRA_15)", () => {
    // Matched by aria-label (the full action name), not visible text -
    // JIRA_16's density pass shortened the on-screen labels to
    // "Revert"/"Update" while keeping the full name discoverable via
    // aria-label/title, so the test shouldn't depend on which one is showing.
    function findButtonByAriaLabel(label: string) {
      return fixture.debugElement.query(
        (el) => el.nativeElement.tagName === "ION-BUTTON" && el.nativeElement.getAttribute("aria-label") === label
      );
    }

    beforeEach(() => {
      component.selectedAccountIds = [1];
    });

    it("hides both buttons when there are no pending category changes", () => {
      component.hasCategoryChanges = false;
      fixture.detectChanges();

      expect(findButtonByAriaLabel("Revert Categorize")).toBeNull();
      expect(findButtonByAriaLabel("Update Categories")).toBeNull();
    });

    it("shows both buttons together once a category change is pending", () => {
      component.hasCategoryChanges = true;
      fixture.detectChanges();

      expect(findButtonByAriaLabel("Revert Categorize")).not.toBeNull();
      expect(findButtonByAriaLabel("Update Categories")).not.toBeNull();
    });
  });

  // Replaces ion-searchbar's built-in cancel button (JIRA_16 - see
  // transaction-list.component.html/scss for why it couldn't just be resized).
  describe("clearSearch (JIRA_16)", () => {
    it("clears the search term and re-applies the filter", () => {
      component.searchTerm = "grocery";
      spyOn(component, "applyFilter");

      component.clearSearch();

      expect(component.searchTerm).toBe("");
      expect(component.applyFilter).toHaveBeenCalled();
    });
  });

  describe("getTransactionAccountName (Calm Ledger - account shown as a tag under the title, not a title prefix)", () => {
    it("returns the account name for a known account id", () => {
      groupedUserAccounts$.next([
        new GroupedUserAccount("cash", 0, "bank", 0, "", [makeAccount(1, "HDFC RISHI")]),
      ]);

      const name = component.getTransactionAccountName({
        transaction_id: "t1",
        date: "2026-01-01",
        user_account_id: 1,
        title: "Grocery Store",
        debit_or_credit_amount: 100,
        is_debit_or_credit: "DR",
        closing_balance: 900,
        category_id: null,
        type: null,
        units: null,
        price_per_unit: null,
        user_category_ids: null,
      });

      expect(name).toBe("HDFC RISHI");
    });

    it("returns an empty string for an unknown account id", () => {
      const name = component.getTransactionAccountName({
        transaction_id: "t2",
        date: "2026-01-01",
        user_account_id: 999,
        title: "Unknown",
        debit_or_credit_amount: 100,
        is_debit_or_credit: "DR",
        closing_balance: 900,
        category_id: null,
        type: null,
        units: null,
        price_per_unit: null,
        user_category_ids: null,
      });

      expect(name).toBe("");
    });
  });
});
