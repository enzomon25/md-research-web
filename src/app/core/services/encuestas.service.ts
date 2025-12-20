import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Encuesta, PaginacionRespuesta } from '../models';

@Injectable({
  providedIn: 'root',
})
export class EncuestasService {
  private apiUrl = `${environment.apiUrl}/encuestas`;

  constructor(private http: HttpClient) {}

  listar(
    pagina: number = 1,
    limite: number = 10,
    filtros?: {
      empresaId?: number;
      ruc?: string;
      razonSocial?: string;
      fechaEncuesta?: string;
      tipoEncuesta?: string;
      estadoId?: string;
      fechaCreacionDesde?: string;
      fechaCreacionHasta?: string;
      usuarioCreacion?: string;
    }
  ): Observable<PaginacionRespuesta<Encuesta>> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('limite', limite.toString());

    if (filtros?.empresaId) {
      params = params.set('empresaId', filtros.empresaId.toString());
    }
    if (filtros?.ruc) {
      params = params.set('ruc', filtros.ruc);
    }
    if (filtros?.razonSocial) {
      params = params.set('razonSocial', filtros.razonSocial);
    }
    if (filtros?.fechaEncuesta) {
      params = params.set('fechaEncuesta', filtros.fechaEncuesta);
    }
    if (filtros?.tipoEncuesta) {
      params = params.set('tipoEncuesta', filtros.tipoEncuesta);
    }
    if (filtros?.estadoId) {
      params = params.set('estadoId', filtros.estadoId);
    }
    if (filtros?.fechaCreacionDesde) {
      params = params.set('fechaCreacionDesde', filtros.fechaCreacionDesde);
    }
    if (filtros?.fechaCreacionHasta) {
      params = params.set('fechaCreacionHasta', filtros.fechaCreacionHasta);
    }
    if (filtros?.usuarioCreacion) {
      params = params.set('usuarioCreacion', filtros.usuarioCreacion);
    }

    return this.http.get<PaginacionRespuesta<Encuesta>>(this.apiUrl, {
      params,
    });
  }

  obtenerPorId(id: number): Observable<Encuesta> {
    return this.http.get<Encuesta>(`${this.apiUrl}/${id}`);
  }

  guardar(encuesta: Partial<Encuesta>): Observable<Encuesta> {
    return this.http.put<Encuesta>(this.apiUrl, encuesta);
  }

  cambiarEstado(id: number, estadoId: number): Observable<Encuesta> {
    return this.http.patch<Encuesta>(`${this.apiUrl}/${id}/estados`, { estadoId });
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  exportar(filtros: any): Observable<Blob> {
    let params = new HttpParams();

    // Agregar todos los parámetros de filtros
    Object.keys(filtros).forEach(key => {
      if (filtros[key] !== null && filtros[key] !== undefined && filtros[key] !== '') {
        params = params.set(key, filtros[key].toString());
      }
    });

    return this.http.get(`${environment.apiUrl}/reportes/xlsx`, {
      params,
      responseType: 'blob'
    });
  }
}
