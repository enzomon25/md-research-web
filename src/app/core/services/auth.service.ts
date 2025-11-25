import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface Rol {
  rolId: number;
  descripcion: string;
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaModificacion: string;
  usuarioModificacion: string;
  indActivo: number;
}

export interface LoginResponse {
  userUuid: string;
  nombres: string;
  apepat: string;
  apemat: string;
  numdoc: string;
  tipodoc: string;
  username: string;
  roles?: Rol[];
  token: string;
  fechaExpiracion: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/usuarios`;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'user_data';

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/inicio-sesion`, credentials).pipe(
      tap(response => {
        // Guardar token y datos del usuario en localStorage
        this.setToken(response.token);
        this.setUserData(response);
      })
    );
  }

  logout(): Observable<any> {
    // Llamar al endpoint de cierre de sesión
    return this.http.post(`${this.apiUrl}/cierre-sesion`, {}).pipe(
      tap(() => {
        // Limpiar localStorage
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUserData(): LoginResponse | null {
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    // Verificar si el token ha expirado
    const userData = this.getUserData();
    if (userData && userData.fechaExpiracion) {
      const expirationDate = new Date(userData.fechaExpiracion);
      return expirationDate > new Date();
    }

    return false;
  }

  getRolDescripcion(): string {
    const userData = this.getUserData();
    if (userData?.roles && userData.roles.length > 0) {
      return userData.roles[0].descripcion;
    }
    return 'Usuario';
  }

  obtenerRol(): string {
    const userData = this.getUserData();
    if (userData?.roles && userData.roles.length > 0) {
      // Retornar la descripción en mayúsculas para coincidir con las llaves
      return userData.roles[0].descripcion.toUpperCase();
    }
    return '';
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private setUserData(userData: LoginResponse): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(userData));
  }
}
