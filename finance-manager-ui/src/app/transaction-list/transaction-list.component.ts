import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
} from "@angular/core";
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
  IonInput
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
  walletOutline,
  chevronDownOutline,
  chevronUpOutline,
  refreshOutline,
  addCircleOutline,
  arrowBackOutline
} from "ionicons/icons";
import { Transaction } from "src/model/transaction";
import { TransactionService } from "src/service/transaction.service";

@Component({
  selector: "app-transaction-list",
  templateUrl: "./transaction-list.component.html",
  styleUrls: ["./transaction-list.component.scss"],
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
    CommonModule,
    FormsModule,
    IonBackButton,
    IonButtons,
    IonButton,
    IonInput
  ],
})
export class TransactionListComponent implements OnInit, OnChanges {
  @Input() accountId: number | null = null;
  @Input() startDate: string = "";
  @Input() endDate: string = "";
  @Output() backClicked = new EventEmitter<void>();

  // New properties for date inputs
  startDateInput: string = "";
  endDateInput: string = "";

  private transactions: Transaction[] = [];
  isLoading: boolean = true;

  openingBalance: number = 0; // Default opening balance
  totalDebit: number = -1;
  totalCredit: number = 1;
  closingBalance: number = 0;

  constructor(private transactionService: TransactionService) {
    console.log("transaction list component constructor called");
    addIcons({
      walletOutline,
      chevronDownOutline,
      chevronUpOutline,
      refreshOutline,
      addCircleOutline,
      arrowBackOutline
    });
  }

  ngOnInit() {
    console.log("transaction list component ngOnInit called");
    this.startDateInput = this.startDate;
    this.endDateInput = this.endDate;
    this.loadTransactions();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Update local date inputs when parent inputs change
    if (changes["startDate"]) {
      this.startDateInput = this.startDate;
    }
    if (changes["endDate"]) {
      this.endDateInput = this.endDate;
    }
    
    // Reload transactions when inputs change
    if (changes["accountId"] || changes["startDate"] || changes["endDate"]) {
      this.loadTransactions();
    }
  }

  // New refresh method to update transactions with new date range
  refreshTransactions() {
    if (this.startDateInput && this.endDateInput) {
      this.startDate = this.startDateInput;
      this.endDate = this.endDateInput;
      this.loadTransactions();
    }
  }

  // Add category method (placeholder for now)
  addCategory(transaction: Transaction) {
    console.log('Add category clicked for transaction:', transaction.transaction_id);
    // This function is a placeholder - will be implemented later
  }

  private loadTransactions() {
    // Only load if accountId is provided
    if (this.accountId && this.startDate && this.endDate) {
      this.isLoading = true;

      const accountIds = [this.accountId];

      this.transactionService
        .fetchAllTransactions(accountIds, this.startDate, this.endDate)
        .subscribe(
          (transactions) => {
            this.transactions = transactions;
            this.calculateTotals();
            console.log(
              `Fetched ${this.transactions.length} transactions for account ${
                this.accountId
              }. Sample amount: ${
                this.transactions.length > 0
                  ? transactions[0].debit_or_credit_amount
                  : "NA"
              }`
            );
            this.isLoading = false;
          },
          (error) => {
            console.error("Error fetching transactions:", error);
            this.isLoading = false;
          }
        );
    }
  }

  // Add this new method to calculate totals
  private calculateTotals() {
    this.totalDebit = Math.round(this.transactions
      .filter(t => t.is_debit_or_credit === 'DR')
      .reduce((sum, t) => sum + (t.debit_or_credit_amount || 0), 0));
      
    this.totalCredit = Math.round(this.transactions
      .filter(t => t.is_debit_or_credit === 'CR')
      .reduce((sum, t) => sum + (t.debit_or_credit_amount || 0), 0));
      
    this.closingBalance = Math.round(this.openingBalance + this.totalCredit - this.totalDebit);
  }

  // Check if a transaction is a debit (expense)
  isDebit(transaction: Transaction): boolean {
    return transaction.is_debit_or_credit === "DR";
  }

  // Get all transactions
  getTransactions(): Transaction[] {
    return this.transactions;
  }

  // Go back to accounts
  backToAccounts(): void {
    this.backClicked.emit();
  }
}