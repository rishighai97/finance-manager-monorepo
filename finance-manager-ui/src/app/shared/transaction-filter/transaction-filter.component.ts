import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonList,
  IonIcon,
  IonButtons,
  IonButton,
  IonInput,
  IonModal,
  IonCheckbox,
  IonSearchbar,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
  closeOutline,
  chevronDownOutline,
  chevronForwardOutline,
} from "ionicons/icons";
import { GroupedUserAccount } from "src/model/grouped-user-account";
import { UserAccount } from "src/model/user-account";
import { UserAccountService } from "src/service/user.account.service";
import { CategoryService } from "src/service/category.service";
import { UserCategory } from "src/model/user-category";

// The query-defining filters this component hands back to whichever page
// hosts it (transaction-list, graphs) on Apply - everything here triggers a
// server-side refetch (TransactionService.fetchAllTransactions). Originally
// lived on transaction-list only as transaction-search; extracted into this
// shared, transaction-page-agnostic component under JIRA_23 so the new
// Graphs page can reuse the same filter UI instead of duplicating it. On
// transaction-list specifically, the text search/regex toggle stays on that
// page rather than moving here, since it's a client-side narrowing of
// already-fetched rows requiring live visual feedback against visible rows
// (see jira/JIRA_14.md's Implementation notes for why that split).
export interface TransactionFilters {
  selectedAccountIds: number[];
  startDate: string;
  endDate: string;
  selectedCategoryIds: number[];
  debitCreditIndicator: "DR" | "CR" | null;
}

@Component({
  selector: "app-transaction-filter",
  templateUrl: "./transaction-filter.component.html",
  styleUrls: ["./transaction-filter.component.scss"],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonList,
    IonIcon,
    IonButtons,
    IonButton,
    IonInput,
    IonModal,
    IonCheckbox,
    IonSearchbar,
  ],
})
export class TransactionFilterComponent implements OnInit {
  // Seeds the form from transaction-list's currently-applied filters, if
  // any, when the wrapper mounts this component. There's usually nothing
  // to seed - this page has no prior "applied" state to inherit the way
  // navigating back from a separate route used to provide one (see
  // jira/JIRA_14.md's addendum) - so it's fine for the wrapper to leave
  // this unbound and let ngOnInit's own financial-year default stand.
  @Input() initialFilters: TransactionFilters | null = null;
  @Output() filtersApplied = new EventEmitter<TransactionFilters>();

  // Filters modal (JIRA_17) - opened by TransactionsPageComponent forwarding
  // TransactionListComponent's filter-button click (see that component's
  // openFilters output); this component still owns all the filter state
  // and the nested account/category modals, only the trigger moved.
  isFilterModalOpen = false;

  groupedAccounts: GroupedUserAccount[] = [];
  accountMap: Map<number, UserAccount> = new Map();
  selectedAccountIds: number[] = [];
  isAccountModalOpen = false;

  // Collapsible groups in the "Select Accounts" modal - same mechanism as
  // account-list's/transaction-list's Level 1 sections, moved here with
  // the modal itself.
  private collapsedAccountGroups: Set<string> = new Set();

  startDate = "";
  endDate = "";

  userCategories: UserCategory[] = [];
  categoryMap: Map<number, UserCategory> = new Map();
  selectedCategoryIds: number[] = [];
  categorySearchTerm = "";
  filteredUserCategories: UserCategory[] = [];
  isCategoryModalOpen = false;

  debitCreditIndicator: "DR" | "CR" | null = null;

  constructor(
    private userAccountService: UserAccountService,
    private categoryService: CategoryService
  ) {
    addIcons({ closeOutline, chevronDownOutline, chevronForwardOutline });
  }

  ngOnInit() {
    this.setFinancialYearDates();

    if (this.initialFilters) {
      this.seedFrom(this.initialFilters);
    }

    this.userAccountService.groupedUserAccounts$.subscribe((accounts) => {
      this.groupedAccounts = accounts;
      this.createAccountMap();
    });

    this.categoryService.userCategories$.subscribe((categories) => {
      this.userCategories = categories;
      this.createCategoryMap();
      this.filteredUserCategories = this.userCategories.slice();
    });
  }

  private seedFrom(filters: TransactionFilters) {
    this.selectedAccountIds = [...filters.selectedAccountIds];
    this.startDate = filters.startDate;
    this.endDate = filters.endDate;
    this.selectedCategoryIds = [...filters.selectedCategoryIds];
    this.debitCreditIndicator = filters.debitCreditIndicator;
  }

  openFilterModal() {
    this.isFilterModalOpen = true;
  }

  closeFilterModal() {
    this.isFilterModalOpen = false;
  }

