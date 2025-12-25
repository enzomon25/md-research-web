import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface CargaMasiva {
  cargaMasivaId: number;
  userId: number;
  tipoEncuesta: string;
  nombreArchivo: string;
  rutaArchivoOriginal: string | null;
  rutaArchivoResultado: string | null;
  estado: string;
  totalRegistros: number;
  registrosExitosos: number;
  registrosFallidos: number;
  mensajeError: string | null;
  fechaInicio: string;
  fechaFin: string | null;
  indActivo: number;
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaModificacion: string | null;
  usuarioModificacion: string | null;
}

export interface PaginacionCargaMasiva {
  data: CargaMasiva[];
  paginaActual: number;
  totalPaginas: number;
  totalRegistros: number;
  registrosPorPagina: number;
}

export interface RespuestaUpload {
  mensaje: string;
  cargaMasivaId: number;
  estado: string;
}

@Injectable({
  providedIn: 'root',
})
export class CargaMasivaService {
  private apiUrl = `${environment.apiUrl}/carga-masiva`;

  constructor(private http: HttpClient) {}

  subirArchivo(archivo: File, tipoEncuesta: string): Observable<RespuestaUpload> {
    const formData = new FormData();
    formData.append('file', archivo);
    formData.append('tipoEncuesta', tipoEncuesta);

    return this.http.post<RespuestaUpload>(`${this.apiUrl}/upload`, formData);
  }

  listar(
    pagina: number = 1,
    limite: number = 10,
    tipoEncuesta?: string
  ): Observable<PaginacionCargaMasiva> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('limite', limite.toString());

    if (tipoEncuesta) {
      params = params.set('tipoEncuesta', tipoEncuesta);
    }

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(response => ({
        data: response.data.map((item: any) => ({
          cargaMasivaId: item.carga_masiva_id,
          userId: item.user_id,
          tipoEncuesta: item.tipo_encuesta,
          nombreArchivo: item.nombre_archivo,
          rutaArchivoOriginal: item.ruta_archivo_original,
          rutaArchivoResultado: item.ruta_archivo_resultado,
          estado: item.estado,
          totalRegistros: item.total_registros,
          registrosExitosos: item.registros_exitosos,
          registrosFallidos: item.registros_fallidos,
          mensajeError: item.mensaje_error,
          fechaInicio: item.fecha_inicio,
          fechaFin: item.fecha_fin,
          indActivo: item.ind_activo,
          fechaCreacion: item.fecha_creacion,
          usuarioCreacion: item.usuario_creacion,
          fechaModificacion: item.fecha_modificacion,
          usuarioModificacion: item.usuario_modificacion,
        })),
        paginaActual: response.metadata.pagina,
        totalPaginas: response.metadata.totalPaginas,
        totalRegistros: response.metadata.total,
        registrosPorPagina: response.metadata.limite,
      }))
    );
  }

  obtenerDetalle(cargaMasivaId: number): Observable<CargaMasiva> {
    return this.http.get<CargaMasiva>(`${this.apiUrl}/${cargaMasivaId}`);
  }

  obtenerDetalles(cargaMasivaId: number): Observable<{ detalles: any[] }> {
    return this.http.get<{ detalles: any[] }>(`${this.apiUrl}/${cargaMasivaId}/detalles`);
  }

  descargarResultado(cargaMasivaId: number, nombreArchivo: string): void {
    const url = `${this.apiUrl}/${cargaMasivaId}/descargar`;
    
    // Crear elemento <a> temporal para descargar
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
