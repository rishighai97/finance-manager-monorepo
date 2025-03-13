// src/app/models/account.model.ts

export class UserAccount {
    // Declare fields as private
    user_account_id: number;
    account_id: number;
    user_id: number;
    account_type_id: number;
    account_name: string;
    icon: string;
    account_type_1: string;
    account_type_2: string;
    account_type_3: string;
    latest_balance: number;
    latest_balance_date: string;
  
    // Constructor to initialize all the fields
    constructor(
      user_account_id: number,
      account_id: number,
      user_id: number,
      account_type_id: number,
      account_name: string,
      icon: string,
      account_type_1: string,
      account_type_2: string,
      account_type_3: string,
      latest_balance: number,
      latest_balance_date: string
    ) {
      this.user_account_id = user_account_id;
      this.account_id = account_id;
      this.user_id = user_id;
      this.account_type_id = account_type_id;
      this.account_name = account_name;
      this.icon = icon;
      this.account_type_1 = account_type_1;
      this.account_type_2 = account_type_2;
      this.account_type_3 = account_type_3;
      this.latest_balance = latest_balance;
      this.latest_balance_date = latest_balance_date;
    }
  
    // Getter methods for each private field
    getUserAccountId(): number {
      return this.user_account_id;
    }
  
    getAccountId(): number {
      return this.account_id;
    }
  
    getUserId(): number {
      return this.user_id;
    }
  
    getAccountTypeId(): number {
      return this.account_type_id;
    }
  
    getAccountName(): string {
      return this.account_name;
    }
  
    getIcon(): string {
      return this.icon;
    }
  
    getAccountType1(): string {
      return this.account_type_1;
    }
  
    getAccountType2(): string {
      return this.account_type_2;
    }
  
    getAccountType3(): string {
      return this.account_type_3;
    }
  
    getLatestBalance(): number {
      return this.latest_balance;
    }
  
    getLatestBalanceDate(): string {
      return this.latest_balance_date;
    }
  }
  