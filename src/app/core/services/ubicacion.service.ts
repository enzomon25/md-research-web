import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UbicacionService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  listarPaises(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pais`);
  }

  listarDepartamentos(codPais: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/departamento`, { params: { codPais } });
  }

  listarProvincias(codDepartamento: string, codPais: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/provincias`, { params: { codDepartamento, codPais } });
  }

  listarDistritos(codProvincia: string, codDepartamento: string, codPais: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/distritos`, { params: { codProvincia, codDepartamento, codPais } });
  }
}
