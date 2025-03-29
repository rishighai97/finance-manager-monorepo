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
  closeCircle,
  checkmarkCircle,
} from "ionicons/icons";
import { GroupedUserAccount } from "src/model/grouped-user-account";
import { UserAccount } from "src/model/user-account";
import { UserAccountService } from "src/service/user.account.service";
import { Statement } from "./../../model/statement";
import { Router } from "@angular/router";

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
  fileTypeError = false;

  // Account selection
  isAccountModalOpen = false;

  constructor(
    private userAccountService: UserAccountService,
    private router: Router
  ) {
    addIcons({
      addOutline,
      documentOutline,
      cloudUploadOutline,
      trashOutline,
      createOutline,
      arrowBackOutline,
      closeCircle,
      checkmarkCircle,
    });
  }

  ngOnInit() {
    this.userAccountService.groupedUserAccounts$.subscribe((accounts) => {
      this.groupedAccounts = accounts;
    });

    // Check if we should open the upload modal automatically
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state?.["openUploadModal"]) {
      // Open the modal after a short delay to ensure the component is fully initialized
      setTimeout(() => {
        this.isUploadModalOpen = true;
      }, 300);
    }
  }

  // Account Selection Methods
  openAccountSelector() {
    this.isAccountModalOpen = true;
  }

  closeAccountSelector() {
    this.isAccountModalOpen = false;
    if (this.selectedAccount && this.selectedFile) {
      this.validateFileType();
    }
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
      // Validate file type if account is already selected
      if (this.selectedAccount) {
        this.validateFileType();
      }
    }
  }

  // Validate file type against account's supported extensions
  validateFileType() {
    this.fileTypeError = false;

    if (this.selectedAccount && this.selectedFile) {
      const fileName = this.selectedFile.name;
      const fileExt = fileName.split(".").pop()?.toLowerCase() || "";

      // Get supported extensions from account
      const supportedExtensions = this.selectedAccount.statement_file_extensions
        .split(",")
        .map((ext) => ext.trim().toLowerCase());

      // Check if file extension is supported
      if (!supportedExtensions.includes(fileExt)) {
        this.fileTypeError = true;
      }
    }
  }

  // Add Statement to List
  addStatement() {
    if (this.selectedAccount && this.selectedFile && !this.fileTypeError) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const fileExt =
          this.selectedFile!.name.split(".").pop()?.toLowerCase() || "";

        const statement: Statement = {
          accountId: this.selectedAccount!.account_id,
          fileName: this.selectedFile!.name,
          fileExtension: fileExt as any, // Type assertion to satisfy the model
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
    this.fileTypeError = false;
    this.isUploadModalOpen = false;
  }

  // Delete Statement
  deleteStatement(index: number) {
    this.statementsToBeUploaded.splice(index, 1);
  }

  // Edit Statement (Open Upload Modal with Existing Data)
  editStatement(statement: Statement, index: number) {
    this.selectedAccount = this.getAccountById(statement.accountId);
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

  // Helper method to convert comma-separated extensions to array
  getFileExtensionsArray(extensions: string): string[] {
    if (!extensions) return [];
    return extensions.split(",").map((ext) => ext.trim().toLowerCase());
  }
}
