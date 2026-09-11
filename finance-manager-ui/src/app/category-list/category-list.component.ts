
import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonList,
  IonSearchbar,
  IonButton,
  IonIcon,
  IonChip,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonButtons,
  IonBadge,
  IonAlert,
  IonCard,
  IonCardContent,
  IonToggle,
  IonInput,
  AlertController,
  ToastController,
  IonFab,
  IonFabButton,
  IonModal
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
  refreshOutline,
  arrowForwardOutline,
  pricetagsOutline,
  addOutline,
  arrowBackOutline,
  alertCircle,
  alertCircleOutline
} from "ionicons/icons";
import { CategoryService } from "src/service/category.service";
import { UserCategory } from "src/model/user-category";
import { ToastService } from "src/service/toast.service";
import { UserService } from "src/service/user.service";

@Component({
  selector: "app-category-list",
  templateUrl: "./category-list.component.html",
  styleUrls: ["./category-list.component.scss"],
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
    IonSearchbar,
    IonButton,
    IonIcon,
    IonChip,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonButtons,
    IonBadge,
    IonAlert,
    IonCard,
    IonCardContent,
    IonToggle,
    IonInput,
    IonFab,
    IonFabButton,
    IonModal
  ],
})
export class CategoryListComponent implements OnInit {
  categories: UserCategory[] = [];
  filteredCategories: UserCategory[] = [];
  searchTerm: string = "";
  isLoading: boolean = true;
  hasError: boolean = false;
  hasPendingChanges: boolean = false;
  isSaving: boolean = false;
  
  // Properties for Add Category Modal
  isAddCategoryModalOpen: boolean = false;
  newCategoryName: string = "";

  constructor(
    private categoryService: CategoryService,
    private toastService: ToastService,
    private alertController: AlertController,
    private userService: UserService
  ) {
    addIcons({
      refreshOutline,
      arrowForwardOutline,
      pricetagsOutline,
      addOutline,
      arrowBackOutline,
      alertCircle,
      alertCircleOutline
    });
  }

  ngOnInit() {
    // Subscribe to category updates. Error callback added for the Calm
    // Ledger error state - currently unreachable in practice, since
    // CategoryService.loadUserCategories()/refreshCategories() swallow
    // their own HTTP errors (console.error only) before they ever reach
    // this BehaviorSubject; see ux/UX_category-list.md's Implementation
    // notes (same gap as account-list's UserAccountService).
    this.categoryService.userCategories$.subscribe({
      next: (categories) => {
        this.categories = [...categories];
        this.applyFilter();
        this.sortCategories();
        this.isLoading = false;
        this.hasError = false;
        this.checkPendingChanges();
      },
      error: () => {
        this.isLoading = false;
        this.hasError = true;
      },
    });

    // Load categories on init
    this.categoryService.loadUserCategories();
  }

  /**
   * Retry after a failed load (Calm Ledger error state)
   */
  retryLoadCategories() {
    this.hasError = false;
    this.refreshCategories();
  }

  /**
   * Filter categories based on search term
   */
  applyFilter() {
    if (!this.searchTerm) {
      this.filteredCategories = [...this.categories];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredCategories = this.categories.filter(
        (category) => category.category_title.toLowerCase().includes(searchLower)
      );
    }
    this.sortCategories();
  }

  /**
   * Sort categories by deletion status, edit status, and then title
   */
  sortCategories() {
    this.filteredCategories.sort((a, b) => {
      // First sort by deletion status (deleted first)
      if (a.delete && !b.delete) return -1;
      if (!a.delete && b.delete) return 1;
      
      // Then sort by edit status (edited next)
      if (a.new_title && !b.new_title) return -1;
      if (!a.new_title && b.new_title) return 1;
      
      // Finally sort by title alphabetically
      return a.category_title.localeCompare(b.category_title);
    });
  }

