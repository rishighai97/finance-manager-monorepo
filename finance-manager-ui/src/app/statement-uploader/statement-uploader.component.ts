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
  IonSpinner,
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
  refreshOutline,
  alertCircleOutline,
} from "ionicons/icons";
import { GroupedUserAccount } from "src/model/grouped-user-account";
import { UserAccount } from "src/model/user-account";
import { UserAccountService } from "src/service/user.account.service";
import { Statement, UploadResult } from "../../model/statement";
import { Router } from "@angular/router";
import * as uuid from "uuid";
import { ToastService } from "src/service/toast.service";
import { StatementUploadService } from "src/service/statement-upload.service";

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
    IonSpinner,
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

  // Upload results tracking
  uploadResults: UploadResult[] = [];
  isUploading = false;

  constructor(
    private userAccountService: UserAccountService,
    private statementUploadService: StatementUploadService,
    private router: Router,
    private toastService: ToastService
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
      refreshOutline,
      alertCircleOutline,
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
      const file_name = this.selectedFile.name;
      const fileExt = file_name.split(".").pop()?.toLowerCase() || "";

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
          account_id: this.selectedAccount!.account_id,
          user_account_id: this.selectedAccount!.user_account_id,
          user_id: this.selectedAccount!.user_id,
          file_name: this.selectedFile!.name,
          file_extension: fileExt as any, // Type assertion to satisfy the model
          file: e.target.result.split(",")[1], // Base64 without data URL prefix
          request_id: uuid.v4(),
        };

        this.statementsToBeUploaded.push(statement);
        this.resetUploadForm();
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  // Upload all statements to the API
  uploadAllStatements() {
    if (this.statementsToBeUploaded.length === 0) {
      this.toastService.showError("No statements to upload");
      return;
    }

    this.isUploading = true;
    this.uploadResults = []; // Clear previous results

    // Create a map of request_id to statement for easy lookup
    const statementMap = new Map<string, Statement>();
    this.statementsToBeUploaded.forEach((statement) => {
      statementMap.set(statement.request_id, statement);
    });

    // Send all statements in a single API call
    this.statementUploadService
      .uploadAllStatements(this.statementsToBeUploaded)
      .subscribe(
        (responses) => {
          this.isUploading = false;

          // Process each response and match with the corresponding statement
          this.uploadResults = responses.map((response) => {
            const statement = statementMap.get(response.request_id);
            return {
              statement: statement!,
              response: response,
            };
          });

          // Count successful uploads
          const successCount = responses.filter((r) => r.status).length;

          // Remove successfully uploaded statements from the list
          this.statementsToBeUploaded = this.statementsToBeUploaded.filter(
            (statement) => {
              // Find the response for this statement
              const response = responses.find(
                (r) => r.request_id === statement.request_id
              );
              // Keep only failed statements
              return response ? !response.status : true;
            }
          );

          // Show appropriate toast message
          if (successCount === responses.length) {
            this.toastService.showSuccess(
              `All ${successCount} statements uploaded successfully`
            );
          } else {
            this.toastService.showSuccess(
              `${successCount} of ${responses.length} statements uploaded successfully`
            );
          }
        },
        (error) => {
          console.error("Error uploading statements:", error);

          // Create failed responses for all statements
          this.uploadResults = this.statementsToBeUploaded.map((statement) => ({
            statement,
            response: {
              status: false,
              request_id: statement.request_id,
              transaction_count: 0,
              error_messages: ["Network or server error occurred"],
            },
          }));

          this.isUploading = false;
          this.toastService.showError("Failed to upload statements");
        }
      );
  }

  // Reset Upload Form
  resetUploadForm() {
    this.selectedAccount = null;
    this.selectedFile = null;
    this.fileTypeError = false;
    this.isUploadModalOpen = false;
    this.uploadResults = []; // Clear upload results
  }

  // Delete Statement
  deleteStatement(index: number) {
    this.statementsToBeUploaded.splice(index, 1);
  }

  // Edit Statement (Open Upload Modal with Existing Data)
  editStatement(statement: Statement, index: number) {
    this.selectedAccount = this.getUserAccountById(statement.user_account_id);
    this.isUploadModalOpen = true;
    // Remove the existing statement to replace it
    this.statementsToBeUploaded.splice(index, 1);
  }

  // Clear All Statements
  clearAllStatements() {
    this.statementsToBeUploaded = [];
    this.uploadResults = []; // Also clear upload results
  }

  // Reset uploader completely
  resetUploader() {
    this.statementsToBeUploaded = [];
    this.uploadResults = [];
    this.resetUploadForm();
  }

  // Helper method to get account by ID
  getUserAccountById(user_account_id: number): UserAccount | null {
    for (const group of this.groupedAccounts) {
      const account = group.user_accounts.find(
        (a) => a.user_account_id === user_account_id
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
