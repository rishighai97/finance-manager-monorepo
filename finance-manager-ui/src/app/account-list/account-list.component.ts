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
  IonSpinner,
  IonBackButton,
  IonButtons,
  IonButton,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
  walletOutline,
  chevronDownOutline,
  chevronUpOutline,
  arrowBackOutline,
} from "ionicons/icons";
import { UserAccount } from "src/model/user-account";
import { GroupedUserAccount } from "src/model/grouped-user-account";
import { AccountService } from "src/service/account.service";
import { TransactionListComponent } from "../transaction-list/transaction-list.component";

interface Level1Group {
  title: string;
  amount: number;
  isExpanded: boolean;
}

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
    IonSpinner,
    IonBackButton,
    IonButtons,
    IonButton,
    CommonModule,
    TransactionListComponent,
  ],
})
export class AccountListComponent implements OnInit {
  private userAccounts: UserAccount[] = [];
  private groupedAccounts: GroupedUserAccount[] = [];
  private level1Groups: Level1Group[] = [];
  isLoading: boolean = true;
  showTransactions: boolean = false;
  selectedAccountId: number | null = null;
  selectedAccountName: string = "";

  // Financial year dates
  startDate: string = "";
  endDate: string = "";

  constructor(private accountService: AccountService) {
    console.log("account list component constructor called");
    addIcons({
      walletOutline,
      chevronDownOutline,
      chevronUpOutline,
      arrowBackOutline,
    });

    // Set financial year dates
    this.setFinancialYearDates();
  }

  ngOnInit() {
    console.log("account list component ngOnInit called");

    // Fetch the grouped user accounts
    this.accountService.fetchGroupedUserAccounts([1]).subscribe(
      (groupedAccounts) => {
        this.groupedAccounts = groupedAccounts;
        console.log(
          `Fetched ${this.groupedAccounts.length} grouped user accounts`
        );

        // Process user accounts within the grouped accounts
        this.groupedAccounts.forEach((group) => {
          group.user_accounts.forEach((acct) => {
            acct.icon = `data:image/png;base64,${acct.icon}`;
          });
        });

        // Generate Level 1 groups
        this.generateLevel1Groups();
        this.isLoading = false;
      },
      (error) => {
        console.error("Error fetching grouped user accounts:", error);
        this.isLoading = false;

        // Fallback to regular accounts if grouped accounts fail
        this.fetchRegularAccounts();
      }
    );
  }

  // Set Indian financial year dates based on current date
  private setFinancialYearDates() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const previousYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-based

    // Indian financial year is from April 1 to March 31
    if (currentMonth >= 4) {
      // April or later
      this.startDate = `${currentYear}-04-01`;
      this.endDate = `${currentYear + 1}-03-31`;
    } else {
      // January to March
      this.startDate = `${currentYear - 1}-04-01`;
      this.endDate = `${currentYear}-03-31`;
    }

    console.log(`Financial year set to: ${this.startDate} to ${this.endDate}`);
  }

  // Fallback method to fetch regular accounts
  private fetchRegularAccounts() {
    this.accountService.fetchUserAccounts([1]).subscribe(
      (accounts) => {
        this.userAccounts = accounts;
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

  // Generate Level 1 groups from grouped accounts
  private generateLevel1Groups() {
    // Create a map to accumulate level 1 amounts
    const level1Map = new Map<string, number>();

    // Calculate total amounts for each level 1
    this.groupedAccounts.forEach((group) => {
      const currentAmount = level1Map.get(group.level_1_title) || 0;
      level1Map.set(group.level_1_title, currentAmount + group.level_2_amount);
    });

    // Convert map to Level1Group array
    this.level1Groups = Array.from(level1Map.entries()).map(
      ([title, amount]) => ({
        title,
        amount,
        isExpanded: false, // Default to collapsed
      })
    );
  }

  // Toggle expansion state of Level 1 group
  toggleLevel1Group(title: string) {
    const group = this.level1Groups.find((g) => g.title === title);
    if (group) {
      group.isExpanded = !group.isExpanded;
    }
  }

  // Check if a Level 1 group is expanded
  isLevel1Expanded(title: string): boolean {
    const group = this.level1Groups.find((g) => g.title === title);
    return group ? group.isExpanded : false;
  }

  // Get all Level 1 groups
  getLevel1Groups(): Level1Group[] {
    return this.level1Groups;
  }

  // Get grouped accounts for a specific Level 1 title
  getGroupedAccountsForLevel1(level1Title: string): GroupedUserAccount[] {
    return this.groupedAccounts.filter(
      (ga) => ga.level_1_title === level1Title
    );
  }

  // Legacy method for backward compatibility
  getUserAccounts(): UserAccount[] {
    return this.userAccounts;
  }

  // Get all grouped accounts
  getGroupedAccounts(): GroupedUserAccount[] {
    return this.groupedAccounts;
  }

  // Show transactions for a specific account
  showTransactionsForAccount(account: UserAccount) {
    this.selectedAccountId = account.account_id;
    this.selectedAccountName = account.account_name;
    this.showTransactions = true;
  }

  backFromTransactions() {
    this.showTransactions = false;
    this.selectedAccountId = null;
    this.selectedAccountName = "";
  }
}
