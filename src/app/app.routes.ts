import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'tabs/home',
    pathMatch: 'full',
  },
  {
    path: 'tabs',
    loadComponent: () => import('./features/tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () => import('./features/home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'history',
        loadComponent: () => import('./features/history/history.page').then((m) => m.HistoryPage),
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports.page').then((m) => m.ReportsPage),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.page').then((m) => m.SettingsPage),
      },
    ],
  },
  {
    path: 'record/new',
    loadComponent: () =>
      import('./features/record-form/record-form.page').then((m) => m.RecordFormPage),
  },
  {
    path: 'record/:id/edit',
    loadComponent: () =>
      import('./features/record-form/record-form.page').then((m) => m.RecordFormPage),
  },
  { path: '**', redirectTo: 'tabs/home' },
];
