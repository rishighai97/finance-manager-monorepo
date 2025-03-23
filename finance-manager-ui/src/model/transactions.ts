import { Transaction } from "./transaction";

export interface Transactions {
    start_date: string;
    end_date: string;
    opening_balance: number;
    closing_balance: number;
    total_credit: number;
    total_debit: number;
    transactions: Transaction[];
  }
  