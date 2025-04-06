export interface UserCategory {
  id: number;
  user_id: number; 
  category_title: string;
  new_title?: string; // For tracking pending edits
  delete?: boolean;   // For tracking pending deletions
}