  /**
   * Handle search input changes in real-time (typeahead)
   */
  onSearchChange(event: any) {
    this.searchTerm = event.detail.value || '';
    this.applyFilter();
  }

  /**
   * Mark a category for renaming
   */
  renameCategory(category: UserCategory) {
    this.promptForNewTitle(category);
  }

  /**
   * Toggle deletion status of a category
   */
  toggleDelete(category: UserCategory) {
    category.delete = !category.delete;
    // If marked for deletion, remove any pending rename
    if (category.delete) {
      category.new_title = undefined;
    }
    this.checkPendingChanges();
    this.sortCategories();
  }

  /**
   * Cancel a pending rename
   */
  cancelRename(category: UserCategory) {
    category.new_title = undefined;
    this.checkPendingChanges();
    this.sortCategories();
  }

  /**
   * Check if there are any pending changes
   */
  checkPendingChanges() {
    this.hasPendingChanges = this.categories.some(
      (category) => category.delete || category.new_title
    );
  }

  /**
   * Save all pending changes
   */
  saveChanges() {
    this.isSaving = true;
    this.categoryService.applyPendingChanges().subscribe(
      () => {
        this.toastService.showSuccess("Categories updated successfully");
        this.isSaving = false;
      },
      (error) => {
        this.toastService.showError("Failed to update categories");
        console.error("Error saving category changes:", error);
        this.isSaving = false;
      }
    );
  }

  /**
   * Prompt for a new category title
   */
  async promptForNewTitle(category: UserCategory) {
    const alert = await this.alertController.create({
      header: 'Rename Category',
      inputs: [
        {
          name: 'newTitle',
          type: 'text',
          value: category.category_title,
          placeholder: 'Enter new category name'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Rename',
          handler: (data) => {
            if (data.newTitle && data.newTitle.trim() !== category.category_title) {
              category.new_title = data.newTitle.trim();
              this.checkPendingChanges();
              this.sortCategories();
            }
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Reset all pending changes
   */
  resetChanges() {
    this.categories.forEach(category => {
      category.delete = false;
      category.new_title = undefined;
    });
    this.checkPendingChanges();
    this.sortCategories();
  }

  /**
   * Refresh categories from server
   */
  refreshCategories() {
    this.isLoading = true;
    this.categoryService.refreshCategories();
  }

  /**
   * Open the modal to add a new category
   */
  openAddCategoryModal() {
    this.isAddCategoryModalOpen = true;
    this.newCategoryName = '';
  }
  
  /**
   * Close the add category modal
   */
  closeAddCategoryModal() {
    this.isAddCategoryModalOpen = false;
  }
  
  /**
   * Save a new category
   */
  saveNewCategory() {
    if (!this.newCategoryName.trim()) {
      this.toastService.showError("Please enter a valid category name");
      return;
    }
    
    if (this.newCategoryName.length > 50) {
      this.toastService.showError("Category name cannot exceed 50 characters");
      return;
    }
    
    const newCategory: UserCategory = {
      id: 0, // Will be ignored by the API
      user_id: this.userService.currentUserId, // Assuming user ID 1 as in other services
      category_title: this.newCategoryName.trim()
    };
    
    this.categoryService.addNewCategory(newCategory).subscribe(
      () => {
        this.toastService.showSuccess("New category added successfully");
        this.closeAddCategoryModal();
        this.refreshCategories();
      },
      (error) => {
        this.toastService.showError("Failed to add new category");
        console.error("Error adding new category:", error);
      }
    );
  }
  
  refreshWithAnimation(event: any) {
    const button = event.target.closest('ion-button');
    const icon = button.querySelector('ion-icon') || button; // Fallback if icon not found
    icon.classList.add('refreshing');
    
    // Call the actual refresh method
    this.refreshCategories();
    
    // Remove the animation class after animation completes
    setTimeout(() => {
      icon.classList.remove('refreshing');
    }, 1000);
  }
}
