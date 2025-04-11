import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
  ViewChild,
} from "@angular/core";
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonList,
  IonIcon,
  IonChip,
  IonSpinner,
  IonButtons,
  IonButton,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonAvatar,
  IonItemDivider,
  IonModal,
  IonCheckbox,
  IonRow,
  IonCol,
  IonBadge,
  IonPopover,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
  refreshOutline,
  addCircleOutline,
  arrowBackOutline,
  walletOutline,
  pricetagsOutline,
  filterOutline,
  checkmarkOutline,
  closeOutline,
} from "ionicons/icons";
import { Transaction } from "src/model/transaction";
import { TransactionService } from "src/service/transaction.service";
import { GroupedUserAccount } from "src/model/grouped-user-account";
import { UserAccount } from "src/model/user-account";
import { ActivatedRoute, Router } from "@angular/router";
import { UserAccountService } from "src/service/user.account.service";
import { CategoryService } from "src/service/category.service";
import { UserCategory } from "src/model/user-category";

@Component({
  selector: "app-transaction-list",
  templateUrl: "./transaction-list.component.html",
  styleUrls: ["./transaction-list.component.scss"],
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
    IonChip,
    IonSpinner,
    IonButtons,
    IonButton,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonAvatar,
    IonItemDivider,
    IonModal,
    IonCheckbox,
    IonRow,
    IonCol,
    IonBadge,
    IonPopover,
  ],
})
export class TransactionListComponent implements OnInit, OnChanges {
  @Input() accountId: number | null = null;
  @Input() groupedAccounts: GroupedUserAccount[] = [];
  @Input() startDate: string = "";
  @Input() endDate: string = "";
  @Output() backClicked = new EventEmitter<void>();
  @ViewChild("accountModal") accountModal!: IonModal;
  @ViewChild("categoryModal") categoryModal!: IonModal;

  selectedAccountIds: number[] = [];
  isAccountModalOpen: boolean = false;
  isCategoryModalOpen: boolean = false;
  accountMap: Map<number, UserAccount> = new Map();

  // New properties for date inputs
  startDateInput: string = "";
  endDateInput: string = "";

  // New properties for category filter
  userCategories: UserCategory[] = [];
  selectedCategoryIds: number[] = [];
  categoryMap: Map<number, UserCategory> = new Map();

  private transactions: Transaction[] = [];
  isLoading: boolean = true;

  openingBalance?: number; // Default opening balance
  totalDebit?: number;
  totalCredit?: number;
  closingBalance?: number;

  private accountSelectionChanged = false; // Add this flag
  private categorySelectionChanged = false; // Add this flag for categories

  constructor(
    private transactionService: TransactionService,
    private route: ActivatedRoute,
    private userAccountService: UserAccountService,
    private categoryService: CategoryService,
    private router: Router
  ) {
    addIcons({
      refreshOutline,
      addCircleOutline,
      arrowBackOutline,
      walletOutline,
      pricetagsOutline,
      filterOutline,
      checkmarkOutline,
      closeOutline,
    });
  }

