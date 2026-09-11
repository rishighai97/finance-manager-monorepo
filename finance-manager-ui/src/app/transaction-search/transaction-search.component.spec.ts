import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { Subject } from "rxjs";

import { TransactionSearchComponent } from "./transaction-search.component";
import { UserAccountService } from "src/service/user.account.service";
import { CategoryService } from "src/service/category.service";
import { GroupedUserAccount } from "src/model/grouped-user-account";

describe("TransactionSearchComponent", () => {
  let component: TransactionSearchComponent;
  let fixture: ComponentFixture<TransactionSearchComponent>;

  let groupedUserAccounts$: Subject<GroupedUserAccount[]>;
  let userCategories$: Subject<any[]>;

  beforeEach(waitForAsync(() => {
    groupedUserAccounts$ = new Subject<GroupedUserAccount[]>();
    userCategories$ = new Subject<any[]>();

    // TransactionSearchComponent is standalone - matches the convention
    // established for its sibling components (see JIRA_7's Implementation
    // notes).
    TestBed.configureTestingModule({
      imports: [TransactionSearchComponent, IonicModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: UserAccountService, useValue: { groupedUserAccounts$ } },
        { provide: CategoryService, useValue: { userCategories$ } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  // Moved from transaction-list.component.spec.ts as part of JIRA_14's
  // component split - the "Select Accounts" modal (and its collapsible
  // groups) now lives here, not on transaction-list.
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

  describe("seedFilters (called by TransactionsShellComponent on activation, so the form reflects transaction-list's current filters)", () => {
    it("does nothing when given null (first-ever open, nothing applied yet)", () => {
      const originalStart = component.startDate;

      component.seedFilters(null);

      expect(component.startDate).toBe(originalStart);
      expect(component.selectedAccountIds).toEqual([]);
    });

    it("populates the form from a given filter set", () => {
      component.seedFilters({
        selectedAccountIds: [4, 5],
        startDate: "2026-04-01",
        endDate: "2027-03-31",
        selectedCategoryIds: [9],
        debitCreditIndicator: "CR",
      });

      expect(component.selectedAccountIds).toEqual([4, 5]);
      expect(component.startDate).toBe("2026-04-01");
      expect(component.startDateInput).toBe("2026-04-01");
      expect(component.endDate).toBe("2027-03-31");
      expect(component.selectedCategoryIds).toEqual([9]);
      expect(component.debitCreditIndicator).toBe("CR");
    });
  });

  describe("apply (emits the current form state as TransactionFilters)", () => {
    it("emits the current selections, syncing startDate/endDate from the input fields", () => {
      let emitted: any = null;
      component.filtersApplied.subscribe((filters) => (emitted = filters));

      component.startDateInput = "2026-04-01";
      component.endDateInput = "2027-03-31";
      component.selectedAccountIds = [1];
      component.selectedCategoryIds = [2];
      component.debitCreditIndicator = "DR";

      component.apply();

      expect(emitted).toEqual({
        selectedAccountIds: [1],
        startDate: "2026-04-01",
        endDate: "2027-03-31",
        selectedCategoryIds: [2],
        debitCreditIndicator: "DR",
      });
    });
  });

  describe("cancel (navigates back without applying anything)", () => {
    it("emits cancelled", () => {
      let cancelledFired = false;
      component.cancelled.subscribe(() => (cancelledFired = true));

      component.cancel();

      expect(cancelledFired).toBe(true);
    });
  });
});
