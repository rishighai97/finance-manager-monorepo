import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Component, OnInit } from "@angular/core";
import { IonHeader, IonToolbar, IonTitle, IonContent, IonIcon } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { optionsOutline, alertCircleOutline } from "ionicons/icons";
import { Transaction } from "src/model/transaction";
import { TransactionService } from "src/service/transaction.service";
import { GroupedUserAccount } from "src/model/grouped-user-account";
import { UserAccountService } from "src/service/user.account.service";
import { CategoryService } from "src/service/category.service";
import { UserCategory } from "src/model/user-category";
import {
  TransactionFilterComponent,
  TransactionFilters,
} from "../shared/transaction-filter/transaction-filter.component";

export type GraphType = "category" | "incomeExpense" | "balance" | "monthlySpend";

// Fixed dropdown order (ux/UX_graphs.md's Implementation detail, Option 1) -
// never reordered/filtered, every graph type is always offered regardless
// of what data happens to be available for it.
export const GRAPH_TYPES: { value: GraphType; label: string }[] = [
  { value: "category", label: "Spending by category" },
  { value: "incomeExpense", label: "Income vs. expense over time" },
  { value: "balance", label: "Balance trend over time" },
  { value: "monthlySpend", label: "Monthly spending trend" },
];

// The dataviz skill's validated default categorical hues, used as literal
// hex rather than retinted to Calm Ledger's warmer register - every
// hand-retint attempt made during ux-explore failed the skill's own
// colorblind-safety validator (chroma floor / CVD separation), so this is
// left as a deliberate follow-up rather than shipping an unvalidated
// palette (see ux/UX_graphs.md's Changelog).
const CATEGORY_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4"];
const OTHER_COLOR = "var(--app-color-muted)";
const MAX_NAMED_CATEGORY_SLICES = 5;

interface CategorySlice {
  name: string;
  amount: number;
  pct: number;
  color: string;
  dashArray: string;
  dashOffset: number;
}

interface MonthBar {
  month: string;
  credit: number;
  debit: number;
  creditHeight: number;
  debitHeight: number;
  creditY: number;
  debitY: number;
}

interface SpendBar {
  month: string;
  amount: number;
  height: number;
  y: number;
}

interface BalancePoint {
  date: string;
  balance: number;
  x: number;
  y: number;
}

@Component({
  selector: "app-graphs",
  templateUrl: "./graphs.component.html",
  styleUrls: ["./graphs.component.scss"],
  standalone: true,
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, TransactionFilterComponent],
})
export class GraphsComponent implements OnInit {
  readonly graphTypes = GRAPH_TYPES;
  graphType: GraphType = "category";

  groupedAccounts: GroupedUserAccount[] = [];
  userCategories: UserCategory[] = [];
  private categoryMap: Map<number, UserCategory> = new Map();

  selectedAccountIds: number[] = [];
  startDate = "";
  endDate = "";
  selectedCategoryIds: number[] = [];
  debitCreditIndicator: "DR" | "CR" | null = null;

  private transactions: Transaction[] = [];
  isLoading = false;
  hasError = false;

  categorySlices: CategorySlice[] = [];
  categoryTotal = 0;
  monthlyBars: MonthBar[] = [];
  monthlySpendBars: SpendBar[] = [];
  balancePoints: BalancePoint[] = [];
  balanceMin = 0;
  balanceMax = 0;

  tooltipVisible = false;
  tooltipText = "";
  tooltipX = 0;
  tooltipY = 0;

  // Active-filter dot - same scoping rule as transaction-list's (excludes
  // account selection and the date range, see that component's
  // hasActiveFilters for why).
  get hasActiveFilters(): boolean {
    return this.selectedCategoryIds.length > 0 || this.debitCreditIndicator !== null;
  }

  get currentFilters(): TransactionFilters {
    return {
      selectedAccountIds: [...this.selectedAccountIds],
      startDate: this.startDate,
      endDate: this.endDate,
      selectedCategoryIds: [...this.selectedCategoryIds],
      debitCreditIndicator: this.debitCreditIndicator,
    };
  }

  // Balance trend only means something for a single account that actually
  // carries a running balance (bank-savings statements do; mutual-fund/
  // credit-card ones don't - see ux/UX_graphs.md's real finding). Anything
  // else shows a guidance state instead of a chart.
  get balanceGuidanceNeeded(): boolean {
    if (this.selectedAccountIds.length !== 1) return true;
    return !this.transactions.some(
      (t) => t.closing_balance !== null && t.closing_balance !== undefined
    );
  }

  get chartHasNoData(): boolean {
    if (this.graphType === "category") return this.categorySlices.length === 0;
    if (this.graphType === "incomeExpense") return this.monthlyBars.length === 0;
    if (this.graphType === "monthlySpend") return this.monthlySpendBars.length === 0;
    return this.balancePoints.length === 0;
  }