  // Explicit "Apply filters" (JIRA_17) - replaces the old emit-on-every-
  // change behavior (see jira/JIRA_14.md's addendum for why that existed
  // in the first place): now that every control lives inside one sheet you
  // open, changes several things in, then confirm, a single emit-and-close
  // on Apply fits better than firing a refetch per checkbox/date edit.
  applyFiltersFromModal() {
    this.filtersApplied.emit({
      selectedAccountIds: [...this.selectedAccountIds],
      startDate: this.startDate,
      endDate: this.endDate,
      selectedCategoryIds: [...this.selectedCategoryIds],
      debitCreditIndicator: this.debitCreditIndicator,
    });
    this.closeFilterModal();
  }

  clearAllFilters() {
    this.selectedAccountIds = [];
    this.selectedCategoryIds = [];
    this.debitCreditIndicator = null;
    this.setFinancialYearDates();
  }

  onDebitCreditIndicatorChange(value: "DR" | "CR" | null) {
    this.debitCreditIndicator = value;
  }

  openAccountSelector() {
    this.isAccountModalOpen = true;
  }

  closeAccountSelector() {
    this.isAccountModalOpen = false;
  }

  toggleAccountSelection(accountId: number) {
    const index = this.selectedAccountIds.indexOf(accountId);
    if (index > -1) {
      this.selectedAccountIds.splice(index, 1);
    } else {
      this.selectedAccountIds.push(accountId);
    }
  }

  isAccountSelected(accountId: number): boolean {
    return this.selectedAccountIds.includes(accountId);
  }

  getSelectedAccountsText(): string {
    if (this.selectedAccountIds.length === 0) return "Select accounts";
    if (this.selectedAccountIds.length === 1) {
      const account = this.accountMap.get(this.selectedAccountIds[0]);
      return account ? account.user_account_name : "One account selected";
    }
    return `${this.selectedAccountIds.length} accounts selected`;
  }

  isAccountGroupExpanded(level1Title: string): boolean {
    return !this.collapsedAccountGroups.has(level1Title);
  }

  toggleAccountGroup(level1Title: string) {
    if (this.collapsedAccountGroups.has(level1Title)) {
      this.collapsedAccountGroups.delete(level1Title);
    } else {
      this.collapsedAccountGroups.add(level1Title);
    }
  }

  openCategorySelector() {
    this.isCategoryModalOpen = true;
  }

  closeCategorySelector() {
    this.isCategoryModalOpen = false;
  }

  toggleCategorySelection(categoryId: number) {
    const index = this.selectedCategoryIds.indexOf(categoryId);
    if (index > -1) {
      this.selectedCategoryIds.splice(index, 1);
    } else {
      this.selectedCategoryIds.push(categoryId);
    }
  }

  isCategorySelected(categoryId: number): boolean {
    return this.selectedCategoryIds.includes(categoryId);
  }

  getSelectedCategoriesText(): string {
    if (this.selectedCategoryIds.length === 0) return "Select categories";
    if (this.selectedCategoryIds.length === 1) {
      const category = this.categoryMap.get(this.selectedCategoryIds[0]);
      return category ? category.category_title : "One category selected";
    }
    return `${this.selectedCategoryIds.length} categories selected`;
  }

  clearAllCategories() {
    this.selectedCategoryIds = [];
  }

  selectAllCategories() {
    // Always include -1 (Uncategorized) if present in filtered list
    const allIds = this.filteredUserCategories.map((cat) => cat.id);
    if (this.filteredUserCategories.some((cat) => cat.id === -1)) {
      this.selectedCategoryIds = [-1, ...allIds.filter((id) => id !== -1)];
    } else {
      this.selectedCategoryIds = allIds;
    }
  }

  filterCategories() {
    const term = this.categorySearchTerm.toLowerCase();
    this.filteredUserCategories = this.userCategories.filter((cat) =>
      cat.category_title.toLowerCase().includes(term)
    );
  }

  private createAccountMap() {
    this.accountMap.clear();
    this.groupedAccounts.forEach((group) => {
      group.user_accounts.forEach((account) => {
        this.accountMap.set(account.user_account_id, account);
      });
    });
  }

  private createCategoryMap() {
    this.categoryMap.clear();
    this.userCategories.forEach((category) => {
      this.categoryMap.set(category.id, category);
    });
  }

  private setFinancialYearDates() {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const isJanToMar = currentMonth < 3;
    const fyStartYear = isJanToMar ? currentYear - 1 : currentYear;

    this.startDate = `${fyStartYear}-04-01`;
    this.endDate = `${fyStartYear + 1}-03-31`;
  }
}
