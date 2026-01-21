// ✅ REGLA 10: Imports organizados
// 1. Angular Core
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

// 2. Angular Router
import { ActivatedRoute, Router } from '@angular/router';

// 3. Services propios
import { EmpresasService } from '../../core/services/empresas.service';
import { EncuestasService } from '../../core/services/encuestas.service';
import { ObraEncuestaService } from '../../core/services/obra-encuesta.service';

// 4. Models e Interfaces
import { Empresa, Direccion, TipoEmpresa, Encuesta, PaginacionRespuesta } from '../../core/models';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { UserMenuComponent } from '../../shared/user-menu/user-menu.component';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { ESTADOS_ENCUESTA } from '../../core/constants';
import { TIPO_REFERENCIA } from '../../core/constants/tipo-referencia.constant';

// 5. Modales
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

type EmpresaDetalle = Empresa & {
  direccion?: Direccion | null;
  mediosContacto?: Array<{ tipoMedioContacto: string; valor: string }> | null;
};

@Component({
  selector: 'app-empresas-detail',
  standalone: true,
  imports: [CommonModule, SidebarComponent, UserMenuComponent, PageHeaderComponent, ConfirmDialogComponent],
  templateUrl: './empresas-detail.component.html',
  styleUrl: './empresas-detail.component.scss',
})
export class EmpresasDetailComponent implements OnInit {
  private empresasService = inject(EmpresasService);
  private encuestasService = inject(EncuestasService);
  private obraEncuestaService = inject(ObraEncuestaService);
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

  // Modal de confirmación de clonación
  mostrarModalClonar = signal(false);
  encuestaParaClonar = signal<Encuesta | null>(null);
  clonandoEncuesta = signal(false);

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

  abrirDialogoClonar(encuesta: Encuesta): void {
    this.encuestaParaClonar.set(encuesta);
    this.mostrarModalClonar.set(true);
  }

  cerrarDialogoClonar(): void {
    this.mostrarModalClonar.set(false);
    this.encuestaParaClonar.set(null);
    this.clonandoEncuesta.set(false);
  }

