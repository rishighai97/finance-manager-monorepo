import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { IonicModule } from "@ionic/angular";
import { Subject } from "rxjs";

import { GraphsComponent } from "./graphs.component";
import { TransactionService } from "src/service/transaction.service";
import { UserAccountService } from "src/service/user.account.service";
import { CategoryService } from "src/service/category.service";
import { Transactions } from "src/model/transactions";
import { Transaction } from "src/model/transaction";
import { GroupedUserAccount } from "src/model/grouped-user-account";
import { UserAccount } from "src/model/user-account";
import { UserCategory } from "src/model/user-category";

describe("GraphsComponent", () => {
  let component: GraphsComponent;
  let fixture: ComponentFixture<GraphsComponent>;

  let groupedUserAccounts$: Subject<GroupedUserAccount[]>;
  let userCategories$: Subject<UserCategory[]>;
  let fetchAllTransactionsResult$: Subject<Transactions>;
  let transactionServiceStub: { fetchAllTransactions: jasmine.Spy };

  function makeAccount(id: number, name: string): UserAccount {
    return new UserAccount(id, 1, 1, name, 1, name, ".csv", "", "cash", "bank", "savings", 0, "");
  }

  function makeGroup(accounts: UserAccount[]): GroupedUserAccount {
    return new GroupedUserAccount("Cash", 0, "Bank", 0, "", accounts);
  }

  function makeTx(overrides: Partial<Transaction>): Transaction {
    return {
      transaction_id: "t1",
      date: "2026-04-01",
      user_account_id: 1,
      title: "Test",
      debit_or_credit_amount: 100,
      is_debit_or_credit: "DR",
      closing_balance: null as any,
      category_id: null,
      type: null,
      units: null,
      price_per_unit: null,
      user_category_ids: null,
      ...overrides,
    };
  }

  function txResult(transactions: Transaction[]): Transactions {
    return {
      start_date: "2026-04-01",
      end_date: "2027-03-31",
      opening_balance: 0,
      closing_balance: 0,
      total_credit: 0,
      total_debit: 0,
      transactions,
    };
  }

  beforeEach(waitForAsync(() => {
    groupedUserAccounts$ = new Subject<GroupedUserAccount[]>();
    userCategories$ = new Subject<UserCategory[]>();
    fetchAllTransactionsResult$ = new Subject<Transactions>();

    transactionServiceStub = {
      fetchAllTransactions: jasmine
        .createSpy("fetchAllTransactions")
        .and.returnValue(fetchAllTransactionsResult$),
    };

    TestBed.configureTestingModule({
      imports: [GraphsComponent, IonicModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TransactionService, useValue: transactionServiceStub },
        {
          provide: UserAccountService,
          useValue: { groupedUserAccounts$ },
        },
        { provide: CategoryService, useValue: { userCategories$ } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GraphsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  // fetchAllTransactionsResult$ only has a live subscriber once
  // loadTransactions() has actually run (via applyFilters, same as the real
  // filter component triggers it) - pushing to it beforehand is a no-op.
  function triggerLoad(accountIds: number[] = [1]) {
    component.selectedAccountIds = accountIds;
    component.applyFilters(component.currentFilters);
  }

  describe("default account selection (real implementation-time decision - no query-param drill-in here, unlike transaction-list)", () => {
    it("selects every account and fetches once accounts load, when nothing was selected yet", () => {
      groupedUserAccounts$.next([makeGroup([makeAccount(1, "HDFC"), makeAccount(2, "AXIS")])]);

      expect(component.selectedAccountIds).toEqual([1, 2]);
      expect(transactionServiceStub.fetchAllTransactions).toHaveBeenCalled();
    });
  });

  describe("Spending by category aggregation", () => {
    beforeEach(() => {
      userCategories$.next([
        { id: 1, user_id: 1, category_title: "FOOD" } as UserCategory,
        { id: 2, user_id: 1, category_title: "SALARY" } as UserCategory,
      ]);
    });

    it("buckets uncategorized debit transactions separately from named categories", () => {
      triggerLoad();
      fetchAllTransactionsResult$.next(
        txResult([
          makeTx({ transaction_id: "a", is_debit_or_credit: "DR", debit_or_credit_amount: 200, user_category_ids: new Set([1]) }),
          makeTx({ transaction_id: "b", is_debit_or_credit: "DR", debit_or_credit_amount: 50, user_category_ids: null }),
          makeTx({ transaction_id: "c", is_debit_or_credit: "CR", debit_or_credit_amount: 999, user_category_ids: null }),
        ])
      );

      const food = component.categorySlices.find((s) => s.name === "FOOD");
      const uncategorized = component.categorySlices.find((s) => s.name === "Uncategorized");
      expect(food?.amount).toBe(200);
      expect(uncategorized?.amount).toBe(50);
      // Credit transactions never contribute to the spend breakdown.
      expect(component.categoryTotal).toBe(250);
    });

    it("contributes a multi-category transaction's full amount to every category it's tagged under", () => {
      triggerLoad();
      fetchAllTransactionsResult$.next(
        txResult([
          makeTx({ is_debit_or_credit: "DR", debit_or_credit_amount: 100, user_category_ids: new Set([1, 2]) }),
        ])
      );

      const food = component.categorySlices.find((s) => s.name === "FOOD");
      const salary = component.categorySlices.find((s) => s.name === "SALARY");
      expect(food?.amount).toBe(100);
      expect(salary?.amount).toBe(100);
      // Deliberate double-count, not a bug - see the component's own comment:
      // one ₹100 transaction tagged under 2 categories sums to 200 here.
      expect(component.categoryTotal).toBe(200);
    });

    it("caps named slices at 5 and folds the rest into Other alongside genuinely uncategorized spend", () => {
      userCategories$.next(
        Array.from({ length: 7 }, (_, i) => ({ id: i + 1, user_id: 1, category_title: `CAT${i + 1}` } as UserCategory))
      );
      const txs = Array.from({ length: 7 }, (_, i) =>
        makeTx({
          transaction_id: `t${i}`,
          is_debit_or_credit: "DR",
          debit_or_credit_amount: 100 - i, // distinct amounts so ranking is deterministic
          user_category_ids: new Set([i + 1]),
        })
      );
      triggerLoad();
      fetchAllTransactionsResult$.next(txResult(txs));

      expect(component.categorySlices.length).toBeLessThanOrEqual(6);
      expect(component.categorySlices.some((s) => s.name === "Other")).toBe(true);
    });
  });

  describe("Income vs. expense / monthly spend aggregation", () => {
    it("groups by month and separates credit from debit totals", () => {
      triggerLoad();
      fetchAllTransactionsResult$.next(
        txResult([
          makeTx({ date: "2026-04-05", is_debit_or_credit: "CR", debit_or_credit_amount: 500 }),
          makeTx({ date: "2026-04-10", is_debit_or_credit: "DR", debit_or_credit_amount: 300 }),
          makeTx({ date: "2026-06-01", is_debit_or_credit: "DR", debit_or_credit_amount: 100 }),
        ])
      );

      expect(component.monthlyBars.length).toBe(2);
      const april = component.monthlyBars.find((b) => b.month === "Apr")!;
      expect(april.credit).toBe(500);
      expect(april.debit).toBe(300);

      const juneSpend = component.monthlySpendBars.find((b) => b.month === "Jun")!;
      expect(juneSpend.amount).toBe(100);
    });
  });

  describe("Balance trend's single-account constraint", () => {
    it("needs guidance when more than one account is selected", () => {
      triggerLoad([1, 2]);
      fetchAllTransactionsResult$.next(txResult([makeTx({ closing_balance: 500 })]));
      expect(component.balanceGuidanceNeeded).toBe(true);
    });

    it("needs guidance when the single selected account has no closing_balance data (e.g. Groww/Amex)", () => {
      triggerLoad([1]);
      fetchAllTransactionsResult$.next(txResult([makeTx({ closing_balance: null as any })]));
      expect(component.balanceGuidanceNeeded).toBe(true);
      expect(component.balancePoints.length).toBe(0);
    });

    it("plots the series when exactly one account has real balance data", () => {
      triggerLoad([1]);
      fetchAllTransactionsResult$.next(
        txResult([
          makeTx({ transaction_id: "a", date: "2026-04-01", closing_balance: 1000 }),
          makeTx({ transaction_id: "b", date: "2026-04-02", closing_balance: 800 }),
        ])
      );
      expect(component.balanceGuidanceNeeded).toBe(false);
      expect(component.balancePoints.length).toBe(2);
      expect(component.balancePoints[1].balance).toBe(800);
    });
  });

  describe("Error handling on the transaction fetch", () => {
    it("sets hasError and clears isLoading when the fetch errors", () => {
      component.selectedAccountIds = [1];
      component.applyFilters(component.currentFilters);
      fetchAllTransactionsResult$.error(new Error("network down"));

      expect(component.hasError).toBe(true);
      expect(component.isLoading).toBe(false);
    });

    it("clears hasError on retry", () => {
      component.selectedAccountIds = [1];
      component.applyFilters(component.currentFilters);
      fetchAllTransactionsResult$.error(new Error("network down"));
      expect(component.hasError).toBe(true);

      const retryResult$ = new Subject<Transactions>();
      transactionServiceStub.fetchAllTransactions.and.returnValue(retryResult$);
      component.retryLoad();
      expect(component.hasError).toBe(false);
    });
  });
});
