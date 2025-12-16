import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CrearObraEncuestaDto {
  encuestaId: number;
  etapaObra: string;
  fechaFinalizacionObra: string; // Formato YYYY-MM-DD
  // Datos de dirección (obligatorios)
  codPais: string;
  codDepartamento: string;
  codProvincia: string;
  codDistrito: string;
  tipoVia?: string;
  nombreVia?: string;
  numeroVia?: string;
  referencia?: string;
  tipoReferencia?: string; // OBRA (por defecto)
}

export interface ObraEncuesta {
  obraEncuestaId: number;
  encuestaId: number;
  etapaObra: string;
  fechaFinalizacionObra: string;
  fechaCreacion?: string;
  usuarioCreacion?: string;
  fechaModificacion?: string;
  usuarioModificacion?: string;
  indActivo?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ObraEncuestaService {
  private apiUrl = `${environment.apiUrl}/obras`;

  constructor(private http: HttpClient) {}

  /**
   * Crear una nueva obra encuesta con su dirección asociada
   * PUT /obras
   * Requiere: datos de obra + datos de dirección (obligatorios)
   */
  crear(dto: CrearObraEncuestaDto): Observable<ObraEncuesta> {
    return this.http.put<ObraEncuesta>(this.apiUrl, dto);
  }

  /**
   * Obtener obra encuesta por ID
   */
  obtenerPorId(obraEncuestaId: number): Observable<ObraEncuesta> {
    return this.http.get<ObraEncuesta>(`${this.apiUrl}/${obraEncuestaId}`);
  }

  /**
   * Obtener obra encuesta por ID de encuesta
   */
  obtenerPorEncuestaId(encuestaId: number): Observable<ObraEncuesta | null> {
    return this.http.get<ObraEncuesta | null>(
      `${this.apiUrl}/encuesta/${encuestaId}`
    );
  }
}
