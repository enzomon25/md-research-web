import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard funcional para proteger rutas que requieren rol de ADMINISTRADOR
 * ✅ REGLA 5: Guards obligatorios para rutas protegidas
 * 
 * @example
 * {
 *   path: 'usuarios',
 *   canActivate: [adminGuard],
 *   loadComponent: () => import('./usuarios/usuarios-list.component')
 * }
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar si está autenticado
  if (!authService.isAuthenticated()) {
    router.navigate(['/inicio-sesion'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  // Verificar si es administrador
  const userData = authService.getUserData();
  const esAdmin = userData?.roles?.some(rol => rol.descripcion === 'Administrador');

  if (!esAdmin) {
    // Si no es admin, redirigir a encuestas con mensaje
    console.warn('Acceso denegado: Se requiere rol de Administrador');
    router.navigate(['/encuestas']);
    return false;
  }

  return true;
};
