// ✅ REGLA 10: Imports organizados
// 1. Angular Core
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

// 2. Angular Router
import { ActivatedRoute, Router } from '@angular/router';

// 3. Services propios
import { EmpresasService } from '../../core/services/empresas.service';
import { EncuestasService } from '../../core/services/encuestas.service';

// 4. Models e Interfaces
import { Empresa, Direccion, TipoEmpresa, Encuesta, PaginacionRespuesta } from '../../core/models';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { UserMenuComponent } from '../../shared/user-menu/user-menu.component';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { ESTADOS_ENCUESTA } from '../../core/constants';

type EmpresaDetalle = Empresa & {
  direccion?: Direccion | null;
  mediosContacto?: Array<{ tipoMedioContacto: string; valor: string }> | null;
};

@Component({
  selector: 'app-empresas-detail',
  standalone: true,
  imports: [CommonModule, SidebarComponent, UserMenuComponent, PageHeaderComponent],
  templateUrl: './empresas-detail.component.html',
  styleUrl: './empresas-detail.component.scss',
})
export class EmpresasDetailComponent implements OnInit {
  private empresasService = inject(EmpresasService);
  private encuestasService = inject(EncuestasService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  empresa = signal<EmpresaDetalle | null>(null);
  tiposEmpresa = signal<TipoEmpresa[]>([]);
  cargando = signal(false);
  error = signal<string | null>(null);
  empresaId = signal<number | null>(null);

  encuestas = signal<Encuesta[]>([]);
  encuestasCargando = signal(false);
  encuestasError = signal<string | null>(null);
  encuestasPagina = signal(1);
  encuestasTotalPaginas = signal(0);
  encuestasTotal = signal(0);
  encuestasLimite = 10;

  ngOnInit(): void {
    this.cargarTiposEmpresa();
    const empresaId = this.obtenerEmpresaId();
    if (!empresaId) {
      this.error.set('ID de empresa inválido.');
      return;
    }
    this.empresaId.set(empresaId);
    this.cargarDetalle(empresaId);
    this.cargarEncuestasEmpresa();
  }

  cargarDetalle(empresaId: number): void {
    this.cargando.set(true);
    this.error.set(null);

    this.empresasService.obtenerPorId(empresaId).subscribe({
      next: (respuesta) => {
        this.empresa.set(respuesta as EmpresaDetalle);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar detalle de empresa:', err);
        this.error.set('No se pudo cargar el detalle de la empresa.');
        this.cargando.set(false);
      },
    });
  }

  cargarEncuestasEmpresa(): void {
    const empresaId = this.empresaId();
    if (!empresaId) {
      return;
    }

    this.encuestasCargando.set(true);
    this.encuestasError.set(null);

    this.encuestasService
      .listar(this.encuestasPagina(), this.encuestasLimite, {
        empresaId,
        estadoId: ESTADOS_ENCUESTA.APROBADO.toString(),
      })
      .subscribe({
        next: (respuesta: PaginacionRespuesta<Encuesta>) => {
          this.encuestas.set(respuesta.data);
          this.encuestasTotalPaginas.set(respuesta.totalPaginas);
          this.encuestasTotal.set(respuesta.total);
          this.encuestasCargando.set(false);
        },
        error: (err) => {
          console.error('Error al cargar encuestas de la empresa:', err);
          this.encuestasError.set('No se pudo cargar el listado de encuestas.');
          this.encuestasCargando.set(false);
        },
      });
  }

  cambiarPaginaEncuestas(pagina: number): void {
    if (pagina >= 1 && pagina <= this.encuestasTotalPaginas()) {
      this.encuestasPagina.set(pagina);
      this.cargarEncuestasEmpresa();
    }
  }

  cargarTiposEmpresa(): void {
    this.empresasService.listarTipos().subscribe({
      next: (tipos) => {
        this.tiposEmpresa.set(tipos);
      },
      error: (err) => {
        console.error('Error al cargar tipos de empresa:', err);
      },
    });
  }

  volverListado(): void {
    this.router.navigate(['/empresas']);
  }

  obtenerNombreTipoEmpresa(tipoEmpresaId?: number): string {
    if (!tipoEmpresaId) return 'N/A';
    const tipo = this.tiposEmpresa().find((t) => t.tipoEmpresaId === tipoEmpresaId);
    return tipo ? tipo.descripcionTipoEmpresa : 'N/A';
  }

  obtenerEmpresaId(): number | null {
    const idParam = this.route.snapshot.paramMap.get('id');
    const empresaId = idParam ? Number(idParam) : NaN;
    return Number.isNaN(empresaId) || empresaId <= 0 ? null : empresaId;
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

  obtenerRutaCompleta(encuestaId: number, tipoEncuesta?: string): string[] {
    if (!tipoEncuesta) {
      const encuesta = this.encuestas().find((e) => e.encuestaId === encuestaId);
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

  reanudarEncuesta(encuestaId: number): void {
    const encuesta = this.encuestas().find((e) => e.encuestaId === encuestaId);
    const ruta = this.obtenerRutaCompleta(encuestaId, encuesta?.tipoEncuesta);
    this.router.navigate(ruta);
  }

  revisarEncuesta(encuestaId: number): void {
    const encuesta = this.encuestas().find((e) => e.encuestaId === encuestaId);
    const ruta = this.obtenerRutaCompleta(encuestaId, encuesta?.tipoEncuesta);
    this.router.navigate(ruta);
  }

  editarEncuesta(encuestaId: number): void {
    const encuesta = this.encuestas().find((e) => e.encuestaId === encuestaId);
    const ruta = this.obtenerRutaCompleta(encuestaId, encuesta?.tipoEncuesta);
    this.router.navigate(ruta);
  }
}
