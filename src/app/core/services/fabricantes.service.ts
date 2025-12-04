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

@Injectable({
  providedIn: 'root'
})
export class FabricantesService {
  private apiUrl = `${environment.apiUrl}/fabricantes`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Fabricante[]> {
    return this.http.get<Fabricante[]>(this.apiUrl);
  }

  obtenerMarcasPorFabricante(fabricanteId: number): Observable<MarcaFabricante[]> {
    return this.http.get<MarcaFabricante[]>(`${this.apiUrl}/${fabricanteId}`);
  }

  eliminarMarcaFabricante(marcaFabricanteId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/marca-fabricante/${marcaFabricanteId}`);
  }
}
