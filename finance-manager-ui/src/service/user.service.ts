import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { User } from '../model/user';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private userApiUrl = `${environment.apiEndpoints.accountService}/user`; // API URL when backend is ready
  
  // BehaviorSubject to store the current user
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();
  
  // Store the current user ID separately for easier access
  private userIdSubject = new BehaviorSubject<number>(2); // Default to user ID 2 for now
  userId$ = this.userIdSubject.asObservable();

  constructor(private http: HttpClient) {
    // Initialize user from localStorage if available
    this.loadUserFromStorage();
  }

  /**
   * Gets the current user ID
   * @returns The current user ID
   */
  get currentUserId(): number {
    console.log("user id", this.userIdSubject.value)
    return this.userIdSubject.value;
  }

  /**
   * Sets the current user ID and updates the user
   * @param userId The user ID to set
   */
  setCurrentUserId(userId: number): void {
    this.userIdSubject.next(userId);
    this.loadUser(userId);
    localStorage.setItem('userId', userId.toString());
  }

  /**
   * Loads the user from localStorage if available
   */
  private loadUserFromStorage(): void {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      const userId = parseInt(storedUserId, 10);
      this.userIdSubject.next(userId);
      this.loadUser(userId);
    } else {
      // If no user in storage, use default (2 for now)
      this.loadUser(this.userIdSubject.value);
    }
  }

  /**
   * Loads a user by ID
   * @param userId The user ID to load
   */
  loadUser(userId: number): void {
    // When the backend API is ready, uncomment this
    // this.fetchUserById(userId).subscribe(
    //   (user) => {
    //     this.currentUserSubject.next(user);
    //   },
    //   (error) => {
    //     console.error('Error fetching user:', error);
    //     this.currentUserSubject.next(null);
    //   }
    // );

    // For now, create a dummy user
    const dummyUser: User = {
      id: userId,
      username: `user${userId}`,
      email: `user${userId}@example.com`,
      firstName: 'Demo',
      lastName: 'User',
      isActive: true,
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.currentUserSubject.next(dummyUser);
  }

  /**
   * Fetches a user by ID from the API
   * @param userId The user ID to fetch
   * @returns An observable of the User
   */
  fetchUserById(userId: number): Observable<User> {
    const url = `${this.userApiUrl}/v1/${userId}`;
    return this.http.get<User>(url);
  }

  /**
   * Gets an array with the current user ID
   * @returns An array containing the current user ID
   */
  getCurrentUserIdArray(): number[] {
    return [this.currentUserId];
  }

  /**
   * Logs out the current user
   */
  logout(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem('userId');
    // Default back to user ID 2
    this.userIdSubject.next(1);
  }

  /**
   * Refreshes the current user
   */
  refreshCurrentUser(): void {
    this.loadUser(this.currentUserId);
  }
}