import { Component, signal, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EncuestasService } from '../../core/services/encuestas.service';
import { ParametrosService } from '../../core/services/parametros.service';
import { AuthService } from '../../core/services/auth.service';
import { ModulosService, Modulo } from '../../core/services/modulos.service';
import { Encuesta, Parametro, PaginacionRespuesta } from '../../core/models';
import { ESTADOS_ENCUESTA, CATEGORIAS_PARAMETROS } from '../../core/constants';

interface Estado {
  estadoId: number;
  descripcionEstado: string;
}

@Component({
  selector: 'app-encuestas-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './encuestas-list.component.html',
  styleUrl: './encuestas-list.component.css'
})
export class EncuestasListComponent implements OnInit {
  encuestas = signal<Encuesta[]>([]);
  encuestasSinFiltrar = signal<Encuesta[]>([]);
  paginaActual = signal(1);
  totalPaginas = signal(0);
  cargando = signal(false);
  mostrarModalTipo = signal(false);
  mostrarDrawer = signal(false);
  mostrarMenuUsuario = signal(false);
  mostrarMenuExportar = signal(false);
  tiposEncuesta = signal<Parametro[]>([]);
  estados = signal<Estado[]>([]);
  creandoEncuesta = signal(false);
  modulos = signal<Modulo[]>([]);
  
  // Constantes para el template
  readonly MODULOS_KEYS = { ENCUESTAS: 'ENCUESTAS' };
  
  // Fecha máxima (hoy)
  fechaHoy: string;
  
  // Filtros principales
  filtroRuc = '';
  filtroNombreEmpresa = '';
  filtroFechaEncuesta = '';
  filtroTipoEncuesta = '';
  filtroEstado: number | '' = '';
  
  // Filtros del drawer
  filtroUsuarioCreacion = '';
  filtroFechaCreacionDesde = '';
  filtroFechaCreacionHasta = '';

  constructor(
    private encuestasService: EncuestasService,
    private parametrosService: ParametrosService,
    private authService: AuthService,
    private modulosService: ModulosService,
    private router: Router
  ) {
    // Establecer fecha máxima como hoy en formato YYYY-MM-DD
    const hoy = new Date();
    this.fechaHoy = hoy.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.cargarEncuestas();
    this.cargarEstados();
    this.cargarTiposEncuesta();
    this.cargarModulos();
  }

  cargarModulos(): void {
    this.modulosService.obtenerModulosDisponibles().subscribe({
      next: (modulos) => {
        this.modulos.set(modulos);
      },
      error: (error) => {
        console.error('Error al cargar módulos:', error);
      }
    });
  }

  toggleDrawer(): void {
    this.mostrarDrawer.set(!this.mostrarDrawer());
  }

  cargarEncuestas(): void {
    this.cargando.set(true);
    
    // Construir objeto de filtros
    const filtros: any = {};
    
    if (this.filtroRuc) filtros.ruc = this.filtroRuc;
    if (this.filtroNombreEmpresa) filtros.razonSocial = this.filtroNombreEmpresa;
    if (this.filtroFechaEncuesta) filtros.fechaEncuesta = this.filtroFechaEncuesta;
    if (this.filtroTipoEncuesta) filtros.tipoEncuesta = this.filtroTipoEncuesta;
    if (this.filtroEstado) filtros.estadoId = this.filtroEstado;
    if (this.filtroUsuarioCreacion) filtros.usuarioCreacion = this.filtroUsuarioCreacion;
    if (this.filtroFechaCreacionDesde) filtros.fechaCreacionDesde = this.filtroFechaCreacionDesde;
    if (this.filtroFechaCreacionHasta) filtros.fechaCreacionHasta = this.filtroFechaCreacionHasta;

    this.encuestasService.listar(this.paginaActual(), 10, filtros).subscribe({
      next: (respuesta: PaginacionRespuesta<Encuesta>) => {
        this.encuestas.set(respuesta.data);
        this.encuestasSinFiltrar.set(respuesta.data);
        this.totalPaginas.set(respuesta.totalPaginas);
        this.cargando.set(false);
      },
      error: (error) => {
        console.error('Error al cargar encuestas:', error);
        this.cargando.set(false);
      }
    });
  }

  cargarEstados(): void {
    // Por ahora usar estados hardcodeados basados en la tabla estado del backend
    // TODO: Crear endpoint GET /estados en el backend
    this.estados.set([
      { estadoId: 1, descripcionEstado: 'En registro' },
      { estadoId: 2, descripcionEstado: 'En revisión' },
      { estadoId: 3, descripcionEstado: 'Transferido' },
      { estadoId: 4, descripcionEstado: 'En corrección' },
      { estadoId: 5, descripcionEstado: 'Aprobado' },
      { estadoId: 6, descripcionEstado: 'Observada' }
    ]);
  }

