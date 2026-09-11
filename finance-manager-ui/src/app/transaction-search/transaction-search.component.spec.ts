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

  // Replaces the old explicit Apply button - see jira/JIRA_14.md's
  // addendum for why there's no "screen" to apply-and-leave any more.
  describe("emitting filtersApplied on a filter change (no Apply button)", () => {
    it("emits on a date change", () => {
      let emitted: any = null;
      component.filtersApplied.subscribe((filters) => (emitted = filters));

      component.startDate = "2026-04-01";
      component.onStartDateChange();

      expect(emitted).toEqual({
        selectedAccountIds: [],
        startDate: "2026-04-01",
        endDate: component.endDate,
        selectedCategoryIds: [],
        debitCreditIndicator: null,
      });
    });

    it("emits on a debit/credit indicator change", () => {
      let emitted: any = null;
      component.filtersApplied.subscribe((filters) => (emitted = filters));

      component.onDebitCreditIndicatorChange("DR");

      expect(component.debitCreditIndicator).toBe("DR");
      expect(emitted?.debitCreditIndicator).toBe("DR");
    });

    it("emits once when the account modal closes after a selection change, not per checkbox", () => {
      let emitCount = 0;
      component.filtersApplied.subscribe(() => emitCount++);

      component.openAccountSelector();
      component.toggleAccountSelection(1);
      component.toggleAccountSelection(2);
      expect(emitCount).toBe(0);

      component.closeAccountSelector();

      expect(emitCount).toBe(1);
      expect(component.selectedAccountIds).toEqual([1, 2]);
    });

    it("does not emit when the account modal closes with no selection change", () => {
      let emitCount = 0;
      component.filtersApplied.subscribe(() => emitCount++);

      component.openAccountSelector();
      component.closeAccountSelector();

      expect(emitCount).toBe(0);
    });

    it("emits once when the category modal closes after a selection change", () => {
      let emitCount = 0;
      component.filtersApplied.subscribe(() => emitCount++);

      component.openCategorySelector();
      component.toggleCategorySelection(9);
      component.closeCategorySelector();

      expect(emitCount).toBe(1);
      expect(component.selectedCategoryIds).toEqual([9]);
    });
  });
});
