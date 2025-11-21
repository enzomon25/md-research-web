import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Parametro } from '../models';

@Injectable({
  providedIn: 'root',
})
export class ParametrosService {
  private apiUrl = `${environment.apiUrl}/parametros`;

  constructor(private http: HttpClient) {}

  listarPorCategoria(categoria: string): Observable<Parametro[]> {
    const params = new HttpParams().set('categoria', categoria);
    return this.http.get<Parametro[]>(this.apiUrl, { params });
  }
}
