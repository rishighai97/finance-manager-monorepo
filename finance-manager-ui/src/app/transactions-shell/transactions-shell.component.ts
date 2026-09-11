import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { IonRouterOutlet } from "@ionic/angular/standalone";
import { TransactionListComponent } from "../transaction-list/transaction-list.component";
import { TransactionSearchComponent, TransactionFilters } from "../transaction-search/transaction-search.component";

// Coordinates TransactionListComponent and TransactionSearchComponent,
// which - per JIRA_14 - live on separate child routes ('' and 'search')
// rather than as template siblings, so a literal @Input/@Output binding
// between them isn't possible. This shell uses <router-outlet>'s
// (activate) event to grab each activated component's instance directly
// and wire its @Output/public methods by hand - the standard Angular
// pattern for @Input/@Output-style communication between routed
// siblings. See ux/../jira/JIRA_14.md's Open questions for why.
@Component({
  selector: "app-transactions-shell",
  template: `<ion-router-outlet (activate)="onActivate($event)"></ion-router-outlet>`,
  standalone: true,
  imports: [IonRouterOutlet],
})
export class TransactionsShellComponent {
  private lastAppliedFilters: TransactionFilters | null = null;

  constructor(private router: Router) {}

  onActivate(component: TransactionListComponent | TransactionSearchComponent) {
    if (component instanceof TransactionSearchComponent) {
      component.seedFilters(this.lastAppliedFilters);
      component.filtersApplied.subscribe((filters: TransactionFilters) => {
        this.lastAppliedFilters = filters;
        this.router.navigate(["/tabs/transactions"]);
      });
      component.cancelled.subscribe(() => {
        this.router.navigate(["/tabs/transactions"]);
      });
    } else if (component instanceof TransactionListComponent) {
      if (this.lastAppliedFilters) {
        component.applyFilters(this.lastAppliedFilters);
      }
    }
  }
}