  cargarTiposEncuesta(): void {
    this.parametrosService.listarPorCategoria(CATEGORIAS_PARAMETROS.TIPO_ENCUESTA).subscribe({
      next: (tipos: Parametro[]) => {
        this.tiposEncuesta.set(tipos);
      },
      error: (error) => {
        console.error('Error al cargar tipos de encuesta:', error);
      }
    });
  }

  aplicarFiltros(): void {
    // Recargar datos desde el backend con los filtros
    this.paginaActual.set(1); // Resetear a la primera página
    this.cargarEncuestas();
  }

  aplicarFiltrosYCerrarDrawer(): void {
    this.aplicarFiltros();
    this.toggleDrawer();
  }

  limpiarFiltros(): void {
    this.filtroRuc = '';
    this.filtroNombreEmpresa = '';
    this.filtroFechaEncuesta = '';
    this.filtroTipoEncuesta = '';
    this.filtroEstado = '';
    this.filtroUsuarioCreacion = '';
    this.filtroFechaCreacionDesde = '';
    this.filtroFechaCreacionHasta = '';
    this.paginaActual.set(1);
    this.cargarEncuestas();
  }

  nuevaEncuesta(): void {
    this.mostrarModalTipo.set(true);
    this.parametrosService.listarPorCategoria(CATEGORIAS_PARAMETROS.TIPO_ENCUESTA).subscribe({
      next: (tipos: Parametro[]) => {
        this.tiposEncuesta.set(tipos);
      },
      error: (error) => {
        console.error('Error al cargar tipos de encuesta:', error);
      }
    });
  }

  cerrarModal(): void {
    this.mostrarModalTipo.set(false);
  }

  seleccionarTipo(tipo: Parametro): void {
    this.creandoEncuesta.set(true);
    
    // Crear encuesta con solo el tipo (dato mínimo)
    const nuevaEncuesta = {
      tipoEncuesta: tipo.llave
    };

    this.encuestasService.guardar(nuevaEncuesta as Encuesta).subscribe({
      next: (encuestaCreada) => {
        console.log('Encuesta creada:', encuestaCreada);
        this.cerrarModal();
        this.creandoEncuesta.set(false);
        // Navegar al formulario correspondiente según el tipo de encuesta
        const ruta = this.obtenerRutaCompleta(encuestaCreada.encuestaId!, tipo.llave);
        this.router.navigate(ruta);
      },
      error: (error) => {
        console.error('Error al crear encuesta:', error);
        this.creandoEncuesta.set(false);
        alert('Error al crear la encuesta. Por favor, intente nuevamente.');
      }
    });
  }

  /**
   * Obtiene la ruta completa con el sufijo según el tipo de encuesta
   */
  obtenerRutaCompleta(encuestaId: number, tipoEncuesta?: string): string[] {
    if (!tipoEncuesta) {
      // Si no se proporciona tipo, intentar obtenerlo de la encuesta
      const encuesta = this.encuestas().find(e => e.encuestaId === encuestaId);
      tipoEncuesta = encuesta?.tipoEncuesta;
    }

    switch (tipoEncuesta) {
      case 'INDUSTRIA':
        return ['/encuesta', encuestaId.toString(), 'industrias'];
      case 'CONSTRUCTORA':
        return ['/encuesta', encuestaId.toString(), 'obras'];
      default:
        return ['/encuesta', encuestaId.toString(), 'industrias'];
    }
  }

  cambiarPagina(pagina: number): void {
    this.paginaActual.set(pagina);
    this.cargarEncuestas();
  }

  mostrarColumnaUsuarioCreador(): boolean {
    return this.encuestas().some(encuesta => !!encuesta.usuarioCreacion);
  }

  obtenerNombreUsuario(): string {
    const userData = this.authService.getUserData();
    return userData?.nombres || 'Usuario';
  }

  obtenerRolUsuario(): string {
    return this.authService.getRolDescripcion();
  }

  esEncuestador(): boolean {
    const rol = this.authService.obtenerRol();
    return rol === 'ENCUESTADOR';
  }

  obtenerInicialesUsuario(): string {
    const userData = this.authService.getUserData();
    if (!userData) return 'U';
    
    const inicialNombre = userData.nombres?.charAt(0).toUpperCase() || '';
    const inicialApellido = userData.apepat?.charAt(0).toUpperCase() || '';
    
    return inicialNombre + inicialApellido;
  }

  obtenerNombreCompletoUsuario(): string {
    const userData = this.authService.getUserData();
    if (!userData) return 'Usuario';
    
    return `${userData.nombres} ${userData.apepat}`.trim();
  }

  obtenerEmailUsuario(): string {
    const userData = this.authService.getUserData();
    return userData?.username || '';
  }

  toggleMenuUsuario(): void {
    this.mostrarMenuUsuario.set(!this.mostrarMenuUsuario());
  }

  toggleMenuExportar(): void {
    this.mostrarMenuExportar.set(!this.mostrarMenuExportar());
  }

