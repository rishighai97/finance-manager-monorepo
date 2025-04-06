import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable } from "rxjs";
import { UserCategory } from "../model/user-category";

@Injectable({
  providedIn: "root",
})
export class CategoryService {
  private categoryApiUrl = "http://localhost:5004/category"; // API URL

  // BehaviorSubject to store categories
  private userCategoriesSubject = new BehaviorSubject<UserCategory[]>([]);
  userCategories$ = this.userCategoriesSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Loads all categories for the given user IDs
   */
  loadUserCategories(userIds: number[] = [1]) {
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
    this.fetchAllCategories([1]).subscribe(
      (categories) => {
        this.userCategoriesSubject.next(categories);
      },
      (error) => {
        console.error("Error refreshing categories:", error);
      }
    );
  }
}