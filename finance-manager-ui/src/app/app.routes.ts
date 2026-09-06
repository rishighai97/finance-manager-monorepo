import { Routes } from '@angular/router';
import { AuthGuard } from '../service/auth-guard.service';

export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () => import('./auth/auth.component').then((m) => m.AuthComponent),
  },
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
    canActivate: [AuthGuard]
  },
];