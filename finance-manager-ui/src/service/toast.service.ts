import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  constructor(private toastController: ToastController) {}

  /**
   * Shows a success toast message
   * @param message The message to display
   */
  async showSuccess(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'top',
      color: 'success',
      cssClass: 'toast-success'
    });
    await toast.present();
  }

  /**
   * Shows an error toast message
   * @param message The message to display
   */
  async showError(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'top',
      color: 'danger',
      cssClass: 'toast-error'
    });
    await toast.present();
  }
}