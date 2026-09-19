import { Routes } from '@angular/router';
import { authGuard } from './core/auth';
export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./login').then((m) => m.Login) },
  {
    path: 'categorias',
    canActivate: [authGuard],
    loadComponent: () => import('./category-manager').then((m) => m.CategoryManager),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./dashboard').then((m) => m.Dashboard),
  },
  { path: '**', redirectTo: '' },
];
