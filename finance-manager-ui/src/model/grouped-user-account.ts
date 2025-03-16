// src/app/models/grouped-user-account.model.ts

import { UserAccount } from "./user-account";

export class GroupedUserAccount {
  // Properties
  level_1_title: string;
  level_1_amount: number;
  level_2_title: string;
  level_2_amount: number;
  date: string;
  user_accounts: UserAccount[];

  // Constructor
  constructor(
    level_1_title: string,
    level_1_amount: number,
    level_2_title: string,
    level_2_amount: number,
    date: string,
    user_accounts: UserAccount[]
  ) {
    this.level_1_title = level_1_title;
    this.level_1_amount = level_1_amount;
    this.level_2_title = level_2_title;
    this.level_2_amount = level_2_amount;
    this.date = date;
    this.user_accounts = user_accounts;
  }

  // Getter methods
  getLevel1Title(): string {
    return this.level_1_title;
  }

  getLevel1Amount(): number {
    return this.level_1_amount;
  }

  getLevel2Title(): string {
    return this.level_2_title;
  }

  getLevel2Amount(): number {
    return this.level_2_amount;
  }

  getDate(): string {
    return this.date;
  }

  getUserAccounts(): UserAccount[] {
    return this.user_accounts;
  }
}
