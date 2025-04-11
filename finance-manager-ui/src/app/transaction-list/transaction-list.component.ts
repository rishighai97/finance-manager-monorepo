// Updated transaction-list.component.ts

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
  IonSearchbar,
  IonRadioGroup,
  IonRadio,
  AlertController,
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
  closeCircleOutline,
  searchOutline,
  saveOutline,
  addOutline,
  ellipsisVerticalOutline,
  alertCircleOutline,
} from "ionicons/icons";
import { Transaction } from "src/model/transaction";
import { TransactionService } from "src/service/transaction.service";
import { GroupedUserAccount } from "src/model/grouped-user-account";
import { UserAccount } from "src/model/user-account";
import { ActivatedRoute, Router } from "@angular/router";
import { UserAccountService } from "src/service/user.account.service";
import { CategoryService } from "src/service/category.service";
import { UserCategory } from "src/model/user-category";
import {
  TransactionUserCategory,
  TransactionUserCategoryAction,
} from "src/model/transaction-user-category";
import { ToastService } from "src/service/toast.service";

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
    IonSearchbar,
    IonRadioGroup,
    IonRadio,
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
  @ViewChild("addCategoryModal") addCategoryModal!: IonModal;

  selectedAccountIds: number[] = [];
  isAccountModalOpen: boolean = false;
  isCategoryModalOpen: boolean = false;
  isAddCategoryModalOpen: boolean = false;
  accountMap: Map<number, UserAccount> = new Map();

  // Transaction search
  searchTerm: string = "";
  filteredTransactions: Transaction[] = [];

  // New properties for date inputs
  startDateInput: string = "";
  endDateInput: string = "";

  // New properties for category filter
  userCategories: UserCategory[] = [];
  selectedCategoryIds: number[] = [];
  categoryMap: Map<number, UserCategory> = new Map();

  // New properties for category management
  selectedTransaction: Transaction | null = null;
  selectedCategories: number[] = [];
  catInsertMap: Map<string, TransactionUserCategory[]> = new Map();
  catDeleteMap: Map<string, TransactionUserCategory[]> = new Map();
  hasCategoryChanges: boolean = false;
  batchAddCategories: number[] = [];

  // New property to track if no accounts are selected
  noAccountsSelected: boolean = true;

  private transactions: Transaction[] = [];
  isLoading: boolean = false;
  isSaving: boolean = false;

  openingBalance?: number;
  totalDebit?: number;
  totalCredit?: number;
  closingBalance?: number;

  private accountSelectionChanged = false;
  private categorySelectionChanged = false;

  constructor(
    private transactionService: TransactionService,
    private route: ActivatedRoute,
    private userAccountService: UserAccountService,
    private categoryService: CategoryService,
    private router: Router,
    private toastService: ToastService,
    private alertController: AlertController
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
      closeCircleOutline,
      searchOutline,
      saveOutline,
      addOutline,
      ellipsisVerticalOutline,
      alertCircleOutline,
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
        this.noAccountsSelected = false; // Set flag to false since we have an account
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

    // Update the noAccountsSelected flag
    this.noAccountsSelected = this.selectedAccountIds.length === 0;
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

      if (this.selectedAccountIds.length === 0) {
        this.noAccountsSelected = true;
        this.toastService.showError("Please select at least one account");
        return;
      }

      this.noAccountsSelected = false;
      // Only load transactions when refresh button is clicked
      this.loadTransactions();

      // Clear category changes when refreshing
      this.resetCategoryChanges();
    }
  }

  // Search transactions
  onSearchChange(event: any) {
    this.searchTerm = event.detail.value || "";
    this.applyFilter();
  }

  applyFilter() {
    if (!this.searchTerm) {
      this.filteredTransactions = [...this.transactions];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredTransactions = this.transactions.filter(
        (transaction) =>
          transaction.title.toLowerCase().includes(searchLower) ||
          this.accountMap
            .get(transaction.user_account_id)
            ?.user_account_name.toLowerCase()
            .includes(searchLower) ||
          this.getUserCategoryTitles(transaction).some((title) =>
            title.toLowerCase().includes(searchLower)
          )
      );
    }
  }

  // Open add category modal for a specific transaction
  addCategory(transaction: Transaction, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    this.selectedTransaction = transaction;
    this.selectedCategories = Array.from(transaction.user_category_ids || []);
    this.isAddCategoryModalOpen = true;
  }

  // Open add category modal to batch add categories to all visible transactions
  openBatchAddCategories() {
    this.selectedTransaction = null;
    this.batchAddCategories = [];
    this.isAddCategoryModalOpen = true;
  }

  // Close add category modal
  closeAddCategoryModal() {
    this.isAddCategoryModalOpen = false;
    this.selectedTransaction = null;
    this.selectedCategories = [];
    this.batchAddCategories = [];
  }

  // Toggle category selection in add category modal
  toggleAddCategorySelection(categoryId: number) {
    if (this.selectedTransaction) {
      const index = this.selectedCategories.indexOf(categoryId);
      if (index > -1) {
        this.selectedCategories.splice(index, 1);
      } else {
        // Check if we're at the maximum of 5 categories
        if (this.selectedCategories.length >= 5) {
          this.toastService.showError(
            "Maximum 5 categories allowed per transaction"
          );
          return;
        }
        this.selectedCategories.push(categoryId);
      }
    } else {
      // Batch add mode
      const index = this.batchAddCategories.indexOf(categoryId);
      if (index > -1) {
        this.batchAddCategories.splice(index, 1);
      } else {
        // No limit on batch selection
        this.batchAddCategories.push(categoryId);
      }
    }
  }

  // Check if a category is selected in the add category modal
  isAddCategorySelected(categoryId: number): boolean {
    if (this.selectedTransaction) {
      return this.selectedCategories.includes(categoryId);
    } else {
      return this.batchAddCategories.includes(categoryId);
    }
  }

  // Save selected categories for a transaction
  saveSelectedCategories() {
    if (this.selectedTransaction) {
      // Single transaction mode
      const transactionId = this.selectedTransaction.transaction_id;
      const originalCategories = new Set(
        this.selectedTransaction.user_category_ids || []
      );

      // Find categories to add
      const categoriesToAdd = this.selectedCategories.filter(
        (catId) => !originalCategories.has(catId)
      );

      // Find categories to remove
      const categoriesToRemove = Array.from(originalCategories).filter(
        (catId) => !this.selectedCategories.includes(catId)
      );

      // Process additions
      if (categoriesToAdd.length > 0) {
        const insertItems = categoriesToAdd.map((catId) => ({
          transaction_id: transactionId,
          user_category_id: catId,
          action: TransactionUserCategoryAction.INSERT,
        }));

        let currentInserts = this.catInsertMap.get(transactionId) || [];
        currentInserts = [...currentInserts, ...insertItems];
        this.catInsertMap.set(transactionId, currentInserts);
      }

      // Process removals
      if (categoriesToRemove.length > 0) {
        const deleteItems = categoriesToRemove.map((catId) => ({
          transaction_id: transactionId,
          user_category_id: catId,
          action: TransactionUserCategoryAction.DELETE,
        }));

        let currentDeletes = this.catDeleteMap.get(transactionId) || [];
        currentDeletes = [...currentDeletes, ...deleteItems];
        this.catDeleteMap.set(transactionId, currentDeletes);
      }

      // Update the transaction in the view
      this.updateTransactionCategories(this.selectedTransaction);
      this.checkCategoryChanges();
    } else {
      // Batch add mode - add selected categories to all visible transactions
      if (this.batchAddCategories.length === 0) {
        this.toastService.showError("Please select at least one category");
        return;
      }

      // Apply to all filtered transactions
      this.filteredTransactions.forEach((transaction) => {
        const transactionId = transaction.transaction_id;
        const originalCategories = new Set(transaction.user_category_ids || []);

        // Only add categories that don't already exist
        const categoriesToAdd = this.batchAddCategories.filter(
          (catId) => !originalCategories.has(catId)
        );

        // Check if adding would exceed 5 categories
        if (originalCategories.size + categoriesToAdd.length > 5) {
          // Skip this transaction
          return;
        }

        // Process additions
        if (categoriesToAdd.length > 0) {
          const insertItems = categoriesToAdd.map((catId) => ({
            transaction_id: transactionId,
            user_category_id: catId,
            action: TransactionUserCategoryAction.INSERT,
          }));

          let currentInserts = this.catInsertMap.get(transactionId) || [];
          currentInserts = [...currentInserts, ...insertItems];
          this.catInsertMap.set(transactionId, currentInserts);

          // Update the transaction in the view
          this.updateTransactionCategories(transaction);
        }
      });

      this.checkCategoryChanges();
    }

    this.closeAddCategoryModal();
  }

  // Update a transaction's categories based on pending changes
  updateTransactionCategories(transaction: Transaction) {
    const transactionId = transaction.transaction_id;
    let updatedCategories = new Set(transaction.user_category_ids || []);

    // Apply inserts
    const insertItems = this.catInsertMap.get(transactionId) || [];
    insertItems.forEach((item) => {
      updatedCategories.add(item.user_category_id);
    });

    // Apply deletes
    const deleteItems = this.catDeleteMap.get(transactionId) || [];
    deleteItems.forEach((item) => {
      updatedCategories.delete(item.user_category_id);
    });

    // Update the transaction object
    transaction.user_category_ids = updatedCategories;
  }

  // Remove a category from a transaction
  removeCategory(
    transaction: Transaction,
    categoryTitle: string,
    event: Event
  ) {
    event.stopPropagation();

    let categoryId: number | undefined = Array.from(
      transaction.user_category_ids || []
    ).find((id) => this.categoryMap.get(id));

    // todo handle this condition
    if (categoryId === undefined) {
      return;
    }
    const transactionId = transaction.transaction_id;

    // Create a DELETE action for this category
    const deleteItem: TransactionUserCategory = {
      transaction_id: transactionId,
      user_category_id: categoryId,
      action: TransactionUserCategoryAction.DELETE,
    };

    // Add to delete map
    let currentDeletes = this.catDeleteMap.get(transactionId) || [];
    currentDeletes = [...currentDeletes, deleteItem];
    this.catDeleteMap.set(transactionId, currentDeletes);

    // Check if we need to remove from insert map
    let currentInserts = this.catInsertMap.get(transactionId) || [];
    const insertIndex = currentInserts.findIndex(
      (item) =>
        item.user_category_id === categoryId &&
        item.action === TransactionUserCategoryAction.INSERT
    );

    if (insertIndex !== -1) {
      // If it's in the insert map, just remove it from there
      currentInserts.splice(insertIndex, 1);
      if (currentInserts.length === 0) {
        this.catInsertMap.delete(transactionId);
      } else {
        this.catInsertMap.set(transactionId, currentInserts);
      }

      // And remove from delete map too since it was never actually saved
      const deleteIndex = currentDeletes.findIndex(
        (item) =>
          item.user_category_id === categoryId &&
          item.action === TransactionUserCategoryAction.DELETE
      );
      if (deleteIndex !== -1) {
        currentDeletes.splice(deleteIndex, 1);
        if (currentDeletes.length === 0) {
          this.catDeleteMap.delete(transactionId);
        } else {
          this.catDeleteMap.set(transactionId, currentDeletes);
        }
      }
    }

    // Update the transaction in the view
    this.updateTransactionCategories(transaction);
    this.checkCategoryChanges();
  }

  // Check if there are pending category changes
  checkCategoryChanges() {
    this.hasCategoryChanges =
      this.catInsertMap.size > 0 || this.catDeleteMap.size > 0;
  }

  // Reset all category changes
  resetCategoryChanges() {
    this.catInsertMap.clear();
    this.catDeleteMap.clear();
    this.hasCategoryChanges = false;

    // Reset transactions to original state by reloading
    this.loadTransactions();
  }

  // Save all category changes
  saveAllCategoryChanges() {
    if (!this.hasCategoryChanges) return;

    this.isSaving = true;

    // Create list of all changes
    const allChanges: TransactionUserCategory[] = [];

    // Add all inserts
    this.catInsertMap.forEach((items) => {
      allChanges.push(...items);
    });

    // Add all deletes
    this.catDeleteMap.forEach((items) => {
      allChanges.push(...items);
    });

    // Call the API
    this.categoryService.editTransactionCategories(allChanges).subscribe(
      () => {
        this.toastService.showSuccess("Categories updated successfully");
        this.catInsertMap.clear();
        this.catDeleteMap.clear();
        this.hasCategoryChanges = false;
        this.isSaving = false;

        // Reload transactions to get fresh data
        this.loadTransactions();
      },
      (error) => {
        console.error("Error updating categories:", error);
        this.toastService.showError("Failed to update categories");
        this.isSaving = false;
      }
    );
  }

  // Check if transaction has category changes
  hasTransactionCategoryChanges(transaction: Transaction): boolean {
    const transactionId = transaction.transaction_id;
    return (
      this.catInsertMap.has(transactionId) ||
      this.catDeleteMap.has(transactionId)
    );
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
    // First, create a "working copy" of the transaction's categories
    // by applying pending changes
    let effectiveCategories = new Set(transaction.user_category_ids || []);

    // Apply inserts
    const inserts = this.catInsertMap.get(transaction.transaction_id) || [];
    inserts.forEach((item) => effectiveCategories.add(item.user_category_id));

    // Apply deletes
    const deletes = this.catDeleteMap.get(transaction.transaction_id) || [];
    deletes.forEach((item) =>
      effectiveCategories.delete(item.user_category_id)
    );

    // Get titles
    return Array.from(effectiveCategories)
      .map((id) => this.categoryMap.get(id)?.category_title || "")
      .filter((title) => title !== "");
  }

  private loadTransactions() {
    if (this.selectedAccountIds.length > 0 && this.startDate && this.endDate) {
      this.isLoading = true;
      this.noAccountsSelected = false;

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
            this.filteredTransactions = [...this.transactions]; // Initialize filtered transactions
            this.isLoading = false;
          },
          (error) => {
            console.error("Error fetching transactions:", error);
            this.isLoading = false;
          }
        );
    } else if (this.selectedAccountIds.length === 0) {
      // Set noAccountsSelected flag if no accounts are selected
      this.noAccountsSelected = true;
      this.clearTransactions();
    }
  }

  // Check if a transaction is a debit (expense)
  isDebit(transaction: Transaction): boolean {
    return transaction.is_debit_or_credit === "DR";
  }

  // Get all transactions
  getTransactions(): Transaction[] {
    return this.filteredTransactions;
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
    this.filteredTransactions = [];
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
