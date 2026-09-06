export enum TransactionUserCategoryAction {
  DELETE = "DELETE",
  INSERT = "INSERT",
}

export interface TransactionUserCategory {
  transaction_id: string;
  user_category_id: number;
  action: TransactionUserCategoryAction;
}
