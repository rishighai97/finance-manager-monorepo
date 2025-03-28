import { Component } from "@angular/core";
import { IonApp, IonRouterOutlet } from "@ionic/angular/standalone";
import { UserAccountService } from "src/service/user.account.service";

@Component({
  selector: "app-root",
  templateUrl: "app.component.html",
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(private userAccountService: UserAccountService) {
    this.userAccountService.loadGroupedUserAccounts();
  }
}
