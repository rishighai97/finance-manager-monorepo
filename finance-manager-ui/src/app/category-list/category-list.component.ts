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
  IonSpinner,
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
  IonText,
  AlertController,
  ToastController
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
  createOutline,
  trashOutline,
  saveOutline,
  refreshOutline,
  closeCircleOutline,
  checkmarkCircleOutline,
  informationCircleOutline,
  arrowForwardOutline,
  pricetagsOutline,
  listOutline
} from "ionicons/icons";
import { CategoryService } from "src/service/category.service";
import { UserCategory } from "src/model/user-category";
import { ToastService } from "src/service/toast.service";

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
    IonSpinner,
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
    IonText
  ],
})
export class CategoryListComponent implements OnInit {
  categories: UserCategory[] = [];
  filteredCategories: UserCategory[] = [];
  searchTerm: string = "";
  isLoading: boolean = true;
  hasPendingChanges: boolean = false;
  isSaving: boolean = false;
  statusActive: boolean = false;

  constructor(
    private categoryService: CategoryService,
    private toastService: ToastService,
    private alertController: AlertController
  ) {
    addIcons({
      createOutline,
      trashOutline,
      saveOutline,
      refreshOutline,
      closeCircleOutline,
      checkmarkCircleOutline,
      informationCircleOutline,
      arrowForwardOutline,
      pricetagsOutline,
      listOutline
    });
  }

  ngOnInit() {
    // Subscribe to category updates
    this.categoryService.userCategories$.subscribe((categories) => {
      this.categories = [...categories];
      this.applyFilter();
      this.sortCategories();
      this.isLoading = false;
      this.checkPendingChanges();
    });

    // Load categories on init
    this.categoryService.loadUserCategories();
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
   * Toggle active status for styling
   */
  toggleStatusActive() {
    this.statusActive = !this.statusActive;
  }
}