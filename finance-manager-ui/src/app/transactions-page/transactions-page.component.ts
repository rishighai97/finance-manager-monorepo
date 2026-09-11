import { Component } from "@angular/core";
import { TransactionSearchComponent } from "../transaction-search/transaction-search.component";
import { TransactionListComponent } from "../transaction-list/transaction-list.component";

// Replaces TransactionsShellComponent (JIRA_14's router-outlet/(activate)
// coordinator) now that transaction-search and transaction-list live on
// the same page instead of separate routes - see ux/UX_transaction-search.md
// (Option 4) and jira/JIRA_14.md's addendum for why. transaction-search is
// projected into transaction-list's <ng-content> slot so it renders below
// transaction-list's own header, matching the mockup, while the two stay
// genuinely separate, independently-testable components wired by a plain
// template reference + @Output - no shared service, no router-outlet.
@Component({
  selector: "app-transactions-page",
  templateUrl: "./transactions-page.component.html",
  standalone: true,
  imports: [TransactionSearchComponent, TransactionListComponent],
})
export class TransactionsPageComponent {}
