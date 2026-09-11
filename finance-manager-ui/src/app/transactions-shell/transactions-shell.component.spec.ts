import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";

import { TransactionsShellComponent } from "./transactions-shell.component";
import { TransactionListComponent } from "../transaction-list/transaction-list.component";
import { TransactionSearchComponent } from "../transaction-search/transaction-search.component";

describe("TransactionsShellComponent", () => {
  let component: TransactionsShellComponent;
  let fixture: ComponentFixture<TransactionsShellComponent>;
  let router: Router;

  beforeEach(waitForAsync(() => {
    // ion-router-outlet (used in the shell's template) injects Router/
    // ActivatedRoute internally - provideRouter([]) supplies real ones,
    // so we spy on the real Router's navigate() rather than substituting
    // a fake Router object (which breaks ion-router-outlet's own DI).
    TestBed.configureTestingModule({
      imports: [TransactionsShellComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionsShellComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, "navigate");
  }));

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  // The shell coordinates TransactionListComponent and
  // TransactionSearchComponent across separate routes via <router-outlet>'s
  // (activate) event, since a literal @Input/@Output template binding
  // isn't possible between routed siblings - see JIRA_14's Implementation
  // notes.
  describe("onActivate", () => {
    it("seeds a newly-activated search component with null when nothing has been applied yet", () => {
      const search = jasmine.createSpyObj("TransactionSearchComponent", ["seedFilters"], {
        filtersApplied: { subscribe: () => {} },
        cancelled: { subscribe: () => {} },
      });
      Object.setPrototypeOf(search, TransactionSearchComponent.prototype);

      component.onActivate(search);

      expect(search.seedFilters).toHaveBeenCalledWith(null);
    });

    it("navigates back to the list and remembers the filters when search emits filtersApplied", () => {
      let capturedHandler: ((filters: any) => void) | undefined;
      const search = jasmine.createSpyObj("TransactionSearchComponent", ["seedFilters"], {
        filtersApplied: { subscribe: (fn: (filters: any) => void) => (capturedHandler = fn) },
        cancelled: { subscribe: () => {} },
      });
      Object.setPrototypeOf(search, TransactionSearchComponent.prototype);

      component.onActivate(search);
      const filters = {
        selectedAccountIds: [1],
        startDate: "2026-04-01",
        endDate: "2027-03-31",
        selectedCategoryIds: [],
        debitCreditIndicator: null,
      };
      capturedHandler!(filters);

      expect(router.navigate).toHaveBeenCalledWith(["/tabs/transactions"]);

      // A subsequently-activated list picks up the remembered filters.
      const list = jasmine.createSpyObj("TransactionListComponent", ["applyFilters"]);
      Object.setPrototypeOf(list, TransactionListComponent.prototype);
      component.onActivate(list);

      expect(list.applyFilters).toHaveBeenCalledWith(filters);
    });

    it("does nothing to a newly-activated list when no filters have ever been applied", () => {
      const list = jasmine.createSpyObj("TransactionListComponent", ["applyFilters"]);
      Object.setPrototypeOf(list, TransactionListComponent.prototype);

      component.onActivate(list);

      expect(list.applyFilters).not.toHaveBeenCalled();
    });
  });
});