  confirmarClonar(): void {
    const encuesta = this.encuestaParaClonar();
    if (!encuesta || !encuesta.encuestaId) {
      return;
    }

    this.clonandoEncuesta.set(true);

    this.encuestasService.obtenerPorId(encuesta.encuestaId).subscribe({
      next: (detalle) => {
        const marcasValidas = (detalle.marcas || [])
          .map((marca: any) => ({
            marcaFabricanteId: marca.marcaFabricanteId,
            fabricanteId: marca.fabricanteId,
          }))
          .filter((marca: any) => marca.marcaFabricanteId && marca.fabricanteId);

        const payload: Partial<Encuesta> = {
          ...(detalle.encuestadoId && { encuestadoId: detalle.encuestadoId }),
          ...(detalle.empresaId && { empresaId: detalle.empresaId }),
          ...(detalle.tipoEncuesta && { tipoEncuesta: detalle.tipoEncuesta }),
          ...(detalle.concretoPremezclado !== undefined &&
            detalle.concretoPremezclado !== null && {
              concretoPremezclado: detalle.concretoPremezclado,
            }),
          ...(detalle.articulosConcreto !== undefined &&
            detalle.articulosConcreto !== null && {
              articulosConcreto: detalle.articulosConcreto,
            }),
          ...(detalle.tipoLugarCompra && { tipoLugarCompra: detalle.tipoLugarCompra }),
          ...(detalle.tipoCompra && { tipoCompra: detalle.tipoCompra }),
          ...(detalle.presentacionCompra && { presentacionCompra: detalle.presentacionCompra }),
          ...(detalle.cantidadPresentacionCompra &&
            detalle.cantidadPresentacionCompra.trim() !== '' && {
              cantidadPresentacionCompra: detalle.cantidadPresentacionCompra,
            }),
          ...(detalle.descCompra && { descCompra: detalle.descCompra }),
          ...(detalle.usoCemento && { usoCemento: detalle.usoCemento }),
          ...(detalle.motivoCompra && { motivoCompra: detalle.motivoCompra }),
          ...(detalle.deseoRegalo !== undefined &&
            detalle.deseoRegalo !== null && { deseoRegalo: detalle.deseoRegalo }),
          ...(detalle.fechaEncuesta && { fechaEncuesta: detalle.fechaEncuesta }),
          ...(detalle.precio !== undefined && detalle.precio !== null && {
            precio: detalle.precio,
          }),
          ...(detalle.comentarioCuantitativo &&
            detalle.comentarioCuantitativo.trim() !== '' && {
              comentarioCuantitativo: detalle.comentarioCuantitativo,
            }),
          ...(detalle.audioUrl && detalle.audioUrl.trim() !== '' && {
            audioUrl: detalle.audioUrl,
          }),
          marcas: marcasValidas,
        };

        this.encuestasService.guardar(payload).subscribe({
          next: (nuevaEncuesta) => {
            const obra = detalle.obra;
            const direccion = obra?.direccion;
            const puedeClonarObra =
              detalle.tipoEncuesta === 'CONSTRUCTORA' &&
              obra?.etapaObra &&
              obra?.fechaFinalizacionObra &&
              !!direccion?.codPais &&
              !!direccion?.codDepartamento &&
              !!direccion?.codProvincia &&
              !!direccion?.codDistrito &&
              !!nuevaEncuesta.encuestaId;

            if (puedeClonarObra) {
              const obraDto = {
                encuestaId: nuevaEncuesta.encuestaId!,
                etapaObra: obra!.etapaObra,
                fechaFinalizacionObra: obra!.fechaFinalizacionObra,
                ...(obra?.mixer && { mixer: obra.mixer }),
                ...(obra?.metraje && { metraje: obra.metraje }),
                ...(obra?.resistencia && { resistencia: obra.resistencia }),
                tipoReferencia: TIPO_REFERENCIA.OBRA,
                codPais: direccion!.codPais,
                codDepartamento: direccion!.codDepartamento,
                codProvincia: direccion!.codProvincia,
                codDistrito: direccion!.codDistrito,
                ...(direccion?.tipoVia && { tipoVia: direccion.tipoVia }),
                ...(direccion?.nombreVia && { nombreVia: direccion.nombreVia }),
                ...(direccion?.numeroVia && { numeroVia: direccion.numeroVia }),
                ...(direccion?.referencia && { referencia: direccion.referencia }),
              };

              this.obraEncuestaService.crear(obraDto).subscribe({
                next: () => {
                  this.finalizarClonado(nuevaEncuesta);
                },
                error: (errorObra) => {
                  console.error('Error al clonar datos de la obra:', errorObra);
                  this.finalizarClonado(nuevaEncuesta);
                  alert(
                    'Encuesta clonada, pero hubo un error al clonar los datos de la obra.',
                  );
                },
              });
              return;
            }

            if (detalle.tipoEncuesta === 'CONSTRUCTORA' && obra) {
              console.warn(
                'No se clonó la obra porque faltan datos de dirección o campos obligatorios.',
              );
            }

            this.finalizarClonado(nuevaEncuesta);
          },
          error: (err) => {
            this.clonandoEncuesta.set(false);
            console.error('Error al clonar encuesta:', err);
            alert('Error al clonar la encuesta. Por favor, intenta de nuevo.');
          },
        });
      },
      error: (err) => {
        this.clonandoEncuesta.set(false);
        console.error('Error al obtener detalles para clonar:', err);
        alert('Error al obtener la encuesta para clonar. Por favor, intenta de nuevo.');
      },
    });
  }

  private finalizarClonado(nuevaEncuesta: Encuesta): void {
    this.clonandoEncuesta.set(false);
    this.cerrarDialogoClonar();
    this.cargarEncuestasEmpresa();
    console.log('Encuesta clonada correctamente:', nuevaEncuesta);
    if (nuevaEncuesta.encuestaId) {
      const ruta = this.obtenerRutaCompleta(
        nuevaEncuesta.encuestaId,
        nuevaEncuesta.tipoEncuesta,
      );
      this.router.navigate(ruta);
    }
  }
}
