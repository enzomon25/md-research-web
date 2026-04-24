import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Empresa, EncuestaEmpresa, EncuestadoEmpresa, ObraEmpresa, PaginacionRespuesta, TipoEmpresa } from '../models';

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
    tipoEmpresaId?: number | null,
    direccion?: string,
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

    if (direccion) {
      params = params.set('direccion', direccion);
    }

    return this.http.get<PaginacionRespuesta<Empresa>>(this.apiUrl, { params });
  }

  obtenerPorId(id: number): Observable<Empresa> {
    return this.http.get<Empresa>(`${this.apiUrl}/${id}`);
  }

  crear(empresa: Partial<Empresa>): Observable<Empresa> {
    return this.http.post<Empresa>(this.apiUrl, empresa);
  }

  actualizar(id: number, dto: Partial<Empresa>): Observable<Empresa> {
    return this.http.patch<Empresa>(`${this.apiUrl}/${id}`, dto);
  }

  listarTipos(): Observable<TipoEmpresa[]> {
    return this.http.get<TipoEmpresa[]>(`${this.apiUrl}/tipos`);
  }

  obtenerObrasPorEmpresaId(id: number): Observable<ObraEmpresa[]> {
    return this.http.get<ObraEmpresa[]>(`${this.apiUrl}/${id}/obras`);
  }

  obtenerEncuestasPorEmpresaId(id: number): Observable<EncuestaEmpresa[]> {
    return this.http.get<EncuestaEmpresa[]>(`${this.apiUrl}/${id}/encuestas`);
  }

  obtenerEncuestadosPorEmpresaId(id: number): Observable<EncuestadoEmpresa[]> {
    return this.http.get<EncuestadoEmpresa[]>(`${this.apiUrl}/${id}/encuestados`);
  }
}
