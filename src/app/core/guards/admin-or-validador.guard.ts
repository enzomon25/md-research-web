import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard funcional para proteger rutas que requieren rol de ADMINISTRADOR o VALIDADOR
 */
export const adminOrValidadorGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/inicio-sesion'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  const userData = authService.getUserData();
  const tieneAcceso = userData?.roles?.some(
    rol => rol.descripcion === 'Administrador' || rol.descripcion === 'Validador'
  );

  if (!tieneAcceso) {
    console.warn('Acceso denegado: Se requiere rol de Administrador o Validador');
    router.navigate(['/encuestas']);
    return false;
  }

  return true;
};
