import { Component, OnInit } from "@angular/core";
import { IonApp, IonRouterOutlet } from "@ionic/angular/standalone";
import { UserAccountService } from "src/service/user.account.service";
import { AccountService } from "src/service/account.service";
import { CategoryService } from "src/service/category.service";
import { UserService } from "src/service/user.service";
import { environment } from "src/environments/environment";
import { Router, NavigationEnd } from "@angular/router";
import { filter } from "rxjs/operators";

@Component({
  selector: "app-root",
  templateUrl: "app.component.html",
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  currentEnvironment: string = environment.name;

  constructor(
    private userAccountService: UserAccountService,
    private accountService: AccountService,
    private categoryService: CategoryService,
    private userService: UserService,
    private router: Router
  ) {
    console.log(`App started in ${this.currentEnvironment} environment`);
  }

  ngOnInit() {
    // Listen for authentication state changes
    this.userService.isAuthenticated$.subscribe((isAuthenticated) => {
      if (isAuthenticated) {
        this.loadUserData();
      }
    });

    // Listen for route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        // Redirect to auth if not authenticated (except for the auth page itself)
        if (!this.userService.isAuthenticated && 
            !event.url.includes('/auth')) {
          this.router.navigate(['/auth']);
        }
      });

    // Check if user is already authenticated
    if (this.userService.isAuthenticated) {
      this.loadUserData();
    } else {
      // Navigate to auth unless already there
      if (!this.router.url.includes('/auth')) {
        this.router.navigate(['/auth']);
      }
    }
  }

  /**
   * Load all user-specific data
   */
  private loadUserData() {
    // Get the current user ID
    const userId = this.userService.currentUserId;
    console.log(`Loading data for user ID: ${userId}`);

    // Load user-specific data
    this.userAccountService.loadGroupedUserAccounts();
    this.accountService.loadGroupedAccounts();
    this.categoryService.loadUserCategories([userId]);
  }
}