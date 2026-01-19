import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CargaMasivaService, CargaMasiva, RespuestaUpload } from '../core/services/carga-masiva.service';
import { ParametrosService } from '../core/services/parametros.service';
import { AuthService } from '../core/services/auth.service';
import { ModulosService, Modulo } from '../core/services/modulos.service';
import { Parametro } from '../core/models';

@Component({
  selector: 'app-carga-masiva',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './carga-masiva.component.html',
  styleUrl: './carga-masiva.component.css'
})
export class CargaMasivaComponent implements OnInit {
  cargas = signal<CargaMasiva[]>([]);
  paginaActual = signal(1);
  totalPaginas = signal(0);
  cargando = signal(false);
  subiendo = signal(false);
  mostrarMenuUsuario = signal(false);
  tiposEncuesta = signal<Parametro[]>([]);
  modulos = signal<Modulo[]>([]);
  
  // Archivo seleccionado
  archivoSeleccionado: File | null = null;
  tipoEncuestaSeleccionado = 'CONSTRUCTORA';
  errorArchivo = '';
  
  // Filtro
  filtroTipoEncuesta = '';
  
  // Constantes
  readonly MODULOS_KEYS = { ENCUESTAS: 'ENCUESTAS', CARGA_MASIVA: 'CARGA_MASIVA' };
  readonly LIMITE_REGISTROS = 10;

  // Signals para modal
  mostrarModal = signal(false);
  mensajeModal = signal('');
  tipoModal = signal<'success' | 'error'>('success');

  // Modal de detalles
  mostrarModalDetalles = signal(false);
  detallesCarga = signal<any[]>([]);
  cargaSeleccionada = signal<CargaMasiva | null>(null);
  cargandoDetalles = signal(false);

  constructor(
    private cargaMasivaService: CargaMasivaService,
    private parametrosService: ParametrosService,
    private authService: AuthService,
    private modulosService: ModulosService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarCargas();
    this.cargarTiposEncuesta();
    this.cargarModulos();
  }

  cargarModulos(): void {
    this.modulosService.obtenerModulosDisponibles().subscribe({
      next: (modulos: Modulo[]) => {
        this.modulos.set(modulos);
      },
      error: (error: unknown) => {
        console.error('Error al cargar módulos:', error);
      }
    });
  }

  cargarTiposEncuesta(): void {
    this.parametrosService.listarPorCategoria('TIPO_ENCUESTA').subscribe({
      next: (tipos: Parametro[]) => {
        this.tiposEncuesta.set(tipos);
      },
      error: (error: unknown) => {
        console.error('Error al cargar tipos de encuesta:', error);
      }
    });
  }

  cargarCargas(): void {
    this.cargando.set(true);
    this.cargaMasivaService.listar(
      this.paginaActual(),
      this.LIMITE_REGISTROS,
      this.filtroTipoEncuesta || undefined
    ).subscribe({
      next: (respuesta) => {
        this.cargas.set(respuesta.data);
        this.totalPaginas.set(respuesta.totalPaginas);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        console.error('Error al cargar cargas:', error);
        this.cargando.set(false);
      }
    });
  }

