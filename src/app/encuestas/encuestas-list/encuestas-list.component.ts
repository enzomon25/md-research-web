import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EncuestasService } from '../../core/services/encuestas.service';
import { ParametrosService } from '../../core/services/parametros.service';
import { Encuesta, Parametro, PaginacionRespuesta } from '../../core/models';

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
  tiposEncuesta = signal<Parametro[]>([]);
  tiposEmpresa = signal<any[]>([]);
  estados = signal<any[]>([]);
  creandoEncuesta = signal(false);
  
  // Fecha máxima (hoy)
  fechaHoy: string;
  
  // Filtros principales
  filtroRuc = '';
  filtroNombreEmpresa = '';
  filtroFechaEncuesta = '';
  filtroTamanoEmpresa = '';
  filtroTipoEmpresa = '';
  filtroEstado = '';
  
  // Filtros del drawer
  filtroFechaCreacionDesde = '';
  filtroFechaCreacionHasta = '';

  constructor(
    private encuestasService: EncuestasService,
    private parametrosService: ParametrosService,
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
    this.parametrosService.listarPorCategoria('ESTADO_ENCUESTA').subscribe({
      next: (estados: Parametro[]) => {
        this.estados.set(estados.map(e => ({
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
      { tipoEmpresaId: 1, descripcionTipoEmpresa: 'Privada' },
      { tipoEmpresaId: 2, descripcionTipoEmpresa: 'Pública' },
      { tipoEmpresaId: 3, descripcionTipoEmpresa: 'Mixta' }
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

    // Filtrar por tamaño de empresa
    if (this.filtroTamanoEmpresa) {
      encuestasFiltradas = encuestasFiltradas.filter(e => 
        e.empresa?.tamanoEmpresa === this.filtroTamanoEmpresa
      );
    }

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
    this.filtroTamanoEmpresa = '';
    this.filtroTipoEmpresa = '';
    this.filtroEstado = '';
    this.filtroFechaCreacionDesde = '';
    this.filtroFechaCreacionHasta = '';
    this.encuestas.set(this.encuestasSinFiltrar());
  }

  nuevaEncuesta(): void {
    this.mostrarModalTipo.set(true);
    this.parametrosService.listarPorCategoria('TIPO_ENCUESTA').subscribe({
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

  getEstadoClass(estadoValor: string): string {
    const estado = estadoValor.toLowerCase();
    
    if (estado.includes('registro')) {
      return 'estado-en-registro';
    }
    if (estado.includes('completa') || estado.includes('finalizada')) {
      return 'estado-completa';
    }
    if (estado.includes('cancelada') || estado.includes('anulada')) {
      return 'estado-cancelada';
    }
    if (estado.includes('revision') || estado.includes('pendiente')) {
      return 'estado-en-revision';
    }
    
    return 'estado-default';
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
