
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Component, EventEmitter, OnInit, Output } from "@angular/core";
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
  IonSelect,
  IonSelectOption,
  IonModal,
  IonCheckbox,
  IonToggle,
  IonRow,
  IonCol,
  IonBadge,
  IonPopover,
  IonSearchbar,
  IonRadioGroup,
  IonRadio,
  IonFooter,
  AlertController,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
  refreshOutline,
  addCircleOutline,
  arrowBackOutline,
  arrowUndoOutline,
  walletOutline,
  pricetagsOutline,
  checkmarkOutline,
  closeOutline,
  closeCircleOutline,
  searchOutline,
  saveOutline,
  addOutline,
  ellipsisVerticalOutline,
  alertCircleOutline,
  optionsOutline,
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
import { TransactionFilters } from "../shared/transaction-filter/transaction-filter.component";

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
    IonButtons,
    IonButton,
    IonSelect,
    IonSelectOption,
    IonModal,
    IonCheckbox,
    IonToggle,
    IonRow,
    IonCol,
    IonBadge,
    IonPopover,
    IonSearchbar,
    IonRadioGroup,
    IonRadio,
    IonFooter,
  ],
})
export class TransactionListComponent implements OnInit {
  // Filter button (JIRA_17) - the button lives here, in the search row,
  // but the filter controls/modal it opens live in TransactionFilterComponent
  // (extracted from this page's original transaction-search under JIRA_23 so
  // the Graphs page can reuse it too). TransactionsPageComponent forwards
  // this to TransactionFilterComponent's openFilterModal(), the
  // reverse-direction counterpart of that component's
  // filtersApplied -> this.applyFilters() wiring.
  @Output() openFilters = new EventEmitter<void>();

  onFilterButtonClick() {
    this.openFilters.emit();
  }

  // Active-filter dot on the filter button. Deliberately excludes
  // selectedAccountIds (some account is always required just to see any
  // transactions, so treating "an account is picked" as "filtering" would
  // light the dot almost permanently) and the date range (no cheap way to
  // tell "still the default FY range" from "the user picked the same dates
  // on purpose") - see ux/UX_transaction-search.md's Round 2 addendum.
  get hasActiveFilters(): boolean {
    return this.selectedCategoryIds.length > 0 || this.debitCreditIndicator !== null;
  }

  // For Add Category modal search and select/clear all
  addCategorySearchTerm: string = '';
  filteredAddUserCategories: UserCategory[] = [];

  filterAddCategories() {
    const term = this.addCategorySearchTerm.toLowerCase();
    this.filteredAddUserCategories = this.userCategories.filter(cat =>
      cat.category_title.toLowerCase().includes(term)
    );
  }

  clearAllAddCategories() {
    if (this.selectedTransaction) {
      this.selectedCategories = [];
    } else {
      this.batchAddCategories = [];
    }
  }

  selectAllAddCategories() {
    const allIds = this.filteredAddUserCategories.map(cat => cat.id);
    if (this.selectedTransaction) {
      // Limit to 5 for single transaction
      this.selectedCategories = allIds.slice(0, 5);
    } else {
      this.batchAddCategories = allIds;
    }
  }

  // For category modal search
  categorySearchTerm: string = '';
  filteredUserCategories: UserCategory[] = [];

  /**
   * Marks the selected batch category for deletion on all searched transactions,
   * using the same logic as the cross button (removeCategory).
   */
  deleteCategoryAllSearched() {
    const categoryTitle = this.batchCategoryInput?.trim();
    if (!categoryTitle) return;
    // Find categoryId by title
    let categoryId: number | undefined;
    for (const [id, cat] of this.categoryMap.entries()) {
      if (cat.category_title === categoryTitle) {
        categoryId = id;
        break;
      }
    }
    if (categoryId === undefined) {
      this.toastService.showError('Category not found');
      return;
    }
    // Use removeCategory logic for each filtered transaction
    this.filteredTransactions.forEach((transaction) => {
      // Defensive: user_category_ids may be null or not a Set
      let userCategoryIds: Set<number> = new Set();
      if (transaction.user_category_ids) {
        if (transaction.user_category_ids instanceof Set) {
          userCategoryIds = transaction.user_category_ids;
        } else if (Array.isArray(transaction.user_category_ids)) {
          userCategoryIds = new Set(transaction.user_category_ids);
        }
      }
      if (userCategoryIds.has(categoryId!)) {
        // Simulate the removeCategory logic (without needing an event)
        const transactionId = transaction.transaction_id;
        const deleteItem = {
          transaction_id: transactionId,
          user_category_id: categoryId!,
          action: TransactionUserCategoryAction.DELETE,
        };
        let currentDeletes = this.catDeleteMap.get(transactionId) || [];
        currentDeletes = [...currentDeletes, deleteItem];
        this.catDeleteMap.set(transactionId, currentDeletes);

        // Remove from insert map if present
        let currentInserts = this.catInsertMap.get(transactionId) || [];
        const insertIndex = currentInserts.findIndex(
          (item) =>
            item.user_category_id === categoryId &&
            item.action === TransactionUserCategoryAction.INSERT
        );
        if (insertIndex !== -1) {
          currentInserts.splice(insertIndex, 1);
          if (currentInserts.length === 0) {
            this.catInsertMap.delete(transactionId);
          } else {
            this.catInsertMap.set(transactionId, currentInserts);
          }
        }
        // Update the transaction in the view
        this.updateTransactionCategories(transaction);
      }
    });
    this.checkCategoryChanges();
  }

