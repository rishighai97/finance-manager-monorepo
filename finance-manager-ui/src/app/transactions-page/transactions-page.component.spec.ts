import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { Subject } from "rxjs";

import { TransactionsPageComponent } from "./transactions-page.component";
import { TransactionListComponent } from "../transaction-list/transaction-list.component";
import { TransactionService } from "src/service/transaction.service";
import { UserAccountService } from "src/service/user.account.service";
import { CategoryService } from "src/service/category.service";
import { Transactions } from "src/model/transactions";
import { GroupedUserAccount } from "src/model/grouped-user-account";

// Replaces transactions-shell.component.spec.ts (jira/JIRA_14.md's
// addendum) - there's no router-outlet/(activate) coordination to test any
// more, just that transaction-search's filtersApplied reaches
// transaction-list's applyFilters() via the template's #list reference.
describe("TransactionsPageComponent", () => {
  let fixture: ComponentFixture<TransactionsPageComponent>;

  let groupedUserAccounts$: Subject<GroupedUserAccount[]>;
  let userCategories$: Subject<any[]>;
  let fetchAllTransactionsResult$: Subject<Transactions>;
  let transactionServiceStub: { fetchAllTransactions: jasmine.Spy };

  beforeEach(waitForAsync(() => {
    groupedUserAccounts$ = new Subject<GroupedUserAccount[]>();
    userCategories$ = new Subject<any[]>();
    fetchAllTransactionsResult$ = new Subject<Transactions>();

    transactionServiceStub = {
      fetchAllTransactions: jasmine
        .createSpy("fetchAllTransactions")
        .and.returnValue(fetchAllTransactionsResult$),
    };

    TestBed.configureTestingModule({
      imports: [TransactionsPageComponent, IonicModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: TransactionService, useValue: transactionServiceStub },
        {
          provide: UserAccountService,
          useValue: {
            groupedUserAccounts$,
            getFirstAccountId: jasmine.createSpy("getFirstAccountId").and.returnValue(0),
            refreshAccounts: jasmine.createSpy("refreshAccounts"),
          },
        },
        { provide: CategoryService, useValue: { userCategories$ } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionsPageComponent);
    fixture.detectChanges();
  }));

  it("should create", () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it("forwards transaction-search's filtersApplied to the projected transaction-list's applyFilters", () => {
    const listDebugElement = fixture.debugElement.query(
      (el) => el.componentInstance instanceof TransactionListComponent
    );
    const listComponent: TransactionListComponent = listDebugElement.componentInstance;
    const applyFiltersSpy = spyOn(listComponent, "applyFilters");

    const searchDebugElement = fixture.debugElement.query(
      (el) => el.componentInstance?.filtersApplied !== undefined
    );
    const filters = {
      selectedAccountIds: [1],
      startDate: "2026-04-01",
      endDate: "2027-03-31",
      selectedCategoryIds: [],
      debitCreditIndicator: null as null,
    };
    searchDebugElement.componentInstance.filtersApplied.emit(filters);

    expect(applyFiltersSpy).toHaveBeenCalledWith(filters);
  });
});
