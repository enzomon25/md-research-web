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
    empresaId?: number
  ): Observable<PaginacionRespuesta<Encuesta>> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('limite', limite.toString());

    if (empresaId) {
      params = params.set('empresaId', empresaId.toString());
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
}
