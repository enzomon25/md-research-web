import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ParametrosService } from './parametros.service';
import { CATEGORIAS_PARAMETROS, RUTAS_MODULOS } from '../constants';

export interface Modulo {
  llave: string;
  valor: string;
  ruta?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ModulosService {
  private parametrosService = inject(ParametrosService);

  /**
   * Obtener módulos disponibles según el rol del usuario
   * El backend ya filtra por rol, solo mapeamos a formato con rutas
   */
  obtenerModulosDisponibles(): Observable<Modulo[]> {
    return this.parametrosService.listarPorCategoria(CATEGORIAS_PARAMETROS.MODULOS).pipe(
      map(parametros => {
        // El backend ya filtra por rol y por ind_activo, solo mapeamos a formato con rutas
        return parametros.map(p => ({
          llave: p.llave,
          valor: p.valor,
          ruta: RUTAS_MODULOS[p.llave]
        }));
      })
    );
  }
}
