import { CommonModule } from "@angular/common";
import { Component, OnInit, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
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
  IonFab,
  IonFabButton,
  IonModal,
  IonRadio,
  IonRadioGroup,
  IonInput,
  IonItemDivider,
  IonActionSheet,
  ToastController,
  AlertController,
  IonAlert,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
  walletOutline,
  chevronDownOutline,
  chevronUpOutline,
  arrowBackOutline,
  addOutline,
  pencilOutline,
  createOutline,
  trashOutline,
  documentTextOutline,
} from "ionicons/icons";
import { UserAccount } from "src/model/user-account";
import { GroupedUserAccount } from "src/model/grouped-user-account";
import { UserAccountService } from "src/service/user.account.service";
import { AccountService } from "src/service/account.service";
import { TransactionListComponent } from "../transaction-list/transaction-list.component";
import { Router } from "@angular/router";
import { Account } from "src/model/account";
import { GroupedAccount } from "src/model/grouped-account";
import { UserAccountSaveRequest } from "src/model/user-account-save-request";
import { UserAccountEditRequest } from "src/model/user-account-edit-request";
import { ToastService } from "src/service/toast.service";

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
    IonFab,
    IonFabButton,
    IonModal,
    IonRadio,
    IonRadioGroup,
    FormsModule,
    IonInput,
    IonItemDivider,
    IonAlert,
  ],
})
export class AccountListComponent implements OnInit {
  @ViewChild("accountModal") accountModal!: IonModal;
  @ViewChild("editAccountModal") editAccountModal!: IonModal;

  private userAccounts: UserAccount[] = [];
  private groupedAccounts: GroupedUserAccount[] = [];
  private level1Groups: Level1Group[] = [];
  isLoading: boolean = true;
  showTransactions: boolean = false;
  selectedAccountId: number | null = null;
  selectedAccountName: string = "";

  // Account selection modal
  isAccountModalOpen = false;
  selectedAccount: Account | null = null;
  newUserAccountName: string = "";
  accounts: GroupedAccount[] = [];

  // Edit account modal
  isEditAccountModalOpen = false;
  editingAccount: UserAccount | null = null;
  newEditAccountName: string = "";

  // Delete account alert
  isDeleteAccountAlertOpen = false;
  accountToDelete: UserAccount | null = null;

  // delete account buttons
  // Add this property to the AccountListComponent class
  deleteAccountButtons = [
    {
      text: "Cancel",
      role: "cancel",
      handler: () => {
        this.cancelDeleteAccount();
      },
    },
    {
      text: "Delete",
      role: "destructive",
      handler: () => {
        this.deleteAccount();
      },
    },
  ];
  constructor(
    private userAccountService: UserAccountService,
    private accountService: AccountService,
    private router: Router,
    private toastService: ToastService,
    private alertController: AlertController
  ) {
    addIcons({
      walletOutline,
      chevronDownOutline,
      chevronUpOutline,
      arrowBackOutline,
      addOutline,
      pencilOutline,
      createOutline,
      trashOutline,
      documentTextOutline,
    });
  }

