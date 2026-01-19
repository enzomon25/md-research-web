import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Usuario, PaginacionRespuesta } from '../models';

/**
 * Service para manejar operaciones CRUD de Usuarios
 * Aplica reglas obligatorias: inject(), JSDoc, tipado estricto
 */
@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  // ✅ REGLA 3: Usar inject() en lugar de constructor
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/usuarios`;

  /**
   * Lista usuarios con paginación y filtros
   * @param pagina Número de página (1-based)
   * @param limite Cantidad de items por página
   * @param filtros Filtros opcionales (nombre, username, activo)
   * @returns Observable con respuesta paginada de usuarios
   * @example
   * this.usuariosService.listar(1, 10, { activo: true }).subscribe(usuarios => {
   *   console.log(usuarios.data);
   * });
   */
  listar(
    pagina: number = 1,
    limite: number = 10,
    filtros?: {
      nombres?: string;
      username?: string;
      activo?: boolean;
    }
  ): Observable<PaginacionRespuesta<Usuario>> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('limite', limite.toString());

    if (filtros?.nombres) {
      params = params.set('nombres', filtros.nombres);
    }
    if (filtros?.username) {
      params = params.set('username', filtros.username);
    }
    if (filtros?.activo !== undefined) {
      params = params.set('activo', filtros.activo.toString());
    }

    return this.http.get<PaginacionRespuesta<Usuario>>(this.apiUrl, { params });
  }

  /**
   * Obtiene un usuario por UUID
   * ✅ REGLA 11: Solo usar UUID, nunca IDs numéricos en endpoints públicos
   * @param uuid UUID del usuario
   * @returns Observable con el usuario
   */
  obtenerPorUuid(uuid: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/${uuid}`);
  }

  /**
   * Activa o desactiva un usuario (soft delete)
   * ✅ Usa UUID en lugar de ID numérico por seguridad
   * ✅ Endpoint REST: /usuarios/:uuid/estados (plural)
   * @param uuid UUID del usuario
   * @param activo true para activar, false para desactivar
   * @returns Observable con el usuario actualizado
   */
  cambiarEstado(uuid: string, activo: boolean): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.apiUrl}/${uuid}/estados`, { activo });
  }
}