  recargarCargas(): void {
    this.cargarCargas();
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const archivo = input.files[0];
      
      // Validar extensión
      if (!archivo.name.endsWith('.xlsx')) {
        this.errorArchivo = 'Solo se permiten archivos .xlsx';
        this.archivoSeleccionado = null;
        return;
      }
      
      // Validar tamaño (10MB)
      if (archivo.size > 10 * 1024 * 1024) {
        this.errorArchivo = 'El archivo no debe superar los 10MB';
        this.archivoSeleccionado = null;
        return;
      }
      
      this.errorArchivo = '';
      this.archivoSeleccionado = archivo;
    }
  }

  subirArchivo(): void {
    if (!this.archivoSeleccionado) {
      this.errorArchivo = 'Debe seleccionar un archivo';
      return;
    }
    
    // Crear una copia del archivo para evitar ERR_UPLOAD_FILE_CHANGED
    const archivoACopiar = this.archivoSeleccionado;
    const archivoClonado = new File([archivoACopiar], archivoACopiar.name, {
      type: archivoACopiar.type,
      lastModified: archivoACopiar.lastModified,
    });
    
    this.subiendo.set(true);
    this.errorArchivo = '';
    
    this.cargaMasivaService.subirArchivo(
      archivoClonado,
      this.tipoEncuestaSeleccionado
    ).subscribe({
      next: (respuesta: RespuestaUpload) => {
        this.subiendo.set(false);
        this.archivoSeleccionado = null;
        // Resetear input file
        const input = document.getElementById('archivo-input') as HTMLInputElement;
        if (input) input.value = '';
        
        // Mostrar modal de éxito
        this.tipoModal.set('success');
        this.mensajeModal.set(respuesta.mensaje || 'Archivo subido correctamente');
        this.mostrarModal.set(true);
        
        this.cargarCargas(); // Recargar lista
      },
      error: (error: { error?: { message?: string } }) => {
        console.error('Error al subir archivo:', error);
        this.subiendo.set(false);
        
        // Mostrar modal de error
        this.tipoModal.set('error');
        this.mensajeModal.set(error.error?.message || 'Error al subir archivo');
        this.mostrarModal.set(true);
      }
    });
  }

  descargarResultado(carga: CargaMasiva): void {
    if (!carga.rutaArchivoResultado) {
      alert('No hay archivo de resultado disponible');
      return;
    }
    
    const nombreArchivo = `resultado_${carga.nombreArchivo}`;
    this.cargaMasivaService.descargarResultado(carga.cargaMasivaId, nombreArchivo);
  }

  verDetalles(carga: CargaMasiva): void {
    this.cargaSeleccionada.set(carga);
    this.mostrarModalDetalles.set(true);
    this.cargandoDetalles.set(true);

    this.cargaMasivaService.obtenerDetalles(carga.cargaMasivaId).subscribe({
      next: (respuesta) => {
        this.detallesCarga.set(respuesta.detalles);
        this.cargandoDetalles.set(false);
      },
      error: (error: unknown) => {
        console.error('Error al cargar detalles:', error);
        this.cargandoDetalles.set(false);
        this.cerrarModalDetalles();
        this.tipoModal.set('error');
        this.mensajeModal.set('Error al cargar los detalles de la carga');
        this.mostrarModal.set(true);
      }
    });
  }

  cerrarModalDetalles(): void {
    this.mostrarModalDetalles.set(false);
    this.detallesCarga.set([]);
    this.cargaSeleccionada.set(null);
  }

  cerrarModal(): void {
    this.mostrarModal.set(false);
    this.mensajeModal.set('');
  }

  aplicarFiltros(): void {
    this.paginaActual.set(1);
    this.cargarCargas();
  }

  limpiarFiltros(): void {
    this.filtroTipoEncuesta = '';
    this.paginaActual.set(1);
    this.cargarCargas();
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.paginaActual.set(pagina);
      this.cargarCargas();
    }
  }

  obtenerEstadoBadge(estado: string): string {
    switch (estado) {
      case 'COMPLETADO':
        return 'badge-success';
      case 'PROCESANDO':
        return 'badge-info';
      case 'ERROR':
        return 'badge-danger';
      case 'PARCIAL':
        return 'badge-warning';
      default:
        return 'badge-secondary';
    }
  }

  formatearFecha(fecha: string | null): string {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  obtenerNombreUsuario(): string {
    const userData = this.authService.getUserData();
    return userData ? `${userData.nombres} ${userData.apepat}`.trim() : 'Usuario';
  }

  obtenerRolUsuario(): string {
    return this.authService.getRolDescripcion();
  }

  cerrarSesion(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/inicio-sesion']);
      },
      error: () => {
        // Cerrar sesión localmente aunque falle el servidor
        this.router.navigate(['/inicio-sesion']);
      }
    });
  }

  toggleMenuUsuario(): void {
    this.mostrarMenuUsuario.set(!this.mostrarMenuUsuario());
  }

  navegarAEncuestas(): void {
    this.router.navigate(['/encuestas']);
  }

  navegarACargaMasiva(): void {
    // Ya estamos en carga masiva, no hacer nada
  }

  navegarAModulo(ruta: string): void {
    this.router.navigate([ruta]);
  }

  esModuloActivo(ruta: string): boolean {
    return this.router.url === ruta;
  }

  esRutaActiva(ruta: string): boolean {
    return this.router.url === ruta;
  }

  esEncuestador(): boolean {
    const rol = this.authService.obtenerRol();
    return rol === 'ENCUESTADOR';
  }

  esAdministrador(): boolean {
    return this.authService.getRolDescripcion() === 'Administrador';
  }

  obtenerExitosos(): number {
    return this.detallesCarga().filter(d => d.estado === 'EXITOSO').length;
  }

  obtenerErrores(): number {
    return this.detallesCarga().filter(d => d.estado === 'ERROR').length;
  }
}
