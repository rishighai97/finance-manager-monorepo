
import { Component } from "@angular/core";
import { IonApp, IonRouterOutlet } from "@ionic/angular/standalone";
import { UserAccountService } from "src/service/user.account.service";
import { AccountService } from "src/service/account.service";
import { CategoryService } from "src/service/category.service";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-root",
  templateUrl: "app.component.html",
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  currentEnvironment: string = environment.name;

  constructor(
    private userAccountService: UserAccountService,
    private accountService: AccountService,
    private categoryService: CategoryService
  ) {
    console.log(`App started in ${this.currentEnvironment} environment`);

    this.userAccountService.loadGroupedUserAccounts();
    this.accountService.loadGroupedAccounts();
    this.categoryService.loadUserCategories();
  }
}
