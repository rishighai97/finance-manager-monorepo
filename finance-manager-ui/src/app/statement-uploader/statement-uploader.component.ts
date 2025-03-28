import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
  IonFab,
  IonFabButton,
  IonModal,
  IonAvatar,
  IonButtons,
  IonChip,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
  addOutline,
  documentOutline,
  cloudUploadOutline,
  trashOutline,
  createOutline,
} from "ionicons/icons";
import { GroupedUserAccount } from "src/model/grouped-user-account";
import { UserAccount } from "src/model/user-account";
import { AccountService } from "src/service/account.service";

interface UploadedStatement {
  id?: number;
  account: UserAccount;
  fileName: string;
  fileExtension: string;
  uploadDate: Date;
  fileBase64: string;
}

@Component({
  selector: "app-statement-uploader",
  templateUrl: "./statement-uploader.component.html",
  styleUrls: ["./statement-uploader.component.scss"],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonIcon,
    IonFab,
    IonFabButton,
    IonModal,
    IonAvatar,
    IonButtons,
    IonChip,
  ],
})
export class StatementUploaderComponent implements OnInit {
  groupedAccounts: GroupedUserAccount[] = [];

  constructor(private accountService: AccountService) {
    addIcons({
      addOutline,
      documentOutline,
      cloudUploadOutline,
      trashOutline,
      createOutline,
    });
  }

  ngOnInit() {
    this.accountService.groupedAccounts$.subscribe((accounts) => {
      this.groupedAccounts = accounts;
    });
  }
}
