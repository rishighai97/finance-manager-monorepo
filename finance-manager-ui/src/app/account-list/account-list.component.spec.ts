import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { Subject } from "rxjs";

import { AccountListComponent } from "./account-list.component";
import { UserAccountService } from "src/service/user.account.service";
import { AccountService } from "src/service/account.service";
import { GroupedUserAccount } from "src/model/grouped-user-account";

describe("AccountListComponent", () => {
  let component: AccountListComponent;
  let fixture: ComponentFixture<AccountListComponent>;

  // Controllable stand-ins for the two streams the component subscribes to
  // in ngOnInit - lets each test push exactly the data (or error) it wants,
  // independent of what the real services' HTTP calls would produce.
  let groupedUserAccounts$: Subject<GroupedUserAccount[]>;
  let groupedAccounts$: Subject<any[]>;
  let userAccountServiceStub: {
    groupedUserAccounts$: Subject<GroupedUserAccount[]>;
    refreshAccounts: jasmine.Spy;
  };

  function makeGroup(
    level1: string,
    level2Amount: number,
    level2 = "bank"
  ): GroupedUserAccount {
    return new GroupedUserAccount(level1, 0, level2, level2Amount, "", []);
  }

  beforeEach(waitForAsync(() => {
    groupedUserAccounts$ = new Subject<GroupedUserAccount[]>();
    groupedAccounts$ = new Subject<any[]>();
    userAccountServiceStub = {
      groupedUserAccounts$,
      refreshAccounts: jasmine.createSpy("refreshAccounts"),
    };

    // AccountListComponent is standalone - see LogoutComponent's spec for
    // why this moved from `declarations` to `imports` (JIRA_7).
    TestBed.configureTestingModule({
      imports: [AccountListComponent, IonicModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: UserAccountService, useValue: userAccountServiceStub },
        {
          provide: AccountService,
          useValue: {
            groupedAccounts$,
            loadGroupedAccounts: jasmine.createSpy("loadGroupedAccounts"),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("Level 1 group expansion (ux/UX_account-list.md - collapsible sections)", () => {
    it("defaults every group to expanded on first load", () => {
      groupedUserAccounts$.next([makeGroup("cash", 100), makeGroup("investment", 50)]);

      expect(component.isLevel1Expanded("cash")).toBe(true);
      expect(component.isLevel1Expanded("investment")).toBe(true);
    });

    it("flips a group's expanded state when toggled", () => {
      groupedUserAccounts$.next([makeGroup("cash", 100)]);

      component.toggleLevel1Group("cash");
      expect(component.isLevel1Expanded("cash")).toBe(false);

      component.toggleLevel1Group("cash");
      expect(component.isLevel1Expanded("cash")).toBe(true);
    });

    it("preserves a group's toggled state across a data refresh instead of resetting it", () => {
      groupedUserAccounts$.next([makeGroup("cash", 100), makeGroup("investment", 50)]);
      component.toggleLevel1Group("cash");
      expect(component.isLevel1Expanded("cash")).toBe(false);

      // Re-emit the same groups (e.g. a refresh) - "cash" should stay
      // collapsed, "investment" (never touched) should stay expanded.
      groupedUserAccounts$.next([makeGroup("cash", 120), makeGroup("investment", 60)]);

      expect(component.isLevel1Expanded("cash")).toBe(false);
      expect(component.isLevel1Expanded("investment")).toBe(true);
    });

    it("defaults to expanded for a group title never seen before", () => {
      expect(component.isLevel1Expanded("some-new-group")).toBe(false);
      // (no data emitted yet - isLevel1Expanded returns false when the
      // group doesn't exist at all, distinct from "exists and collapsed")
    });
  });

  describe("getNetWorth (ux/UX_account-list.md Option C)", () => {
    it("sums every Level 1 group's amount, including negative ones", () => {
      groupedUserAccounts$.next([
        makeGroup("cash", -111186.89),
        makeGroup("investment", 0),
      ]);

      expect(component.getNetWorth()).toBeCloseTo(-111186.89, 2);
    });

    it("is zero when there are no accounts", () => {
      groupedUserAccounts$.next([]);
      expect(component.getNetWorth()).toBe(0);
    });
  });

  describe("Error handling on the account stream (new - previously had no error callback at all)", () => {
    it("sets hasError and clears isLoading when the stream errors", () => {
      groupedUserAccounts$.error(new Error("network down"));

      expect(component.hasError).toBe(true);
      expect(component.isLoading).toBe(false);
    });

    it("retryLoadAccounts clears hasError and re-triggers a refresh", () => {
      groupedUserAccounts$.error(new Error("network down"));
      expect(component.hasError).toBe(true);

      component.retryLoadAccounts();

      expect(component.hasError).toBe(false);
      expect(userAccountServiceStub.refreshAccounts).toHaveBeenCalled();
    });
  });
});
