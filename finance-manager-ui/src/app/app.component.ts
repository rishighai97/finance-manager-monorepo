import { Component } from "@angular/core";
import { IonApp, IonRouterOutlet } from "@ionic/angular/standalone";
import { UserAccountService } from "src/service/user.account.service";
import { AccountService } from "src/service/account.service";
import { CategoryService } from "src/service/category.service";

@Component({
  selector: "app-root",
  templateUrl: "app.component.html",
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(
    private userAccountService: UserAccountService,
    private accountService: AccountService,
    private categoryService: CategoryService
  ) {
    this.userAccountService.loadGroupedUserAccounts();
    this.accountService.loadGroupedAccounts();
    this.categoryService.loadUserCategories();
  }
}