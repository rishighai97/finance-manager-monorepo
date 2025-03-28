import { Component, OnInit, ViewChild } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  IonHeader,
  IonRow,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
  IonFab,
  IonFabButton,
  IonModal,
  IonAvatar,
  IonButtons,
  IonChip,
  IonCheckbox,
  IonItemDivider,
  IonInput,
  IonRadio,
  IonRadioGroup,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
  addOutline,
  documentOutline,
  cloudUploadOutline,
  trashOutline,
  createOutline,
  arrowBackOutline,
} from "ionicons/icons";
import { GroupedUserAccount } from "src/model/grouped-user-account";
import { UserAccount } from "src/model/user-account";
import { AccountService } from "src/service/account.service";
import { Statement } from "./../../model/statement";

@Component({
  selector: "app-statement-uploader",
  templateUrl: "./statement-uploader.component.html",
  styleUrls: ["./statement-uploader.component.scss"],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonRow,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonIcon,
    IonFab,
    IonFabButton,
    IonModal,
    IonAvatar,
    IonButtons,
    IonChip,
    IonCheckbox,
    IonItemDivider,
    IonInput,
    IonRadio,
    IonRadioGroup,
  ],
})
export class StatementUploaderComponent implements OnInit {
  @ViewChild("accountModal") accountModal!: IonModal;

  groupedAccounts: GroupedUserAccount[] = [];
  statementsToBeUploaded: Statement[] = [];

  // Upload form variables
  isUploadModalOpen = false;
  selectedAccount: UserAccount | null = null;
  selectedFile: File | null = null;
  selectedExtension: "csv" | "xlsx" | "pdf" | null = null;

  // Account selection
  isAccountModalOpen = false;

  constructor(private accountService: AccountService) {
    addIcons({
      addOutline,
      documentOutline,
      cloudUploadOutline,
      trashOutline,
      createOutline,
      arrowBackOutline,
    });
  }

  ngOnInit() {
    this.accountService.groupedAccounts$.subscribe((accounts) => {
      this.groupedAccounts = accounts;
    });
  }

  // Account Selection Methods
  openAccountSelector() {
    this.isAccountModalOpen = true;
  }

  closeAccountSelector() {
    this.isAccountModalOpen = false;
  }

  selectAccount(account: UserAccount) {
    this.selectedAccount = account;
    this.closeAccountSelector();
  }

  // File Upload Methods
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      // Automatically select extension based on file
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "csv" || ext === "xlsx" || ext === "pdf") {
        this.selectedExtension = ext;
      }
    }
  }

  // Add Statement to List
  addStatement() {
    if (this.selectedAccount && this.selectedFile && this.selectedExtension) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const statement: Statement = {
          accountId: this.selectedAccount!.account_id,
          fileName: this.selectedFile!.name,
          fileExtension: this.selectedExtension!,
          uploadDate: new Date(),
          fileBase64: e.target.result.split(",")[1], // Base64 without data URL prefix
        };

        this.statementsToBeUploaded.push(statement);
        this.resetUploadForm();
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  // Reset Upload Form
  resetUploadForm() {
    this.selectedAccount = null;
    this.selectedFile = null;
    this.selectedExtension = null;
    this.isUploadModalOpen = false;
  }

  // Delete Statement
  deleteStatement(index: number) {
    this.statementsToBeUploaded.splice(index, 1);
  }

  // Edit Statement (Open Upload Modal with Existing Data)
  editStatement(statement: Statement, index: number) {
    this.selectedAccount = this.getAccountById(statement.accountId);
    this.selectedExtension = statement.fileExtension;
    this.isUploadModalOpen = true;
    // Remove the existing statement to replace it
    this.statementsToBeUploaded.splice(index, 1);
  }

  // Clear All Statements
  clearAllStatements() {
    this.statementsToBeUploaded = [];
  }

  // Helper method to get account by ID
  getAccountById(accountId: number): UserAccount | null {
    for (const group of this.groupedAccounts) {
      const account = group.user_accounts.find(
        (a) => a.account_id === accountId
      );
      if (account) return account;
    }
    return null;
  }
}
