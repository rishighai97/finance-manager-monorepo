import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable } from "rxjs";
import { UserCategory } from "../model/user-category";
import { TransactionUserCategory } from "../model/transaction-user-category";
import { environment } from "../environments/environment";
import { UserService } from "./user.service";

@Injectable({
  providedIn: "root",
})
export class CategoryService {
  private categoryApiUrl = `${environment.apiEndpoints.transactionService}/category`; // API URL

  // BehaviorSubject to store categories
  private userCategoriesSubject = new BehaviorSubject<UserCategory[]>([]);
  userCategories$ = this.userCategoriesSubject.asObservable();

  constructor(
    private http: HttpClient,
    private userService: UserService
  ) {}

  /**
   * Loads all categories for the given user IDs
   */
  loadUserCategories(userIds?: number[]) {
    // If no userIds provided, use the current user ID
    if (!userIds || userIds.length === 0) {
      userIds = [this.userService.currentUserId];
    }
    
    this.fetchAllCategories(userIds).subscribe(
      (categories) => {
        this.userCategoriesSubject.next(categories);
      },
      (error) => {
        console.error("Error fetching categories:", error);
      }
    );
  }

  /**
   * Fetches all categories for the given user IDs
   * @param userIds List of user IDs
   * @returns Observable of UserCategory[]
   */
  fetchAllCategories(userIds: number[]): Observable<UserCategory[]> {
    const userIdsQuery = userIds.join(",");
    const url = `${this.categoryApiUrl}/v1/fetch_all?user_ids=${userIdsQuery}`;
    console.log(`Fetching categories for users ${userIdsQuery}`);
    return this.http.get<UserCategory[]>(url);
  }

  /**
   * Deletes categories with the given IDs
   * @param categories Categories to delete
   * @returns Observable of void
   */
  deleteCategories(categories: UserCategory[]): Observable<void> {
    const url = `${this.categoryApiUrl}/v1/delete_all`;
    console.log(`Deleting ${categories.length} categories`);
    return this.http.delete<void>(url, { body: categories });
  }

  /**
   * Updates category titles
   * @param categories Categories to update
   * @returns Observable of void
   */
  updateCategories(categories: UserCategory[]): Observable<void> {
    const url = `${this.categoryApiUrl}/v1/edit_all`;
    console.log(`Updating ${categories.length} categories`);
    return this.http.put<void>(url, categories);
  }

  /**
   * Adds a new category
   * @param category The new category to add
   * @returns Observable of void
   */
  addNewCategory(category: UserCategory): Observable<void> {
    // Set the user_id to current user if not already set
    if (!category.user_id) {
      category.user_id = this.userService.currentUserId;
    }
    
    const url = `${this.categoryApiUrl}/v1/save_all`;
    console.log(`Adding new category: ${category.category_title}`);
    return this.http.post<void>(url, [category]);
  }

  /**
   * Edits transaction categories by adding or removing transaction-category links
   * @param mappings List of transaction-category mappings to edit
   * @returns Observable of void
   */
  editTransactionCategories(mappings: TransactionUserCategory[]): Observable<void> {
    const url = `${this.categoryApiUrl}/v1/transaction_user_category/edit_all`;
    console.log(`Editing ${mappings.length} transaction-category mappings`);
    return this.http.put<void>(url, mappings);
  }

  /**
   * Applies pending changes (deletions and updates)
   * @returns Observable indicating operation completion
   */
  applyPendingChanges(): Observable<any> {
    const categories = this.userCategoriesSubject.value;

    // Find categories to delete
    const categoriesToDelete = categories.filter(c => c.delete);

    // Find categories to update
    const categoriesToUpdate = categories.filter(c => c.new_title && !c.delete)
      .map(c => ({
        ...c,
        category_title: c.new_title as string  // Type assertion since we've already filtered for non-null new_title
      }));

    // If nothing to change, return immediately
    if (categoriesToDelete.length === 0 && categoriesToUpdate.length === 0) {
      return new Observable(subscriber => {
        subscriber.next(true);
        subscriber.complete();
      });
    }

    // Create observable for deletions
    const deleteObservable = categoriesToDelete.length > 0 ?
      this.deleteCategories(categoriesToDelete) :
      new Observable(subscriber => {
        subscriber.next(true);
        subscriber.complete();
      });

    // Create observable for updates
    const updateObservable = categoriesToUpdate.length > 0 ?
      this.updateCategories(categoriesToUpdate) :
      new Observable(subscriber => {
        subscriber.next(true);
        subscriber.complete();
      });

    // Combine both operations
    return new Observable(subscriber => {
      deleteObservable.subscribe(
        () => {
          updateObservable.subscribe(
            () => {
              // Refresh categories after changes
              this.loadUserCategories();
              subscriber.next(true);
              subscriber.complete();
            },
            error => {
              console.error('Error updating categories:', error);
              subscriber.error(error);
            }
          );
        },
        error => {
          console.error('Error deleting categories:', error);
          subscriber.error(error);
        }
      );
    });
  }

  /**
   * Refreshes the categories by fetching the latest data
   */
  refreshCategories() {
    this.fetchAllCategories([this.userService.currentUserId]).subscribe(
      (categories) => {
        this.userCategoriesSubject.next(categories);
      },
      (error) => {
        console.error("Error refreshing categories:", error);
      }
    );
  }
}