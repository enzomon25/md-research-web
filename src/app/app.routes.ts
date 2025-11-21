import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/encuestas',
    pathMatch: 'full'
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
