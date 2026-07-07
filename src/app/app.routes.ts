import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'setup' },
  { path: 'setup', loadComponent: () => import('./features/setup/setup').then((m) => m.Setup) },
  { path: 'testrunde', loadComponent: () => import('./features/testrunde/testrunde').then((m) => m.Testrunde) },
  { path: 'board', loadComponent: () => import('./features/board/board').then((m) => m.Board) },
  { path: 'play', loadComponent: () => import('./features/play/play').then((m) => m.Play) },
  {
    path: 'result',
    loadComponent: () => import('./features/result/result').then((m) => m.Result),
  },
  {
    path: 'leaderboard',
    loadComponent: () => import('./features/leaderboard/leaderboard').then((m) => m.Leaderboard),
  },
  { path: 'admin', loadComponent: () => import('./features/admin/admin').then((m) => m.Admin) },
  { path: '**', redirectTo: 'setup' },
];
