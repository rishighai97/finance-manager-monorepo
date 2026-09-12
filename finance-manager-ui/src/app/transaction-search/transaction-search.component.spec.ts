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

  // JIRA_17 - the always-visible chip row (including its own date-range
  // chip/modal) was replaced by one Filters modal opened via a button in
  // transaction-list's search row; date range is now two plain fields
  // inline in that sheet, so the old getDateRangeText()/isDateRangeModalOpen/
  // openDateRangeSelector()/closeDateRangeSelector() are gone.
  describe("openFilterModal / closeFilterModal", () => {
    it("toggles isFilterModalOpen", () => {
      expect(component.isFilterModalOpen).toBe(false);

      component.openFilterModal();
      expect(component.isFilterModalOpen).toBe(true);

      component.closeFilterModal();
      expect(component.isFilterModalOpen).toBe(false);
    });
  });

  // seedFilters became @Input() initialFilters as part of jira/JIRA_14.md's
  // addendum (wrapper composition instead of the router-outlet/(activate)
  // coordinator) - seeding now happens in ngOnInit, since Angular sets a
  // statically-bound @Input before ngOnInit runs.
  describe("initialFilters (seeds the form when the wrapper provides prior filter state)", () => {
    it("keeps the financial-year default when no initialFilters are given", () => {
      const originalStart = component.startDate;

      expect(component.startDate).toBe(originalStart);
      expect(component.selectedAccountIds).toEqual([]);
    });

    it("populates the form from initialFilters set before ngOnInit runs", () => {
      const seededFixture = TestBed.createComponent(TransactionSearchComponent);
      const seededComponent = seededFixture.componentInstance;
      seededComponent.initialFilters = {
        selectedAccountIds: [4, 5],
        startDate: "2026-04-01",
        endDate: "2027-03-31",
        selectedCategoryIds: [9],
        debitCreditIndicator: "CR",
      };

      seededFixture.detectChanges();

      expect(seededComponent.selectedAccountIds).toEqual([4, 5]);
      expect(seededComponent.startDate).toBe("2026-04-01");
      expect(seededComponent.endDate).toBe("2027-03-31");
      expect(seededComponent.selectedCategoryIds).toEqual([9]);
      expect(seededComponent.debitCreditIndicator).toBe("CR");
    });
  });

  // JIRA_17 - replaces the old emit-on-every-change behavior (account/
  // category modal close, date/DR-CR edits) with one explicit "Apply
  // filters" action inside the Filters modal, since several changes now
  // typically happen before confirming, not one at a time on a visible page.
  describe("applyFiltersFromModal (explicit Apply, replacing per-change emission)", () => {
    it("emits the current filter state and closes the modal", () => {
      let emitted: any = null;
      component.filtersApplied.subscribe((filters) => (emitted = filters));
      component.openFilterModal();

      component.selectedAccountIds = [1, 2];
      component.startDate = "2026-04-01";
      component.endDate = "2027-03-31";
      component.selectedCategoryIds = [9];
      component.debitCreditIndicator = "DR";

      component.applyFiltersFromModal();

      expect(emitted).toEqual({
        selectedAccountIds: [1, 2],
        startDate: "2026-04-01",
        endDate: "2027-03-31",
        selectedCategoryIds: [9],
        debitCreditIndicator: "DR",
      });
      expect(component.isFilterModalOpen).toBe(false);
    });

    it("does not emit merely from opening/closing the account or category modals", () => {
      let emitCount = 0;
      component.filtersApplied.subscribe(() => emitCount++);

      component.openAccountSelector();
      component.toggleAccountSelection(1);
      component.closeAccountSelector();

      component.openCategorySelector();
      component.toggleCategorySelection(9);
      component.closeCategorySelector();

      expect(emitCount).toBe(0);
      expect(component.selectedAccountIds).toEqual([1]);
      expect(component.selectedCategoryIds).toEqual([9]);
    });
  });

  describe("clearAllFilters", () => {
    it("resets accounts, categories, DR/CR, and the date range", () => {
      component.selectedAccountIds = [1, 2];
      component.selectedCategoryIds = [9];
      component.debitCreditIndicator = "DR";
      const defaultStart = component.startDate;
      const defaultEnd = component.endDate;
      component.startDate = "2020-01-01";
      component.endDate = "2020-12-31";

      component.clearAllFilters();

      expect(component.selectedAccountIds).toEqual([]);
      expect(component.selectedCategoryIds).toEqual([]);
      expect(component.debitCreditIndicator).toBeNull();
      expect(component.startDate).toBe(defaultStart);
      expect(component.endDate).toBe(defaultEnd);
    });
  });
});
