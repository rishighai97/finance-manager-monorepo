import { Component } from "@angular/core";
import { IonApp, IonRouterOutlet } from "@ionic/angular/standalone";
import { UserAccountService } from "src/service/user.account.service";
import { AccountService } from "src/service/account.service";

@Component({
  selector: "app-root",
  templateUrl: "app.component.html",
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(
    private userAccountService: UserAccountService,
    private accountService: AccountService
  ) {
    this.userAccountService.loadGroupedUserAccounts();
    this.accountService.loadGroupedAccounts();
  }
}