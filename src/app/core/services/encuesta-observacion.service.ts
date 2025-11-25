import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EncuestaObservacion } from '../models';

@Injectable({
  providedIn: 'root',
})
export class EncuestaObservacionService {
  private apiUrl = `${environment.apiUrl}/encuestas`;

  constructor(private http: HttpClient) {}

  /**
   * Guardar o actualizar observación (upsert)
   */
  guardarObservacion(
    encuestaId: number,
    seccion: string,
    observacion: string
  ): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(
      `${this.apiUrl}/${encuestaId}/observaciones`,
      { seccion, observacion }
    );
  }

  /**
   * Listar todas las observaciones de una encuesta
   */
  listarObservaciones(encuestaId: number): Observable<EncuestaObservacion[]> {
    return this.http.get<EncuestaObservacion[]>(
      `${this.apiUrl}/${encuestaId}/observaciones`
    );
  }

  /**
   * Obtener observación de una sección específica
   */
  obtenerPorSeccion(
    encuestaId: number,
    seccion: string
  ): Observable<EncuestaObservacion | null> {
    return this.http.get<EncuestaObservacion | null>(
      `${this.apiUrl}/${encuestaId}/observaciones/${seccion}`
    );
  }

  /**
   * Actualizar observación existente
   */
  actualizarObservacion(
    encuestaId: number,
    seccion: string,
    observacion: string
  ): Observable<{ mensaje: string }> {
    return this.http.put<{ mensaje: string }>(
      `${this.apiUrl}/${encuestaId}/observaciones/${seccion}`,
      { observacion }
    );
  }

  /**
   * Eliminar observación
   */
  eliminarObservacion(
    encuestaId: number,
    seccion: string
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${encuestaId}/observaciones/${seccion}`
    );
  }
}
