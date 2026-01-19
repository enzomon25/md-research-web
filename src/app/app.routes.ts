import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';

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
  },
  // ✅ REGLA 5: Ruta protegida con Guard (Solo ADMINISTRADOR)
  {
    path: 'usuarios',
    canActivate: [adminGuard],
    loadComponent: () => import('./usuarios/usuarios-list/usuarios-list.component').then(m => m.UsuariosListComponent)
  },
  // ✅ REGLA 11: Usar UUID en rutas, no IDs numéricos
  {
    path: 'usuarios/:uuid',
    canActivate: [adminGuard],
    loadComponent: () => import('./usuarios/usuarios-detail/usuarios-detail.component').then(m => m.UsuariosDetailComponent)
  }
];
