export interface Statement {
  id?: number;
  accountId: number;
  fileName: string;
  fileExtension: "csv" | "xlsx" | "pdf";
  uploadDate: Date;
  fileBase64: string;
}
