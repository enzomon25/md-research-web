import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Empresa, PaginacionRespuesta, TipoEmpresa } from '../models';

@Injectable({
  providedIn: 'root'
})
export class EmpresasService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/empresas`;

  listar(
    pagina: number = 1,
    limite: number = 10,
    razonSocial?: string,
    ruc?: string,
    tipoEmpresaId?: number | null
  ): Observable<PaginacionRespuesta<Empresa>> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('limite', limite.toString());

    if (razonSocial) {
      params = params.set('razonSocial', razonSocial);
    }

    if (ruc) {
      params = params.set('ruc', ruc);
    }

    if (tipoEmpresaId !== undefined && tipoEmpresaId !== null) {
      params = params.set('tipoEmpresaId', tipoEmpresaId.toString());
    }

    return this.http.get<PaginacionRespuesta<Empresa>>(this.apiUrl, { params });
  }

  obtenerPorId(id: number): Observable<Empresa> {
    return this.http.get<Empresa>(`${this.apiUrl}/${id}`);
  }

  crear(empresa: Partial<Empresa>): Observable<Empresa> {
    return this.http.post<Empresa>(this.apiUrl, empresa);
  }

  listarTipos(): Observable<TipoEmpresa[]> {
    return this.http.get<TipoEmpresa[]>(`${this.apiUrl}/tipos`);
  }
}