  exportar(formato: string, tipoEncuesta?: string): void {
    this.mostrarMenuExportar.set(false);
    
    // Construir los mismos filtros que se usan en listar
    const filtros: any = {
      pagina: 1,
      limite: 999999, // Sin paginación para exportar todo
    };

    if (this.filtroRuc) filtros.ruc = this.filtroRuc;
    if (this.filtroNombreEmpresa) filtros.razonSocial = this.filtroNombreEmpresa;
    if (this.filtroFechaEncuesta) filtros.fechaEncuesta = this.filtroFechaEncuesta;
    
    // Para Excel, el tipo de encuesta es obligatorio (viene del dropdown)
    // Para PDF/CSV, se usa el filtro actual si existe
    if (formato === 'excel' && tipoEncuesta) {
      filtros.tipoEncuesta = tipoEncuesta;
    } else if (this.filtroTipoEncuesta) {
      filtros.tipoEncuesta = this.filtroTipoEncuesta;
    }
    
    if (this.filtroEstado !== '') filtros.estadoId = this.filtroEstado;
    if (this.filtroUsuarioCreacion) filtros.usuarioCreacion = this.filtroUsuarioCreacion;
    if (this.filtroFechaCreacionDesde) filtros.fechaCreacionDesde = this.filtroFechaCreacionDesde;
    if (this.filtroFechaCreacionHasta) filtros.fechaCreacionHasta = this.filtroFechaCreacionHasta;
    filtros.formato = formato;

    this.encuestasService.exportar(filtros).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const extension = formato === 'excel' ? 'xlsx' : formato === 'pdf' ? 'pdf' : 'csv';
        const fecha = new Date().toISOString().split('T')[0];
        const tipoSufijo = tipoEncuesta ? `_${tipoEncuesta.toLowerCase()}` : '';
        a.download = `encuestas${tipoSufijo}_${fecha}.${extension}`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (error: any) => {
        console.error('Error al exportar:', error);
        alert('Error al exportar los datos. Por favor, intente nuevamente.');
      }
    });
  }

  cerrarSesion(): void {
    // Agregar clase de fade-out
    const layoutContainer = document.querySelector('.layout-container');
    if (layoutContainer) {
      layoutContainer.classList.add('fade-out');
    }

    // Esperar la animación antes de cerrar sesión
    setTimeout(() => {
      this.authService.logout().subscribe({
        next: () => {
          this.router.navigate(['/inicio-sesion']);
        },
        error: (error) => {
          console.error('Error al cerrar sesión:', error);
          // Aunque falle el request, redirigimos igual
          this.router.navigate(['/inicio-sesion']);
        }
      });
    }, 300);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const userMenuContainer = target.closest('.user-menu-container');
    const exportMenuContainer = target.closest('.export-menu-container');
    
    if (!userMenuContainer && this.mostrarMenuUsuario()) {
      this.mostrarMenuUsuario.set(false);
    }

    if (!exportMenuContainer && this.mostrarMenuExportar()) {
      this.mostrarMenuExportar.set(false);
    }
  }

  getEstadoClass(estadoId: number | undefined): string {
    if (!estadoId) {
      return 'estado-default';
    }
    
    switch (estadoId) {
      case ESTADOS_ENCUESTA.EN_REGISTRO:
        return 'estado-en-registro';
      case ESTADOS_ENCUESTA.EN_REVISION:
        return 'estado-en-revision';
      case ESTADOS_ENCUESTA.TRANSFERIDO:
        return 'estado-completa';
      case ESTADOS_ENCUESTA.EN_CORRECCION:
        return 'estado-en-correccion';
      case ESTADOS_ENCUESTA.APROBADO:
        return 'estado-aprobado';
      case ESTADOS_ENCUESTA.OBSERVADA:
        return 'estado-observada';
      default:
        return 'estado-default';
    }
  }

  reanudarEncuesta(encuestaId: number): void {
    const encuesta = this.encuestas().find(e => e.encuestaId === encuestaId);
    const ruta = this.obtenerRutaCompleta(encuestaId, encuesta?.tipoEncuesta);
    this.router.navigate(ruta);
  }

  verEncuesta(encuestaId: number): void {
    const encuesta = this.encuestas().find(e => e.encuestaId === encuestaId);
    const ruta = this.obtenerRutaCompleta(encuestaId, encuesta?.tipoEncuesta);
    this.router.navigate(ruta);
  }

  revisarEncuesta(encuestaId: number): void {
    const encuesta = this.encuestas().find(e => e.encuestaId === encuestaId);
    const ruta = this.obtenerRutaCompleta(encuestaId, encuesta?.tipoEncuesta);
    this.router.navigate(ruta);
  }

  editarEncuesta(encuestaId: number): void {
    const encuesta = this.encuestas().find(e => e.encuestaId === encuestaId);
    const ruta = this.obtenerRutaCompleta(encuestaId, encuesta?.tipoEncuesta);
    this.router.navigate(ruta);
  }
}
