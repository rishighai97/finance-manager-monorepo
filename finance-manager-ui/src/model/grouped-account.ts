import { Account } from "./account";

export interface GroupedAccount {
  level_1_title: string;
  level_2_title: string;
  accounts: Account[];
}