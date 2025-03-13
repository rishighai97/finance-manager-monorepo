import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonList,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonTabButton,
  IonCard,
  IonCardHeader,
  IonAvatar,
  IonCardContent,
  IonChip,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { triangle, ellipse, square, walletOutline } from "ionicons/icons";
import { UserAccount } from "src/model/user-account";
import { AccountService } from "src/service/account.service";

@Component({
  selector: "app-account-list",
  templateUrl: "./account-list.component.html",
  styleUrls: ["./account-list.component.scss"],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonList,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon,
    IonTabButton,
    IonLabel,
    IonCard,
    IonCardHeader,
    IonAvatar,
    IonCardContent,
    IonChip,
    CommonModule,
  ],
})
export class AccountListComponent implements OnInit {
  private userAccounts: UserAccount[] = [];

  constructor(private accountService: AccountService) {
    console.log("account list component constructor called");
    addIcons({ walletOutline });
  }

  ngOnInit() {
    console.log("account list component ngOnInit called");
    // Fetch the user accounts from the service
    this.accountService.fetchUserAccounts([1]).subscribe(
      (accounts) => {
        this.userAccounts = accounts; // Store the fetched accounts in the array
        console.log(`Fetched ${this.userAccounts.length} user accounts`);
        this.userAccounts.forEach((acct) => {
          acct.icon = `data:image/png;base64,${acct.icon}`;
        });
      },
      (error) => {
        console.error("Error fetching user accounts:", error);
      }
    );
  }

  getUserAccounts(): UserAccount[] {
    return this.userAccounts;
  }
}
