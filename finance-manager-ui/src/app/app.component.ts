import { Component } from "@angular/core";
import { IonApp, IonRouterOutlet } from "@ionic/angular/standalone";
import { UserAccountService } from "src/service/user.account.service";
import { AccountService } from "src/service/account.service";
import { CategoryService } from "src/service/category.service";
import { UserService } from "src/service/user.service";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-root",
  templateUrl: "app.component.html",
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  currentEnvironment: string = environment.name;

  constructor(
    private userAccountService: UserAccountService,
    private accountService: AccountService,
    private categoryService: CategoryService,
    private userService: UserService
  ) {
    console.log(`App started in ${this.currentEnvironment} environment`);

    // Initialize the user service first
    const userId = this.userService.currentUserId;
    console.log(`Current user ID: ${userId}`);

    // Now load user-specific data with user ID
    this.userAccountService.loadGroupedUserAccounts();
    this.accountService.loadGroupedAccounts();
    this.categoryService.loadUserCategories([userId]);
  }
}