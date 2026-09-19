import { Component } from "@angular/core";
import { TransactionFilterComponent } from "../shared/transaction-filter/transaction-filter.component";
import { TransactionListComponent } from "../transaction-list/transaction-list.component";

// Replaces TransactionsShellComponent (JIRA_14's router-outlet/(activate)
// coordinator) now that the filter component and transaction-list live on
// the same page instead of separate routes - see ux/UX_transaction-search.md
// (Option 4) and jira/JIRA_14.md's addendum for why. The filter component
// (originally transaction-search, extracted into a shared, page-agnostic
// component under JIRA_23 so the new Graphs page can reuse it too) is
// projected into transaction-list's <ng-content> slot so it renders below
// transaction-list's own header, matching the mockup, while the two stay
// genuinely separate, independently-testable components wired by a plain
// template reference + @Output - no shared service, no router-outlet.
@Component({
  selector: "app-transactions-page",
  templateUrl: "./transactions-page.component.html",
  // `display: contents` - this component is the one Ionic's router
  // outlet actually applies the `ion-page` flex-column class to, but it
  // has no ion-header/ion-content of its own (those live on
  // TransactionListComponent, one level down). Left as the default
  // `display: inline`, this host would stop the ion-page column from
  // reaching TransactionListComponent's real content at all; `contents`
  // makes it invisible to layout so TransactionListComponent's own host
  // (also `display: contents`, see its stylesheet) becomes a direct
  // flex-layout descendant of ion-page.
  styles: [":host { display: contents; }"],
  standalone: true,
  imports: [TransactionFilterComponent, TransactionListComponent],
})
export class TransactionsPageComponent {}
