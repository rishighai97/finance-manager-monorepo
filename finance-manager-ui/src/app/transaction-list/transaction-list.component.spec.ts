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

  describe("Collapsible groups in the Select Accounts modal (reused from account-list, ux/UX_transaction-list.md point 6)", () => {
    it("defaults every group to expanded", () => {
      expect(component.isAccountGroupExpanded("cash")).toBe(true);
    });

    it("flips a group's expanded state when toggled", () => {
      component.toggleAccountGroup("cash");
      expect(component.isAccountGroupExpanded("cash")).toBe(false);

      component.toggleAccountGroup("cash");
      expect(component.isAccountGroupExpanded("cash")).toBe(true);
    });

    it("only affects the toggled group, not others", () => {
      component.toggleAccountGroup("cash");
      expect(component.isAccountGroupExpanded("cash")).toBe(false);
      expect(component.isAccountGroupExpanded("investment")).toBe(true);
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
