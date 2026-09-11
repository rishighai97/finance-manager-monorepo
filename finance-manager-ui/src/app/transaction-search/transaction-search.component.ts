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
  IonSelect,
  IonSelectOption,
  IonModal,
  IonCheckbox,
  IonSearchbar,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
  closeOutline,
  chevronDownOutline,
} from "ionicons/icons";
import { GroupedUserAccount } from "src/model/grouped-user-account";
import { UserAccount } from "src/model/user-account";
import { UserAccountService } from "src/service/user.account.service";
import { CategoryService } from "src/service/category.service";
import { UserCategory } from "src/model/user-category";

// The query-defining filters transaction-search hands back to
// transaction-list on Apply - everything here triggers a server-side
// refetch (TransactionService.fetchAllTransactions), unlike the text
// search/regex toggle, which stays on transaction-list since it's a
// client-side narrowing of already-fetched rows requiring live visual
// feedback against visible rows (see ux/JIRA_14.md's Implementation
// notes for why that split, not "everything moves").
export interface TransactionFilters {
  selectedAccountIds: number[];
  startDate: string;
  endDate: string;
  selectedCategoryIds: number[];
  debitCreditIndicator: "DR" | "CR" | null;
}

@Component({
  selector: "app-transaction-search",
  templateUrl: "./transaction-search.component.html",
  styleUrls: ["./transaction-search.component.scss"],
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
    IonSelect,
    IonSelectOption,
    IonModal,
    IonCheckbox,
    IonSearchbar,
  ],
})
export class TransactionSearchComponent implements OnInit {
  // Seeds the form from transaction-list's currently-applied filters, if
  // any, when the wrapper mounts this component. There's usually nothing
  // to seed - this page has no prior "applied" state to inherit the way
  // navigating back from a separate route used to provide one (see
  // jira/JIRA_14.md's addendum) - so it's fine for the wrapper to leave
  // this unbound and let ngOnInit's own financial-year default stand.
  @Input() initialFilters: TransactionFilters | null = null;
  @Output() filtersApplied = new EventEmitter<TransactionFilters>();

  groupedAccounts: GroupedUserAccount[] = [];
  accountMap: Map<number, UserAccount> = new Map();
  selectedAccountIds: number[] = [];
  isAccountModalOpen = false;
  private accountSelectionChanged = false;

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
  private categorySelectionChanged = false;

  debitCreditIndicator: "DR" | "CR" | null = null;

  constructor(
    private userAccountService: UserAccountService,
    private categoryService: CategoryService
  ) {
    addIcons({ closeOutline, chevronDownOutline });
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

  // Replaces the old Apply button - there's no "screen" to apply-and-leave
  // any more (see jira/JIRA_14.md's addendum), so every meaningful filter
  // change emits immediately. Account/category selection change while their
  // modal is open, but only emit once on close (closeAccountSelector/
  // closeCategorySelector below) rather than per-checkbox, so toggling
  // several accounts doesn't fire a transaction refetch per click.
  private emitFilters() {
    this.filtersApplied.emit({
      selectedAccountIds: [...this.selectedAccountIds],
      startDate: this.startDate,
      endDate: this.endDate,
      selectedCategoryIds: [...this.selectedCategoryIds],
      debitCreditIndicator: this.debitCreditIndicator,
    });
  }

  onStartDateChange() {
    this.emitFilters();
  }

  onEndDateChange() {
    this.emitFilters();
  }

  onDebitCreditIndicatorChange(value: "DR" | "CR" | null) {
    this.debitCreditIndicator = value;
    this.emitFilters();
  }

  openAccountSelector() {
    this.isAccountModalOpen = true;
  }

  closeAccountSelector() {
    this.isAccountModalOpen = false;
    if (this.accountSelectionChanged) {
      this.emitFilters();
    }
    this.accountSelectionChanged = false;
  }

  toggleAccountSelection(accountId: number) {
    const index = this.selectedAccountIds.indexOf(accountId);
    if (index > -1) {
      this.selectedAccountIds.splice(index, 1);
    } else {
      this.selectedAccountIds.push(accountId);
    }
    this.accountSelectionChanged = true;
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
    if (this.categorySelectionChanged) {
      this.emitFilters();
    }
    this.categorySelectionChanged = false;
  }

  toggleCategorySelection(categoryId: number) {
    const index = this.selectedCategoryIds.indexOf(categoryId);
    if (index > -1) {
      this.selectedCategoryIds.splice(index, 1);
    } else {
      this.selectedCategoryIds.push(categoryId);
    }
    this.categorySelectionChanged = true;
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
    this.categorySelectionChanged = true;
  }

  selectAllCategories() {
    // Always include -1 (Uncategorized) if present in filtered list
    const allIds = this.filteredUserCategories.map((cat) => cat.id);
    if (this.filteredUserCategories.some((cat) => cat.id === -1)) {
      this.selectedCategoryIds = [-1, ...allIds.filter((id) => id !== -1)];
    } else {
      this.selectedCategoryIds = allIds;
    }
    this.categorySelectionChanged = true;
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