  batchCategoryInput: string = "";

  /**
   * Applies the batchCategoryInput to all currently displayed (not-yet-saved) transactions.
   */
  categorizeAllSearched() {
    const categoryTitle = this.batchCategoryInput?.trim();
    if (!categoryTitle) return;
    // Find categoryId by title
    let categoryId: number | undefined;
    for (const [id, cat] of this.categoryMap.entries()) {
      if (cat.category_title === categoryTitle) {
        categoryId = id;
        break;
      }
    }
    if (categoryId === undefined) {
      this.toastService.showError('Category not found');
      return;
    }
    // Use the same logic as Add Category (batch add mode)
    this.batchAddCategories = [categoryId];
    this.selectedTransaction = null;
    this.saveSelectedCategories();
  }

  /**
   * Clears the batch category input and removes the category from all unsaved transactions.
   */
  clearAllBatchCategories() {
    const categoryTitle = this.batchCategoryInput?.trim();
    if (!categoryTitle) return;
    // Find categoryId by title
    let categoryId: number | undefined;
    for (const [id, cat] of this.categoryMap.entries()) {
      if (cat.category_title === categoryTitle) {
        categoryId = id;
        break;
      }
    }
    if (categoryId === undefined) {
      this.toastService.showError('Category not found');
      return;
    }
    for (const tx of this.getTransactions()) {
      if (tx.user_category_ids) {
        tx.user_category_ids.delete(categoryId);
      }
    }
    this.batchCategoryInput = "";
  }

  selectedAccountIds: number[] = [];
  isAddCategoryModalOpen: boolean = false;
  accountMap: Map<number, UserAccount> = new Map();
  groupedAccounts: GroupedUserAccount[] = [];

  // Transaction search (client-side narrowing of already-fetched rows -
  // stays here, not in transaction-search, since it needs live visual
  // feedback against visible rows; see JIRA_14's Implementation notes)
  searchTerm: string = "";
  filteredTransactions: Transaction[] = [];
  regexSearch: boolean = false;

  // Query-defining filters (date range, accounts, categories, DR/CR) -
  // held here (needed for loadTransactions()'s API call and for
  // getTransactions()'s local filtering) but edited on transaction-search;
  // see applyFilters() below for how they arrive.
  startDate: string = "";
  endDate: string = "";
  userCategories: UserCategory[] = [];
  selectedCategoryIds: number[] = [];
  categoryMap: Map<number, UserCategory> = new Map();
  debitCreditIndicator: 'DR' | 'CR' | null = null;

  // New properties for category management
  selectedTransaction: Transaction | null = null;
  selectedCategories: number[] = [];
  catInsertMap: Map<string, TransactionUserCategory[]> = new Map();
  catDeleteMap: Map<string, TransactionUserCategory[]> = new Map();
  hasCategoryChanges: boolean = false;
  batchAddCategories: number[] = [];

  private transactions: Transaction[] = [];
  isLoading: boolean = false;
  isSaving: boolean = false;
  hasError: boolean = false;