  ngOnInit() {
    console.log("transaction list component ngOnInit called");

    // Set default financial year dates
    this.setFinancialYearDates();

    // Subscribe to accounts
    this.userAccountService.groupedUserAccounts$.subscribe(
      (accounts: GroupedUserAccount[]) => {
        this.groupedAccounts = accounts;
        this.processAccountIcons();
        this.createAccountMap();
      }
    );

    // Subscribe to categories
    this.categoryService.userCategories$.subscribe(
      (categories: UserCategory[]) => {
        this.userCategories = categories;
        this.createCategoryMap();
      }
    );

    // Subscribe to query params
    this.route.queryParams.subscribe((params) => {
      let accountId = Number(params["accountId"]);

      // If no account ID in params, use first available account
      if (!accountId || isNaN(accountId)) {
        accountId = this.userAccountService.getFirstAccountId() || 0;
      }

      if (accountId) {
        this.accountId = accountId;
        this.selectedAccountIds = [accountId];
        this.loadTransactions();
      }

      // Only override default dates if provided in params
      if (params["startDate"]) {
        this.startDate = params["startDate"];
        this.startDateInput = params["startDate"];
      }
      if (params["endDate"]) {
        this.endDate = params["endDate"];
        this.endDateInput = params["endDate"];
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes["groupedAccounts"]) {
      this.processAccountIcons();
      this.createAccountMap();
    }
    // Update local date inputs when parent inputs change
    if (changes["startDate"]) {
      this.startDateInput = this.startDate;
    }
    if (changes["endDate"]) {
      this.endDateInput = this.endDate;
    }

    // Only reload on accountId change for initial load
    if (changes["accountId"]) {
      this.loadTransactions();
    }
  }

  openAccountSelector() {
    this.isAccountModalOpen = true;
  }

  closeAccountSelector() {
    if (this.accountSelectionChanged) {
      // Only clear if selection changed
      this.clearTransactions();
      this.accountSelectionChanged = false; // Reset the flag
    }
    this.isAccountModalOpen = false;
  }

  // New methods for category selector
  openCategorySelector() {
    this.isCategoryModalOpen = true;
  }

  closeCategorySelector() {
    if (this.categorySelectionChanged) {
      // Only clear if selection changed
      this.clearTransactions();
      this.categorySelectionChanged = false; // Reset the flag
    }
    this.isCategoryModalOpen = false;
  }

  toggleAccountSelection(accountId: number) {
    const index = this.selectedAccountIds.indexOf(accountId);
    if (index > -1) {
      this.selectedAccountIds.splice(index, 1);
    } else {
      this.selectedAccountIds.push(accountId);
    }
    this.accountSelectionChanged = true; // Set flag when selection changes
  }

  // Method to toggle category selection
  toggleCategorySelection(categoryId: number) {
    const index = this.selectedCategoryIds.indexOf(categoryId);
    if (index > -1) {
      this.selectedCategoryIds.splice(index, 1);
    } else {
      this.selectedCategoryIds.push(categoryId);
    }
    this.categorySelectionChanged = true; // Set flag when selection changes
  }

  isAccountSelected(accountId: number): boolean {
    return this.selectedAccountIds.includes(accountId);
  }

  // Method to check if a category is selected
  isCategorySelected(categoryId: number): boolean {
    return this.selectedCategoryIds.includes(categoryId);
  }

  getSelectedAccountsText(): string {
    if (this.selectedAccountIds.length === 0) return "Select accounts";
    if (this.selectedAccountIds.length === 1) {
      const account = this.accountMap.get(this.selectedAccountIds[0]);
      return account ? account.user_account_name : "One account selected";
    }
    return `${this.selectedAccountIds.length} accounts selected`;
  }

  // Method to get selected categories text
  getSelectedCategoriesText(): string {
    if (this.selectedCategoryIds.length === 0) return "Select categories";
    if (this.selectedCategoryIds.length === 1) {
      const category = this.categoryMap.get(this.selectedCategoryIds[0]);
      return category ? category.category_title : "One category selected";
    }
    return `${this.selectedCategoryIds.length} categories selected`;
  }

  refreshTransactions() {
    if (this.startDateInput && this.endDateInput) {
      this.startDate = this.startDateInput;
      this.endDate = this.endDateInput;
      // Only load transactions when refresh button is clicked
      this.loadTransactions();
    }
  }

  // Add category method (placeholder for now)
  addCategory(transaction: Transaction) {
    console.log(
      "Add category clicked for transaction:",
      transaction.transaction_id
    );
    // This function is a placeholder - will be implemented later
  }

  // Get category title for a transaction
  getCategoryTitle(transaction: Transaction): string {
    if (
      transaction.category_id &&
      this.categoryMap.has(transaction.category_id)
    ) {
      return (
        this.categoryMap.get(transaction.category_id)?.category_title || ""
      );
    }
    return "";
  }

  // Get user category titles for a transaction
  getUserCategoryTitles(transaction: Transaction): string[] {
    if (
      !transaction.user_category_ids ||
      transaction.user_category_ids.size === 0
    ) {
      return [];
    }

    return Array.from(transaction.user_category_ids)
      .map((id) => this.categoryMap.get(id)?.category_title || "")
      .filter((title) => title !== "");
  }

  private loadTransactions() {
    if (this.selectedAccountIds.length > 0 && this.startDate && this.endDate) {
      this.isLoading = true;
      
      this.transactionService
        .fetchAllTransactions(
          this.selectedAccountIds,
          this.startDate,
          this.endDate,
          this.selectedCategoryIds.length > 0 ? this.selectedCategoryIds : null
        )
        .subscribe(
          (transactions) => {
            this.openingBalance = transactions.opening_balance;
            this.closingBalance = transactions.closing_balance;
            this.totalDebit = transactions.total_debit;
            this.totalCredit = transactions.total_credit;
            this.transactions = transactions.transactions;
            this.isLoading = false;
          },
          (error) => {
            console.error("Error fetching transactions:", error);
            this.isLoading = false;
          }
        );
    }
  }

  // Check if a transaction is a debit (expense)
  isDebit(transaction: Transaction): boolean {
    return transaction.is_debit_or_credit === "DR";
  }

  // Get all transactions
  getTransactions(): Transaction[] {
    return this.transactions;
  }

  // Go back to accounts
  backToAccounts(): void {
    // This can be removed or modified based on your needs
  }

  // Add this new method to process icons
  private processAccountIcons() {
    this.groupedAccounts.forEach((group) => {
      group.user_accounts.forEach((account) => {
        if (account.icon && !account.icon.startsWith("data:")) {
          account.icon = `data:image/png;base64,${account.icon}`;
        }
      });
    });
  }

  // Create a map of account IDs to account objects for easier lookup
  private createAccountMap() {
    this.accountMap.clear();
    this.groupedAccounts.forEach((group) => {
      group.user_accounts.forEach((account) => {
        this.accountMap.set(account.account_id, account);
      });
    });
  }

  // Create a map of category IDs to category objects for easier lookup
  private createCategoryMap() {
    this.categoryMap.clear();
    this.userCategories.forEach((category) => {
      this.categoryMap.set(category.id, category);
    });
  }

  // Add method to clear transactions
  private clearTransactions() {
    this.transactions = [];
    this.totalDebit = 0;
    this.totalCredit = 0;
    this.closingBalance = 0;
  }

  // Update date change handlers
  onStartDateChange() {
    this.clearTransactions();
  }

  onEndDateChange() {
    this.clearTransactions();
  }

  // Add method to set financial year dates
  private setFinancialYearDates() {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // If current month is Jan-Mar, financial year is previous year to current year
    // If current month is Apr-Dec, financial year is current year to next year
    const isJanToMar = currentMonth < 3;
    const fyStartYear = isJanToMar ? currentYear - 1 : currentYear;

    this.startDate = `${fyStartYear}-04-01`;
    this.endDate = `${fyStartYear + 1}-03-31`;
    this.startDateInput = this.startDate;
    this.endDateInput = this.endDate;
  }

  navigateToStatementUploader() {
    this.router.navigateByUrl("/tabs/statement-uploader", {
      state: { openUploadModal: true },
    });
  }
}
