import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EncuestaObservacionHistorial } from '../models';

@Injectable({
  providedIn: 'root'
})
export class EncuestaObservacionHistorialService {
  private readonly apiUrl = `${environment.apiUrl}/encuestas`;

  constructor(private readonly http: HttpClient) {}

  /**
   * Obtener todo el historial de observaciones de una encuesta
   */
  listarPorEncuesta(encuestaId: number): Observable<EncuestaObservacionHistorial[]> {
    return this.http.get<EncuestaObservacionHistorial[]>(
      `${this.apiUrl}/${encuestaId}/observaciones/historial`
    );
  }

  /**
   * Obtener historial de observaciones por sección
   */
  listarPorSeccion(encuestaId: number, seccion: string): Observable<EncuestaObservacionHistorial[]> {
    return this.http.get<EncuestaObservacionHistorial[]>(
      `${this.apiUrl}/${encuestaId}/observaciones/historial/seccion/${seccion}`
    );
  }
}
