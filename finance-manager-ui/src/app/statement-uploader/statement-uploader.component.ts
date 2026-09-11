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
  arrowBackOutline,
  closeCircle,
  checkmarkCircle,
  refreshOutline,
  alertCircle,
} from "ionicons/icons";
import { GroupedUserAccount } from "src/model/grouped-user-account";
import { UserAccount } from "src/model/user-account";
import { UserAccountService } from "src/service/user.account.service";
import { Statement } from "../../model/statement";
import { Router } from "@angular/router";
import * as uuid from "uuid";
import { ToastService } from "src/service/toast.service";
import { StatementUploadService } from "src/service/statement-upload.service";

// Calm Ledger (ux/UX_statement-uploader.md, Option B) - a queued statement
// and its eventual result are now ONE row, tracked by status, instead of
// two separate arrays (statementsToBeUploaded / uploadResults) the template
// swapped between. UI-only fields live here, not on the shared Statement
// model in src/model/statement.ts - the API payload sent on upload is still
// just the plain Statement (see uploadAllStatements()/retryStatement()).
export interface UploadableStatement {
  statement: Statement;
  status: "queued" | "uploading" | "success" | "failed";
  transactionCount?: number;
  errorMessage?: string;
}

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
  statements: UploadableStatement[] = [];

  // Upload form variables
  isUploadModalOpen = false;
  selectedAccount: UserAccount | null = null;
  selectedFile: File | null = null;
  fileTypeError = false;

  // Account selection
  isAccountModalOpen = false;

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
      arrowBackOutline,
      closeCircle,
      checkmarkCircle,
      refreshOutline,
      alertCircle,
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

        this.statements.push({ statement, status: "queued" });
        this.resetUploadForm();
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  hasQueuedItems(): boolean {
    return this.statements.some((item) => item.status === "queued");
  }

  // Upload every queued statement. The real API (StatementUploadService.
  // uploadAllStatements) takes the whole batch in one HTTP call - it does
  // NOT upload sequentially item-by-item - so every queued row flips to
  // 'uploading' together and resolves together when the single response
  // array comes back; see ux/UX_statement-uploader.md's Implementation
  // notes for why the mockup's "one row uploading at a time" framing
  // doesn't match this.
  uploadAllStatements() {
    const queuedItems = this.statements.filter((item) => item.status === "queued");
    if (queuedItems.length === 0) {
      this.toastService.showError("No statements to upload");
      return;
    }

    this.isUploading = true;
    queuedItems.forEach((item) => (item.status = "uploading"));

    const itemByRequestId = new Map<string, UploadableStatement>();
    queuedItems.forEach((item) => itemByRequestId.set(item.statement.request_id, item));

    this.statementUploadService
      .uploadAllStatements(queuedItems.map((item) => item.statement))
      .subscribe(
        (responses) => {
          this.isUploading = false;

          responses.forEach((response) => {
            const item = itemByRequestId.get(response.request_id);
            if (item) {
              item.status = response.status ? "success" : "failed";
              item.transactionCount = response.transaction_count;
              item.errorMessage = response.error_messages?.[0];
            }
          });

          const successCount = responses.filter((r) => r.status).length;
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

          queuedItems.forEach((item) => {
            item.status = "failed";
            item.errorMessage = "Network or server error occurred";
          });

          this.isUploading = false;
          this.toastService.showError("Failed to upload statements");
        }
      );
  }

  // Retry a single failed statement (new - the real per-item failure had
  // no way to re-submit before, only a static error message).
  retryStatement(item: UploadableStatement) {
    item.status = "uploading";
    item.errorMessage = undefined;

    this.statementUploadService.uploadStatement(item.statement).subscribe(
      (response) => {
        item.status = response.status ? "success" : "failed";
        item.transactionCount = response.transaction_count;
        item.errorMessage = response.error_messages?.[0];
        if (response.status) {
          this.toastService.showSuccess(
            `${item.statement.file_name} uploaded successfully`
          );
        } else {
          this.toastService.showError(`Failed to upload ${item.statement.file_name}`);
        }
      },
      (error) => {
        console.error("Error retrying statement upload:", error);
        item.status = "failed";
        item.errorMessage = "Network or server error occurred";
        this.toastService.showError(`Failed to upload ${item.statement.file_name}`);
      }
    );
  }

  // Reset Upload Form
  resetUploadForm() {
    this.selectedAccount = null;
    this.selectedFile = null;
    this.fileTypeError = false;
    this.isUploadModalOpen = false;
  }

  // Delete Statement (only ever called on a queued row - see template)
  deleteStatement(index: number) {
    this.statements.splice(index, 1);
  }

  // Edit Statement (Open Upload Modal with Existing Data)
  editStatement(item: UploadableStatement, index: number) {
    this.selectedAccount = this.getUserAccountById(item.statement.user_account_id);
    this.isUploadModalOpen = true;
    // Remove the existing statement to replace it
    this.statements.splice(index, 1);
  }

  // Clear All Statements (also used post-submit - "Clear All & Start Over"
  // is one action now, not two differently-worded ones; see Implementation
  // detail point 3)
  clearAllStatements() {
    this.statements = [];
  }

  // Reset uploader completely
  resetUploader() {
    this.statements = [];
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

  refreshWithAnimation(event: any) {
    const button = event.target.closest('ion-button');
    const icon = button.querySelector('ion-icon') || button; // Fallback if icon not found
    icon.classList.add('refreshing');
    
    // Call the actual refresh method
    this.resetUploader();
    
    // Remove the animation class after animation completes
    setTimeout(() => {
      icon.classList.remove('refreshing');
      this.toastService.showSuccess("Statement uploader reset");
    }, 1000);
  }
}