  constructor(
    private transactionService: TransactionService,
    private userAccountService: UserAccountService,
    private categoryService: CategoryService
  ) {
    addIcons({ optionsOutline, alertCircleOutline });
  }

  ngOnInit() {
    this.setFinancialYearDates();

    this.userAccountService.groupedUserAccounts$.subscribe((accounts) => {
      this.groupedAccounts = accounts;
      // Graphs is a dashboard, not a single-account drill-in - unlike
      // transaction-list (which defaults to one account from a query param),
      // there's no equivalent entry point here, so this page defaults to
      // every account the user has, giving the full picture on first load.
      // A real implementation-time decision, not specified by ux/UX_graphs.md
      // (which only covers what happens once filters exist) - noted here and
      // in that file's Implementation notes.
      if (this.selectedAccountIds.length === 0) {
        const ids: number[] = [];
        accounts.forEach((g) => g.user_accounts.forEach((a) => ids.push(a.user_account_id)));
        this.selectedAccountIds = ids;
        this.loadTransactions();
      }
    });

    this.categoryService.userCategories$.subscribe((categories) => {
      this.userCategories = categories;
      this.categoryMap.clear();
      categories.forEach((c) => this.categoryMap.set(c.id, c));
    });
  }

  onGraphTypeChange() {
    // No refetch needed - every graph type is computed from the same
    // already-fetched transaction set, just aggregated differently.
    // Live-testing found the tooltip from the previous chart type stayed
    // visible (pointing at a mark that no longer exists) until the next
    // hover/mouseleave - clear it explicitly on switch instead.
    this.hideTooltip();
  }

  applyFilters(filters: TransactionFilters) {
    this.selectedAccountIds = [...filters.selectedAccountIds];
    this.startDate = filters.startDate;
    this.endDate = filters.endDate;
    this.selectedCategoryIds = [...filters.selectedCategoryIds];
    this.debitCreditIndicator = filters.debitCreditIndicator;
    this.loadTransactions();
  }

  retryLoad() {
    this.hasError = false;
    this.loadTransactions();
  }

  private loadTransactions() {
    if (this.selectedAccountIds.length === 0 || !this.startDate || !this.endDate) {
      this.transactions = [];
      this.computeAll();
      return;
    }
    this.isLoading = true;
    this.transactionService
      .fetchAllTransactions(
        this.selectedAccountIds,
        this.startDate,
        this.endDate,
        this.selectedCategoryIds.length > 0 ? this.selectedCategoryIds : null,
        this.debitCreditIndicator
      )
      .subscribe(
        (result) => {
          this.transactions = result.transactions;
          this.isLoading = false;
          this.hasError = false;
          this.computeAll();
        },
        (error) => {
          console.error("Error fetching transactions for graphs:", error);
          this.isLoading = false;
          this.hasError = true;
        }
      );
  }

  private computeAll() {
    this.computeCategorySlices();
    this.computeIncomeExpenseAndMonthlySpend();
    this.computeBalancePoints();
  }

  // A transaction tagged under several categories contributes its full
  // amount to each of them (matching how the category pills already show a
  // transaction under every category it's assigned to) rather than
  // splitting the amount - a deliberate simplification, not a bug: total
  // categorized spend across slices can exceed total spend when
  // multi-tagged transactions exist. Named categories are capped at 5
  // (dataviz skill's <=6-segment rule for a donut); the 5th-and-beyond
  // named categories plus genuinely uncategorized spend fold into one
  // "Other" slice so the chart never exceeds 6 segments.
  private computeCategorySlices() {
    const totals = new Map<string, number>();
    const spend = this.transactions.filter((t) => t.is_debit_or_credit === "DR");

    spend.forEach((t) => {
      const raw = t.user_category_ids;
      const ids: number[] = raw
        ? raw instanceof Set
          ? Array.from(raw)
          : (raw as unknown as number[])
        : [];
      if (ids.length === 0) {
        totals.set("Uncategorized", (totals.get("Uncategorized") || 0) + t.debit_or_credit_amount);
        return;
      }
      ids.forEach((id) => {
        const name = this.categoryMap.get(id)?.category_title || "Uncategorized";
        totals.set(name, (totals.get(name) || 0) + t.debit_or_credit_amount);
      });
    });

    const uncategorized = totals.get("Uncategorized") || 0;
    totals.delete("Uncategorized");
    const named = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
    const top = named.slice(0, MAX_NAMED_CATEGORY_SLICES);
    const overflow = named.slice(MAX_NAMED_CATEGORY_SLICES).reduce((s, [, amt]) => s + amt, 0);
    const other = uncategorized + overflow;

    const total = top.reduce((s, [, amt]) => s + amt, 0) + other;
    this.categoryTotal = total;

    const R = 62;
    const CIRC = 2 * Math.PI * R;
    const GAP = 2;
    let offset = 0;
    const slices: CategorySlice[] = [];
    const pushSlice = (name: string, amount: number, color: string) => {
      if (amount <= 0) return;
      const frac = total > 0 ? amount / total : 0;
      const dash = frac * CIRC;
      slices.push({
        name,
        amount,
        pct: Math.round(frac * 100),
        color,
        dashArray: `${Math.max(dash - GAP, 0)} ${CIRC - dash + GAP}`,
        dashOffset: -offset,
      });
      offset += dash;
    };
    top.forEach(([name, amount], i) => pushSlice(name, amount, CATEGORY_COLORS[i % CATEGORY_COLORS.length]));
    pushSlice(other > 0 && named.length > MAX_NAMED_CATEGORY_SLICES ? "Other" : "Uncategorized", other, OTHER_COLOR);

    this.categorySlices = slices;
  }

