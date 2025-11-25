import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/inicio-sesion',
    pathMatch: 'full'
  },
  {
    path: 'inicio-sesion',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'encuestas',
    loadComponent: () => import('./encuestas/encuestas-list/encuestas-list.component').then(m => m.EncuestasListComponent)
  },
  {
    path: 'encuestas/:id',
    loadComponent: () => import('./encuestas/encuesta-form/encuesta-form.component').then(m => m.EncuestaFormComponent)
  }
];
