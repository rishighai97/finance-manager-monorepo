import { Component } from "@angular/core";
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import {
  walletOutline,
  cashOutline,
  documentTextOutline,
  cloudUploadOutline,
  bookmarkOutline,
  folderOutline,
  folder,
} from "ionicons/icons";

@Component({
  selector: "app-tabs",
  templateUrl: "tabs.page.html",
  styleUrls: ["tabs.page.scss"],
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabsPage {
  constructor() {
    addIcons({
      walletOutline,
      cashOutline,
      documentTextOutline,
      cloudUploadOutline,
      bookmarkOutline,
      folderOutline,
    });
  }
}
