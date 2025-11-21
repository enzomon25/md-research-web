import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Encuestado, PaginacionRespuesta } from '../models';

@Injectable({
  providedIn: 'root',
})
export class EncuestadosService {
  private apiUrl = `${environment.apiUrl}/encuestados`;

  constructor(private http: HttpClient) {}

  listar(
    pagina: number = 1,
    limite: number = 10,
    nombres?: string,
    numdoc?: string
  ): Observable<PaginacionRespuesta<Encuestado>> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('limite', limite.toString());

    if (nombres) {
      params = params.set('nombres', nombres);
    }

    if (numdoc) {
      params = params.set('numdoc', numdoc);
    }

    return this.http.get<PaginacionRespuesta<Encuestado>>(this.apiUrl, {
      params,
    });
  }

  obtenerPorId(id: number): Observable<Encuestado> {
    return this.http.get<Encuestado>(`${this.apiUrl}/${id}`);
  }

  crear(encuestado: Partial<Encuestado>): Observable<Encuestado> {
    return this.http.post<Encuestado>(this.apiUrl, encuestado);
  }
}
