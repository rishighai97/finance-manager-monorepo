import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs';
import { User } from '../model/user';
import { environment } from '../environments/environment';

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  userId: number;
  username: string;
}

interface SignupRequest {
  username: string;
  password: string;
}

interface LoginRequest {
  username: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private authApiUrl = `${environment.apiEndpoints.gatewayService}/auth`; // API URL for auth endpoints
  
  // BehaviorSubject to store the current user
  private currentUser = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUser.asObservable();
  
  // BehaviorSubject to store authentication state
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  
  // Store the current user ID separately for easier access
  private userIdSubject = new BehaviorSubject<number>(0); // Default to 0 (not authenticated)
  userId$ = this.userIdSubject.asObservable();

  // Store the access token
  private accessToken: string | null = null;

  constructor(private http: HttpClient) {
    // Initialize user from localStorage if available
    this.loadUserFromStorage();
  }

  get currentUserSubject(): BehaviorSubject<User | null> {
    return this.currentUser;
  }


  /**
   * Gets the current user ID
   * @returns The current user ID
   */
  get currentUserId(): number {
    return this.userIdSubject.value;
  }

  /**
   * Checks if the user is authenticated
   * @returns True if authenticated, false otherwise
   */
  get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Gets the current access token for API requests
   * @returns The access token or null
   */
  get token(): string | null {
    return this.accessToken;
  }

  /**
   * Sign up a new user
   * @param username Username
   * @param password Password
   * @returns Observable of success status
   */
  signup(
    username: string,
    password: string,
 
  ): Observable<boolean> {
    const request: SignupRequest = {
      username,
      password,
    };

    return this.http.post<User>(`${this.authApiUrl}/signup`, request).pipe(
      map(user => !!user),
      catchError(this.handleError)
    );
  }

  /**
   * Log in a user
   * @param username Username
   * @param password Password
   * @returns Observable of success status
   */
  login(username: string, password: string): Observable<boolean> {
    const request: LoginRequest = { username, password };

    return this.http.post<AuthResponse>(`${this.authApiUrl}/login`, request).pipe(
      tap(response => this.handleAuthentication(response)),
      map((response) => true),
      catchError(this.handleError)
    );
  }

  /**
   * Logout the current user
   */
  logout(): Observable<boolean> {
    // Clear localStorage
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
    
    // Reset service state
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.userIdSubject.next(0);
    this.accessToken = null;
    
    // Call logout API (if token exists)
    
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.accessToken}`);
    return this.http.post<void>(`${this.authApiUrl}/logout`, {}, { headers }).pipe(
      map(() => true),
      catchError(() => of(true)) // Always consider logout successful
    );
    
    
    return of(true);
  }

  /**
   * Get an array with the current user ID
   * @returns An array containing the current user ID
   */
  getCurrentUserIdArray(): number[] {
    return [this.currentUserId];
  }

  /**
   * Refreshes the current user
   */
  refreshCurrentUser(): void {
    if (this.currentUserId > 0 && this.accessToken) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${this.accessToken}`);
      this.http.get<User>(`${this.authApiUrl}/userinfo`, { headers }).subscribe(
        (user) => {
          this.currentUserSubject.next(user);
        },
        () => {
          // If refresh fails, log out
          this.logout();
        }
      );
    }
  }

  /**
   * Get authentication headers for API requests
   * @returns HttpHeaders with Authorization token
   */
  getAuthHeaders(): HttpHeaders {
    return new HttpHeaders().set('Authorization', `Bearer ${this.accessToken}`);
  }

  // Private methods
  private handleAuthentication(response: AuthResponse): void {
    this.accessToken = response.accessToken;
    
    // Create user object
    const user: User = {
      id: response.userId,
      username: response.username,
      isActive: true,
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Update state
    this.currentUserSubject.next(user);
    this.userIdSubject.next(user.id);
    this.isAuthenticatedSubject.next(true);
    // Save to localStorage
    localStorage.setItem('userData', JSON.stringify(user));
    localStorage.setItem('token', response.accessToken);

  }

  private loadUserFromStorage(): void {
    const storedUser = localStorage.getItem('userData');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      const user = JSON.parse(storedUser) as User;
      this.currentUserSubject.next(user);
      this.userIdSubject.next(user.id);
      this.isAuthenticatedSubject.next(true);
      this.accessToken = storedToken;
    }
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    console.log(error);
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else if (error.error && typeof error.error === 'object' && 'errorDescription' in error.error) {
      // Server-side error with errorDescription
      errorMessage = error.error.errorDescription;
    } else if (error.status) {
      // Server-side error with status code
      switch (error.status) {
        case 400:
          errorMessage = 'No account found for this username'
          break;
        case 401:
          errorMessage = 'Unauthorized. Please valdiate username / password.';
          break;
        case 403:
          errorMessage = 'Access denied.';
          break;
        case 404:
          errorMessage = 'Requested resource not found.';
          break;
        case 409:
          errorMessage = 'Username already taken'
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = `Server error: ${error.status}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }
}