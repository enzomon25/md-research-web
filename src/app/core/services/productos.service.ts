import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Producto } from '../models';

export interface CrearProductoPayload {
  tipoProducto: string;
  marca: string;
  categoria: string;
  nombreBolsa?: string | null;
  proporcion?: string | null;
  resistencia?: string | null;
  descripcion?: string | null;
  dimensiones?: string | null;
}

export type ActualizarProductoPayload = Partial<CrearProductoPayload>;

@Injectable({
  providedIn: 'root',
})
export class ProductosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/productos`;

  listar(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl);
  }

  listarTodos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl, { params: { todos: 'true' } });
  }

  obtenerPorId(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${id}`);
  }

  crear(payload: CrearProductoPayload): Observable<Producto> {
    return this.http.post<Producto>(this.apiUrl, payload);
  }

  actualizar(id: number, payload: ActualizarProductoPayload): Observable<Producto> {
    return this.http.patch<Producto>(`${this.apiUrl}/${id}`, payload);
  }

  toggleEstado(id: number): Observable<Producto> {
    return this.http.patch<Producto>(`${this.apiUrl}/${id}/estado`, {});
  }
}