  openingBalance?: number;
  totalDebit?: number;
  totalCredit?: number;
  closingBalance?: number;

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
      arrowUndoOutline,
      walletOutline,
      pricetagsOutline,
      checkmarkOutline,
      closeOutline,
      closeCircleOutline,
      searchOutline,
      saveOutline,
      addOutline,
      ellipsisVerticalOutline,
      alertCircleOutline,
      optionsOutline,
    });
  }

  get noAccountsSelected(): boolean {
    return this.selectedAccountIds.length === 0;
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
        this.filteredAddUserCategories = this.userCategories.slice();
      }
    );

    // Subscribe to query params (still supports ?userAccountId=<id>, the
    // same query param account-list's drill-in navigates with)
    this.route.queryParams.subscribe((params) => {
      let userAccountId = Number(params["userAccountId"]);

      // If no account ID in params, use first available account
      if (!userAccountId || isNaN(userAccountId)) {
        userAccountId = this.userAccountService.getFirstAccountId() || 0;
      }

      if (userAccountId) {
        this.selectedAccountIds = [userAccountId];
        this.loadTransactions();
      }

      // Only override default dates if provided in params
      if (params["startDate"]) {
        this.startDate = params["startDate"];
      }
      if (params["endDate"]) {
        this.endDate = params["endDate"];
      }
    });
  }

  // Called directly by TransactionsPageComponent's template (via a #list
  // reference) whenever transaction-search emits a filter change - see
  // jira/JIRA_14.md's addendum for why this replaced the router-outlet/
  // (activate) wiring the two components originally needed when they lived
  // on separate routes.
  applyFilters(filters: TransactionFilters) {
    this.selectedAccountIds = [...filters.selectedAccountIds];
    this.startDate = filters.startDate;
    this.endDate = filters.endDate;
    this.selectedCategoryIds = [...filters.selectedCategoryIds];
    this.debitCreditIndicator = filters.debitCreditIndicator;
    this.resetCategoryChanges();
  }

  // Search transactions
  onSearchChange(event: any) {
    this.searchTerm = event.detail.value || "";
    this.applyFilter();
  }

  // Replaces ion-searchbar's built-in cancel button (JIRA_16 - see
  // transaction-list.component.html's search-row comment for why).
  clearSearch() {
    this.searchTerm = "";
    this.applyFilter();
  }

  applyFilter() {
    // Handle Uncategorized filter
    const uncategorizedSelected = this.selectedCategoryIds?.includes(-1);
    let filtered = [...this.transactions];

    if (uncategorizedSelected) {
      filtered = filtered.filter((tx) => {
        if (!tx.user_category_ids) return true;
        if (tx.user_category_ids instanceof Set) return tx.user_category_ids.size === 0;
        if (Array.isArray(tx.user_category_ids)) return (tx.user_category_ids as number[]).length === 0;
        return false;
      });
    } else if (this.selectedCategoryIds && this.selectedCategoryIds.length > 0) {
      filtered = filtered.filter((tx) => {
        if (!tx.user_category_ids) return false;
        let ids: number[] = Array.isArray(tx.user_category_ids)
          ? tx.user_category_ids
          : Array.from(tx.user_category_ids);
        return ids.some((id) => this.selectedCategoryIds.includes(id));
      });
    }

    // Search filter (regex or normal)
    if (this.searchTerm) {
      if (this.regexSearch) {
        let regex: RegExp | null = null;
        try {
          regex = new RegExp(this.searchTerm, 'i');
        } catch (e) {
          this.filteredTransactions = [];
          return;
        }
        filtered = filtered.filter((transaction) =>
          regex!.test(transaction.title) ||
          regex!.test(this.accountMap.get(transaction.user_account_id)?.user_account_name || '') ||
          this.getUserCategoryTitles(transaction).some((title) => regex!.test(title))
        );
      } else {
        const searchLower = this.searchTerm.toLowerCase();
        filtered = filtered.filter(
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
    this.filteredTransactions = filtered;
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

      this.transactionService
        .fetchAllTransactions(
          this.selectedAccountIds,
          this.startDate,
          this.endDate,
          this.selectedCategoryIds.length > 0 ? this.selectedCategoryIds : null,
          this.debitCreditIndicator
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
            this.hasError = false;
          },
          (error) => {
            console.error("Error fetching transactions:", error);
            this.isLoading = false;
            this.hasError = true;
          }
        );
    } else if (this.selectedAccountIds.length === 0) {
      this.clearTransactions();
    }
  }

  // Retry after a failed load (Calm Ledger error state) - unlike
  // account-list's UserAccountService, TransactionService.fetchAllTransactions
  // returns the raw HTTP observable with no internal error-swallowing, so
  // this error path is genuinely reachable, not just defensive.
  retryLoadTransactions() {
    this.hasError = false;
    this.loadTransactions();
  }

  // Account name for a transaction row (Calm Ledger - shown as a muted tag
  // under the title instead of a "(Account)" prefix on the title itself).
  getTransactionAccountName(transaction: Transaction): string {
    return this.accountMap.get(transaction.user_account_id)?.user_account_name || "";
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
        this.accountMap.set(account.user_account_id, account);
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
  }

  navigateToStatementUploader() {
    this.router.navigateByUrl("/tabs/statement-uploader", {
      state: { openUploadModal: true },
    });
  }

  refreshWithAnimation(event: any) {
    const button = event.target.closest("ion-button");
    const icon = button.querySelector("ion-icon") || button; // Fallback if icon not found
    icon.classList.add("refreshing");

    // Refresh accounts, then reload with the currently-applied filters
    this.userAccountService.refreshAccounts();

    setTimeout(() => {
      this.loadTransactions();
      setTimeout(() => {
        icon.classList.remove("refreshing");
      }, 1000);
    }, 300);
  }
}
