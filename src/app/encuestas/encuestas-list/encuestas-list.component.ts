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

interface TipoEmpresa {
  tipoEmpresaId: number;
  descripcionTipoEmpresa: string;
}

interface Estado {
  estadoId: string;
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
  tiposEncuesta = signal<Parametro[]>([]);
  tiposEmpresa = signal<TipoEmpresa[]>([]);
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
  // filtroTamanoEmpresa eliminado
  filtroTipoEmpresa = '';
  filtroEstado = '';
  
  // Filtros del drawer
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
    this.cargarTiposEmpresa();
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
    this.encuestasService.listar(this.paginaActual(), 10).subscribe({
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
    this.parametrosService.listarPorCategoria(CATEGORIAS_PARAMETROS.ESTADO_ENCUESTA).subscribe({
      next: (estados: Parametro[]) => {
        this.estados.set(estados.map((e): Estado => ({
          estadoId: e.llave,
          descripcionEstado: e.valor
        })));
      },
      error: (error) => {
        console.error('Error al cargar estados:', error);
      }
    });
  }

  cargarTiposEmpresa(): void {
    // Cargar tipos de empresa del servicio correspondiente
    // Por ahora, definir tipos estáticos si no existe el servicio
    this.tiposEmpresa.set([
      { tipoEmpresaId: 1, descripcionTipoEmpresa: 'Privada' } as TipoEmpresa,
      { tipoEmpresaId: 2, descripcionTipoEmpresa: 'Pública' } as TipoEmpresa,
      { tipoEmpresaId: 3, descripcionTipoEmpresa: 'Mixta' } as TipoEmpresa
    ]);
  }

  aplicarFiltros(): void {
    let encuestasFiltradas = [...this.encuestasSinFiltrar()];

    // Filtrar por RUC
    if (this.filtroRuc) {
      encuestasFiltradas = encuestasFiltradas.filter(e => 
        e.empresa?.ruc?.includes(this.filtroRuc)
      );
    }

    // Filtrar por nombre de empresa
    if (this.filtroNombreEmpresa) {
      const nombre = this.filtroNombreEmpresa.toLowerCase();
      encuestasFiltradas = encuestasFiltradas.filter(e => 
        e.empresa?.razonSocial?.toLowerCase().includes(nombre)
      );
    }

    // Filtrar por fecha de encuesta
    if (this.filtroFechaEncuesta) {
      encuestasFiltradas = encuestasFiltradas.filter(e => 
        e.fechaEncuesta === this.filtroFechaEncuesta
      );
    }

    // Eliminado: filtro por tamaño de empresa

    // Filtrar por tipo de empresa
    if (this.filtroTipoEmpresa) {
      encuestasFiltradas = encuestasFiltradas.filter(e => 
        e.empresa?.tipoEmpresaId?.toString() === this.filtroTipoEmpresa
      );
    }

    // Filtrar por estado
    if (this.filtroEstado) {
      encuestasFiltradas = encuestasFiltradas.filter(e => 
        e.estadoId?.toString() === this.filtroEstado
      );
    }

    // Filtrar por rango de fecha de creación (drawer)
    if (this.filtroFechaCreacionDesde) {
      encuestasFiltradas = encuestasFiltradas.filter(e => 
        e.fechaCreacion && e.fechaCreacion >= this.filtroFechaCreacionDesde
      );
    }

    if (this.filtroFechaCreacionHasta) {
      encuestasFiltradas = encuestasFiltradas.filter(e => 
        e.fechaCreacion && e.fechaCreacion <= this.filtroFechaCreacionHasta
      );
    }

    this.encuestas.set(encuestasFiltradas);
  }

  limpiarFiltros(): void {
    this.filtroRuc = '';
    this.filtroNombreEmpresa = '';
    this.filtroFechaEncuesta = '';
    // this.filtroTamanoEmpresa = '';
    this.filtroTipoEmpresa = '';
    this.filtroEstado = '';
    this.filtroFechaCreacionDesde = '';
    this.filtroFechaCreacionHasta = '';
    this.encuestas.set(this.encuestasSinFiltrar());
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
        // Navegar al formulario con el ID de la encuesta creada
        this.router.navigate(['/encuestas', encuestaCreada.encuestaId]);
      },
      error: (error) => {
        console.error('Error al crear encuesta:', error);
        this.creandoEncuesta.set(false);
        alert('Error al crear la encuesta. Por favor, intente nuevamente.');
      }
    });
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
    
    if (!userMenuContainer && this.mostrarMenuUsuario()) {
      this.mostrarMenuUsuario.set(false);
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
    this.router.navigate(['/encuestas', encuestaId]);
  }

  verEncuesta(encuestaId: number): void {
    this.router.navigate(['/encuestas', encuestaId]);
  }

  revisarEncuesta(encuestaId: number): void {
    this.router.navigate(['/encuestas', encuestaId]);
  }

  editarEncuesta(encuestaId: number): void {
    this.router.navigate(['/encuestas', encuestaId]);
  }
}