  private monthKey(date: string): string {
    return date.slice(0, 7); // YYYY-MM
  }

  private monthLabel(key: string): string {
    const [y, m] = key.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleString("en-US", { month: "short" });
  }

  private computeIncomeExpenseAndMonthlySpend() {
    const byMonth = new Map<string, { credit: number; debit: number }>();
    this.transactions.forEach((t) => {
      const key = this.monthKey(t.date);
      const entry = byMonth.get(key) || { credit: 0, debit: 0 };
      if (t.is_debit_or_credit === "CR") entry.credit += t.debit_or_credit_amount;
      else entry.debit += t.debit_or_credit_amount;
      byMonth.set(key, entry);
    });

    const keys = Array.from(byMonth.keys()).sort();
    const monthValues: number[] = [];
    keys.forEach((k) => monthValues.push(byMonth.get(k)!.credit, byMonth.get(k)!.debit));
    const max = Math.max(1, ...monthValues);
    const plotH = 158; // 190 viewBox height - padT(10) - padB(22)

    this.monthlyBars = keys.map((k) => {
      const { credit, debit } = byMonth.get(k)!;
      const creditHeight = (credit / max) * plotH;
      const debitHeight = (debit / max) * plotH;
      return {
        month: this.monthLabel(k),
        credit,
        debit,
        creditHeight,
        debitHeight,
        creditY: 10 + plotH - creditHeight,
        debitY: 10 + plotH - debitHeight,
      };
    });

    const spendMax = Math.max(1, ...keys.map((k) => byMonth.get(k)!.debit));
    this.monthlySpendBars = keys.map((k) => {
      const amount = byMonth.get(k)!.debit;
      const height = (amount / spendMax) * plotH;
      return { month: this.monthLabel(k), amount, height, y: 10 + plotH - height };
    });
  }

  private computeBalancePoints() {
    if (this.balanceGuidanceNeeded) {
      this.balancePoints = [];
      return;
    }
    const withBalance = this.transactions
      .filter((t) => t.closing_balance !== null && t.closing_balance !== undefined)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (withBalance.length === 0) {
      this.balancePoints = [];
      return;
    }

    const vals = withBalance.map((t) => t.closing_balance);
    const min = Math.min(0, ...vals);
    const max = Math.max(...vals);
    this.balanceMin = min;
    this.balanceMax = max;

    const padL = 40;
    const padT = 14;
    const plotW = 320 - padL - 10;
    const plotH = 190 - padT - 22;
    const range = max - min || 1;

    this.balancePoints = withBalance.map((t, i) => ({
      date: t.date,
      balance: t.closing_balance,
      x: padL + (withBalance.length > 1 ? (i / (withBalance.length - 1)) * plotW : plotW / 2),
      y: padT + plotH * (1 - (t.closing_balance - min) / range),
    }));
  }

  balancePolylinePoints(): string {
    return this.balancePoints.map((p) => `${p.x},${p.y}`).join(" ");
  }

  showTooltip(event: MouseEvent, text: string) {
    const target = event.currentTarget as Element;
    const container = target.closest(".chart-svg-wrap") as HTMLElement | null;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    this.tooltipVisible = true;
    this.tooltipText = text;
    this.tooltipX = event.clientX - rect.left;
    this.tooltipY = event.clientY - rect.top - 10;
  }

  hideTooltip() {
    this.tooltipVisible = false;
  }

  formatCurrency(n: number): string {
    return "₹" + Math.round(n).toLocaleString("en-IN");
  }

  private setFinancialYearDates() {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const isJanToMar = currentMonth < 3;
    const fyStartYear = isJanToMar ? currentYear - 1 : currentYear;
    this.startDate = `${fyStartYear}-04-01`;
    this.endDate = `${fyStartYear + 1}-03-31`;
  }
}