  ngOnInit() {
    // Subscribe to user accounts
    this.userAccountService.groupedUserAccounts$.subscribe((accounts) => {
      this.groupedAccounts = accounts;
      this.isLoading = false;
      this.generateLevel1Groups();
    });

    // Subscribe to available accounts
    this.accountService.groupedAccounts$.subscribe((accounts) => {
      this.accounts = accounts;
    });
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

  // Get all user accounts
  getUserAccounts(): UserAccount[] {
    return this.userAccounts;
  }

  // Get all grouped accounts
  getGroupedAccounts(): GroupedUserAccount[] {
    return this.groupedAccounts;
  }

  // Navigate to transactions for a specific account
  onAccountClick(accountId: number) {
    this.router.navigate(["/tabs/transactions"], {
      queryParams: { accountId: accountId },
    });
  }

  // Show context menu for long press or click on edit icon
  async showAccountOptions(account: UserAccount, event: Event) {
    event.stopPropagation(); // Prevent navigating to transactions

    const actionSheet = await this.alertController.create({
      header: account.user_account_name,
      buttons: [
        {
          text: "View Transactions",
          // icon: "document-text-outline",
          handler: () => {
            this.onAccountClick(account.account_id);
          },
        },
        {
          text: "Edit Name",
          // icon: "create-outline",
          handler: () => {
            this.openEditAccountModal(account);
          },
        },
        {
          text: "Delete Account",
          // icon: "trash-outline",
          role: "destructive",
          handler: () => {
            this.confirmDeleteAccount(account);
          },
        },
        {
          text: "Cancel",
          role: "cancel",
        },
      ],
    });

    await actionSheet.present();
  }

  // Open the new account modal
  openAccountModal() {
    this.isAccountModalOpen = true;
    this.selectedAccount = null;
    this.newUserAccountName = "";
  }

  // Close the new account modal
  closeAccountModal() {
    this.isAccountModalOpen = false;
  }

  // Select an account from the list
  selectAccount(account: Account) {
    this.selectedAccount = account;
    this.newUserAccountName = account.account_name; // Set default name
  }

  // Save a new user account
  saveUserAccount() {
    if (!this.selectedAccount || !this.newUserAccountName.trim()) {
      this.toastService.showError("Please select an account and enter a name");
      return;
    }

    if (this.newUserAccountName.length > 50) {
      this.toastService.showError("Account name cannot exceed 50 characters");
      return;
    }

    const request: UserAccountSaveRequest = {
      user_id: 1, // Assuming user ID 1 as in other places
      account_id: this.selectedAccount.account_id,
      user_account_name: this.newUserAccountName,
    };

    this.userAccountService.saveUserAccount(request).subscribe(
      (accountId) => {
        this.toastService.showSuccess(
          `Account ${this.newUserAccountName} created successfully`
        );
        this.userAccountService.refreshAccounts(); // Refresh accounts list
        this.closeAccountModal();
      },
      (error) => {
        this.toastService.showError("Unable to create new account");
        console.error("Error creating account:", error);
      }
    );
  }

  // Open the edit account modal
  openEditAccountModal(account: UserAccount) {
    this.editingAccount = account;
    this.newEditAccountName = account.user_account_name;
    this.isEditAccountModalOpen = true;
  }

  // Close the edit account modal
  closeEditAccountModal() {
    this.isEditAccountModalOpen = false;
    this.editingAccount = null;
  }

  // Save the edited account name
  saveEditedAccountName() {
    if (!this.editingAccount || !this.newEditAccountName.trim()) {
      this.toastService.showError("Please enter a valid account name");
      return;
    }

    if (this.newEditAccountName.length > 50) {
      this.toastService.showError("Account name cannot exceed 50 characters");
      return;
    }

    const request: UserAccountEditRequest = {
      user_account_id: this.editingAccount.user_account_id,
      new_user_account_name: this.newEditAccountName,
    };

    this.userAccountService.editUserAccountName(request).subscribe(
      () => {
        this.toastService.showSuccess(`Account name updated successfully`);
        this.userAccountService.refreshAccounts(); // Refresh accounts list
        this.closeEditAccountModal();
      },
      (error) => {
        this.toastService.showError("Unable to update account name");
        console.error("Error updating account name:", error);
      }
    );
  }

  // Confirm deleting an account
  confirmDeleteAccount(account: UserAccount) {
    this.accountToDelete = account;
    this.isDeleteAccountAlertOpen = true;
  }

  // Cancel account deletion
  cancelDeleteAccount() {
    this.isDeleteAccountAlertOpen = false;
    this.accountToDelete = null;
  }

  // Delete the account after confirmation
  deleteAccount() {
    if (!this.accountToDelete) return;

    this.userAccountService
      .deleteUserAccount(this.accountToDelete.user_account_id)
      .subscribe(
        () => {
          this.toastService.showSuccess(`Account deleted successfully`);
          this.userAccountService.refreshAccounts(); // Refresh accounts list
          this.accountService.loadGroupedAccounts();
          this.isDeleteAccountAlertOpen = false;
          this.accountToDelete = null;
        },
        (error) => {
          this.toastService.showError("Unable to delete account");
          console.error("Error deleting account:", error);
          this.isDeleteAccountAlertOpen = false;
          this.accountToDelete = null;
        }
      );
  }

  // For backward compatibility
  backFromTransactions() {
    this.showTransactions = false;
    this.selectedAccountId = null;
    this.selectedAccountName = "";
  }
}
