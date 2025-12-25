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
    path: 'encuesta/:id/industrias',
    loadComponent: () => import('./encuestas/encuesta-form/encuesta-form.component').then(m => m.EncuestaFormComponent)
  },
  {
    path: 'encuesta/:id/obras',
    loadComponent: () => import('./encuestas/encuesta-obras-form/encuesta-obras-form.component').then(m => m.EncuestaObrasFormComponent)
  },
  {
    path: 'carga-masiva',
    loadComponent: () => import('./carga-masiva/carga-masiva.component').then(m => m.CargaMasivaComponent)
  }
];
