import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';
import { AuthGuard } from "../../service/auth-guard.service";

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'tab1',
        loadComponent: () =>
          import('../account-list/account-list.component').then(
            (m) => m.AccountListComponent
          ),
        canActivate: [AuthGuard]
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('../transactions-page/transactions-page.component').then(
            (m) => m.TransactionsPageComponent
          ),
        canActivate: [AuthGuard]
      },
      {
        path: 'graphs',
        loadComponent: () =>
          import('../graphs/graphs.component').then(
            (m) => m.GraphsComponent
          ),
        canActivate: [AuthGuard]
      },
      {
        path: 'statement-uploader',
        loadComponent: () =>
          import('../statement-uploader/statement-uploader.component').then(
            (m) => m.StatementUploaderComponent
          ),
        canActivate: [AuthGuard]
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('../category-list/category-list.component').then(
            (m) => m.CategoryListComponent
          ),
        canActivate: [AuthGuard]
      },
      {
        path: 'logout',
        loadComponent: () =>
          import('../logout/logout.component').then(
            (m) => m.LogoutComponent
          ),
        canActivate: [AuthGuard]
      },
      {
        path: 'tab2',
        loadComponent: () =>
          import('../tab2/tab2.page').then((m) => m.Tab2Page),
        canActivate: [AuthGuard]
      },
      {
        path: 'tab3',
        loadComponent: () =>
          import('../tab3/tab3.page').then((m) => m.Tab3Page),
        canActivate: [AuthGuard]
      },
      {
        path: '',
        redirectTo: '/tabs/tab1',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/tab1',
    pathMatch: 'full',
  },
];