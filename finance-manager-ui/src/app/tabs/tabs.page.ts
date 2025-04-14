import { Component } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonMenu, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonMenuToggle, IonButton } from '@ionic/angular/standalone';
import { UserService } from '../../service/user.service';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { walletOutline, cloudUploadOutline, cashOutline, folderOutline, exitOutline, personOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [
    IonTabs, 
    IonTabBar, 
    IonTabButton, 
    IonIcon, 
    IonLabel,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonMenuToggle,
    IonButton
  ],
})
export class TabsPage {
  constructor(
    private userService: UserService,
    private router: Router
  ) {
    addIcons({
      walletOutline,
      cloudUploadOutline,
      cashOutline,
      folderOutline,
      exitOutline,
      personOutline
    });
  }

  get username(): string {
    return this.userService.currentUserSubject.value?.username || 'User';
  }

  logout() {
    console.log("Logging out");
    this.userService.logout().subscribe(() => {
      this.router.navigate(['/auth']);
    });
  }
}