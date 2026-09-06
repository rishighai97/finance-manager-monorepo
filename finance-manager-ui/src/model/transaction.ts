export interface Transaction {
  transaction_id: string;
  date: string;
  user_account_id: number;
  title: string;
  debit_or_credit_amount: number;
  is_debit_or_credit: string;
  closing_balance: number;
  category_id: number | null;
  type: string | null;
  units: number | null;
  price_per_unit: number | null;
  user_category_ids: Set<number> | null;
}
