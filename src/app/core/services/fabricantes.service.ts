import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Fabricante {
  fabricanteId: number;
  razonSocial: string;
  ruc: string | null;
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaModificacion: string;
  usuarioModificacion: string;
  indActivo: number;
}

export interface MarcaFabricante {
  marcaFabricanteId: number;
  fabricanteId: number;
  nombreMarca: string | null;
  tipoCemento: string;
  marca: string;
  subMarca: string | null;
  descFisica: string | null;
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaModificacion: string;
  usuarioModificacion: string;
  indActivo: number;
}

export interface FabricanteDetalle {
  fabricante: Fabricante;
  marcas: MarcaFabricante[];
}

export interface ToggleEstadoResult {
  fabricante: Fabricante;
  marcasAfectadas: number;
}

export interface CrearFabricantePayload {
  razonSocial: string;
  ruc?: string | null;
}

export interface UpsertMarcaPayload {
  marcaFabricanteId?: number;
  nombreMarca?: string | null;
  tipoCemento: string;
  marca: string;
  subMarca?: string | null;
  descFisica?: string | null;
}

export interface UpsertFabricantePayload {
  razonSocial?: string;
  ruc?: string | null;
  marcas?: UpsertMarcaPayload[];
}

@Injectable({
  providedIn: 'root'
})
export class FabricantesService {
  private apiUrl = `${environment.apiUrl}/fabricantes`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Fabricante[]> {
    return this.http.get<Fabricante[]>(this.apiUrl);
  }

  listarTodos(): Observable<Fabricante[]> {
    return this.http.get<Fabricante[]>(this.apiUrl, { params: { todos: 'true' } });
  }

  obtenerMarcasPorFabricante(fabricanteId: number): Observable<MarcaFabricante[]> {
    return this.http.get<MarcaFabricante[]>(`${this.apiUrl}/${fabricanteId}`);
  }

  obtenerDetalle(fabricanteId: number): Observable<FabricanteDetalle> {
    return this.http.get<FabricanteDetalle>(`${this.apiUrl}/${fabricanteId}/detalle`);
  }

  crear(payload: CrearFabricantePayload): Observable<Fabricante> {
    return this.http.post<Fabricante>(this.apiUrl, payload);
  }

  upsert(fabricanteId: number, payload: UpsertFabricantePayload): Observable<FabricanteDetalle> {
    return this.http.put<FabricanteDetalle>(`${this.apiUrl}/${fabricanteId}`, payload);
  }

  toggleEstadoFabricante(fabricanteId: number): Observable<ToggleEstadoResult> {
    return this.http.patch<ToggleEstadoResult>(`${this.apiUrl}/${fabricanteId}/estado`, {});
  }

  toggleEstadoMarca(fabricanteId: number, marcaFabricanteId: number): Observable<MarcaFabricante> {
    return this.http.patch<MarcaFabricante>(
      `${this.apiUrl}/${fabricanteId}/marcas/${marcaFabricanteId}/estado`,
      {},
    );
  }

  eliminarMarcaFabricante(marcaFabricanteId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/marca-fabricante/${marcaFabricanteId}`);
  }
}
