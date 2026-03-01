// 1. Angular Core
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// 2. Angular Router
import { ActivatedRoute, Router } from '@angular/router';

// 3. Services propios
import { EmpresasService } from '../../core/services/empresas.service';
import { EncuestasService } from '../../core/services/encuestas.service';
import { EncuestadosService } from '../../core/services/encuestados.service';
import { ObraEncuestaService } from '../../core/services/obra-encuesta.service';
import { UbicacionService } from '../../core/services/ubicacion.service';
import { AuthService } from '../../core/services/auth.service';

// 4. Models e Interfaces
import { Empresa, Direccion, TipoEmpresa, Encuesta, Encuestado, PaginacionRespuesta } from '../../core/models';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { UserMenuComponent } from '../../shared/user-menu/user-menu.component';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { ESTADOS_ENCUESTA } from '../../core/constants';
import { ROLES } from '../../core/constants/roles.constants';
import { TIPO_REFERENCIA } from '../../core/constants/tipo-referencia.constant';

// 5. Modales
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

type EmpresaDetalle = Empresa & {
  direccion?: Direccion | null;
  mediosContacto?: Array<{ tipoMedioContacto: string; valor: string }> | null;
};

type Pais = { paisId: number; descPais: string; codPais: string };
type Departamento = { departamentoId: number; descDepartamento: string; codPais: string; codDepartamento: string };
type Provincia = { provinciaId: number; descProvincia: string; codPais: string; codDepartamento: string; codProvincia: string };
type Distrito = { distritoId: number; descDistrito: string; codPais: string; codDepartamento: string; codProvincia: string; codDistrito: string };

@Component({
  selector: 'app-empresas-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, UserMenuComponent, PageHeaderComponent, ConfirmDialogComponent],
  templateUrl: './empresas-detail.component.html',
  styleUrl: './empresas-detail.component.scss',
})
export class EmpresasDetailComponent implements OnInit {
  private empresasService = inject(EmpresasService);
  private encuestasService = inject(EncuestasService);
  private encuestadosService = inject(EncuestadosService);
  private obraEncuestaService = inject(ObraEncuestaService);
  private ubicacionService = inject(UbicacionService);
  private authService = inject(AuthService);
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

  encuestados = signal<Encuestado[]>([]);
  encuestadosCargando = signal(false);

  get esEncuestador(): boolean {
    return this.authService.getRolDescripcion() === ROLES.ENCUESTADOR;
  }

  puedeVerEncuesta(estadoId: number): boolean {
    if (!this.esEncuestador) return true;
    return estadoId === ESTADOS_ENCUESTA.APROBADO || estadoId === ESTADOS_ENCUESTA.TRANSFERIDO;
  }

  // Modal de confirmación de clonación
  mostrarModalClonar = signal(false);
  encuestaParaClonar = signal<Encuesta | null>(null);
  clonandoEncuesta = signal(false);

  // Modo edición
  modoEdicion = signal(false);
  guardandoCambios = signal(false);
  errorEdicion = signal<string | null>(null);
  exitoEdicion = signal<string | null>(null);

  formEdicion: {
    razonSocial: string;
    ruc: string;
    tipoEmpresaId: number | null;
    tamanoEmpresaTop10k: string;
    actividadEconomica: string;
    direccion: {
      direc: string;
      codPais: string;
      codDepartamento: string;
      codProvincia: string;
      codDistrito: string;
      tipoVia: string;
      nombreVia: string;
      numeroVia: string;
      referencia: string;
    };
  } = {
    razonSocial: '',
    ruc: '',
    tipoEmpresaId: null,
    tamanoEmpresaTop10k: '',
    actividadEconomica: '',
    direccion: {
      direc: '',
      codPais: '',
      codDepartamento: '',
      codProvincia: '',
      codDistrito: '',
      tipoVia: '',
      nombreVia: '',
      numeroVia: '',
      referencia: '',
    },
  };

  // Catálogos de ubigeo para el formulario de edición
  paises: Pais[] = [];
  departamentos: Departamento[] = [];
  provincias: Provincia[] = [];
  distritos: Distrito[] = [];

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
      })
      .subscribe({
        next: (respuesta: PaginacionRespuesta<Encuesta>) => {
          const sinEnRegistro = respuesta.data.filter(
            (e) => e.estadoId !== ESTADOS_ENCUESTA.EN_REGISTRO,
          );
          this.encuestas.set(sinEnRegistro);
          this.encuestasTotalPaginas.set(respuesta.totalPaginas);
          this.encuestasTotal.set(respuesta.total);
          this.encuestasCargando.set(false);
          this.cargarEncuestados(sinEnRegistro);
        },
        error: (err) => {
          console.error('Error al cargar encuestas de la empresa:', err);
          this.encuestasError.set('No se pudo cargar el listado de encuestas.');
          this.encuestasCargando.set(false);
        },
      });
  }

  cargarEncuestados(encuestas: Encuesta[]): void {
    const ids = [
      ...new Set(
        encuestas
          .map((e) => e.encuestadoId)
          .filter((id): id is number => !!id && id > 0),
      ),
    ];
    if (ids.length === 0) {
      this.encuestados.set([]);
      return;
    }
    this.encuestadosCargando.set(true);
    this.encuestadosService.obtenerPorIds(ids).subscribe({
      next: (encuestados) => {
        this.encuestados.set(encuestados);
        this.encuestadosCargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar encuestados:', err);
        this.encuestadosCargando.set(false);
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

  // --- Modo edición ---

  activarEdicion(): void {
    const emp = this.empresa();
    if (!emp) return;
    this.formEdicion = {
      razonSocial: emp.razonSocial ?? '',
      ruc: emp.ruc ?? '',
      tipoEmpresaId: emp.tipoEmpresaId ?? null,
      tamanoEmpresaTop10k: emp.tamanoEmpresaTop10k ?? '',
      actividadEconomica: emp.actividadEconomica ?? '',
      direccion: {
        direc: emp.direccion?.direc ?? '',
        codPais: emp.direccion?.codPais ?? '',
        codDepartamento: emp.direccion?.codDepartamento ?? '',
        codProvincia: emp.direccion?.codProvincia ?? '',
        codDistrito: emp.direccion?.codDistrito ?? '',
        tipoVia: emp.direccion?.tipoVia ?? '',
        nombreVia: emp.direccion?.nombreVia ?? '',
        numeroVia: emp.direccion?.numeroVia ?? '',
        referencia: emp.direccion?.referencia ?? '',
      },
    };
    this.errorEdicion.set(null);
    this.exitoEdicion.set(null);
    this.cargarPaises();
    this.modoEdicion.set(true);
  }

  cancelarEdicion(): void {
    this.modoEdicion.set(false);
    this.errorEdicion.set(null);
    this.exitoEdicion.set(null);
    this.paises = [];
    this.departamentos = [];
    this.provincias = [];
    this.distritos = [];
  }

  guardarCambios(): void {
    const id = this.empresaId();
    if (!id) return;

    this.guardandoCambios.set(true);
    this.errorEdicion.set(null);
    this.exitoEdicion.set(null);

    const payload: Record<string, unknown> = {};
    const emp = this.empresa()!;

    if (this.formEdicion.razonSocial !== emp.razonSocial) {
      payload['razonSocial'] = this.formEdicion.razonSocial;
    }
    if (this.formEdicion.ruc !== emp.ruc) {
      payload['ruc'] = this.formEdicion.ruc;
    }
    if (this.formEdicion.tipoEmpresaId !== emp.tipoEmpresaId) {
      payload['tipoEmpresaId'] = this.formEdicion.tipoEmpresaId;
    }
    if (this.formEdicion.tamanoEmpresaTop10k !== (emp.tamanoEmpresaTop10k ?? '')) {
      payload['tamanoEmpresaTop10k'] = this.formEdicion.tamanoEmpresaTop10k || null;
    }
    if (this.formEdicion.actividadEconomica !== (emp.actividadEconomica ?? '')) {
      payload['actividadEconomica'] = this.formEdicion.actividadEconomica || null;
    }

    // Siempre enviar dirección si existe o si el formulario tiene datos
    payload['direccion'] = { ...this.formEdicion.direccion };

    if (Object.keys(payload).length === 1 && 'direccion' in payload) {
      const dir = this.formEdicion.direccion;
      const empDir = emp.direccion;
      const sinCambios = empDir &&
        dir.codPais === (empDir.codPais ?? '') &&
        dir.codDepartamento === (empDir.codDepartamento ?? '') &&
        dir.codProvincia === (empDir.codProvincia ?? '') &&
        dir.codDistrito === (empDir.codDistrito ?? '') &&
        dir.tipoVia === (empDir.tipoVia ?? '') &&
        dir.nombreVia === (empDir.nombreVia ?? '') &&
        dir.numeroVia === (empDir.numeroVia ?? '') &&
        dir.referencia === (empDir.referencia ?? '') &&
        dir.direc === (empDir.direc ?? '');
      if (sinCambios) {
        delete payload['direccion'];
      }
    }

    if (Object.keys(payload).length === 0) {
      this.guardandoCambios.set(false);
      this.exitoEdicion.set('No se detectaron cambios.');
      return;
    }

    this.empresasService.actualizar(id, payload as Partial<Empresa>).subscribe({
      next: (empresaActualizada) => {
        this.empresa.set(empresaActualizada as EmpresaDetalle);
        this.guardandoCambios.set(false);
        this.exitoEdicion.set('Empresa actualizada correctamente.');
        this.modoEdicion.set(false);
        this.paises = [];
        this.departamentos = [];
        this.provincias = [];
        this.distritos = [];
      },
      error: (err) => {
        this.guardandoCambios.set(false);
        const mensaje = err?.error?.message ?? 'Error al actualizar la empresa. Intenta nuevamente.';
        this.errorEdicion.set(mensaje);
      },
    });
  }

  // --- Ubigeo en edición ---

  cargarPaises(): void {
    this.ubicacionService.listarPaises().subscribe({
      next: (data: Pais[]) => {
        this.paises = data;
        if (this.formEdicion.direccion.codPais) {
          this.cargarDepartamentos(this.formEdicion.direccion.codPais);
        }
      },
      error: () => { this.paises = []; },
    });
  }

  onPaisChange(): void {
    this.formEdicion.direccion.codDepartamento = '';
    this.formEdicion.direccion.codProvincia = '';
    this.formEdicion.direccion.codDistrito = '';
    this.departamentos = [];
    this.provincias = [];
    this.distritos = [];
    if (this.formEdicion.direccion.codPais) {
      this.cargarDepartamentos(this.formEdicion.direccion.codPais);
    }
  }

  cargarDepartamentos(codPais: string): void {
    this.ubicacionService.listarDepartamentos(codPais).subscribe({
      next: (data: Departamento[]) => {
        this.departamentos = data;
        if (this.formEdicion.direccion.codDepartamento) {
          this.cargarProvincias(this.formEdicion.direccion.codDepartamento, codPais);
        }
      },
      error: () => { this.departamentos = []; },
    });
  }

  onDepartamentoChange(): void {
    this.formEdicion.direccion.codProvincia = '';
    this.formEdicion.direccion.codDistrito = '';
    this.provincias = [];
    this.distritos = [];
    if (this.formEdicion.direccion.codDepartamento && this.formEdicion.direccion.codPais) {
      this.cargarProvincias(this.formEdicion.direccion.codDepartamento, this.formEdicion.direccion.codPais);
    }
  }

  cargarProvincias(codDepartamento: string, codPais: string): void {
    this.ubicacionService.listarProvincias(codDepartamento, codPais).subscribe({
      next: (data: Provincia[]) => {
        this.provincias = data;
        if (this.formEdicion.direccion.codProvincia) {
          this.cargarDistritos(
            this.formEdicion.direccion.codProvincia,
            codDepartamento,
            codPais,
          );
        }
      },
      error: () => { this.provincias = []; },
    });
  }

  onProvinciaChange(): void {
    this.formEdicion.direccion.codDistrito = '';
    this.distritos = [];
    const dir = this.formEdicion.direccion;
    if (dir.codProvincia && dir.codDepartamento && dir.codPais) {
      this.cargarDistritos(dir.codProvincia, dir.codDepartamento, dir.codPais);
    }
  }

  cargarDistritos(codProvincia: string, codDepartamento: string, codPais: string): void {
    this.ubicacionService.listarDistritos(codProvincia, codDepartamento, codPais).subscribe({
      next: (data: Distrito[]) => { this.distritos = data; },
      error: () => { this.distritos = []; },
    });
  }

  // ---

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

  getEncuestadoPorId(id: number | undefined): Encuestado | null {
    if (!id) return null;
    return this.encuestados().find((e) => e.encuestadoId === id) ?? null;
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

  private fechaHoyPeru(): string {
    const ahora = new Date();
    const enPeru = new Date(ahora.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    const y = enPeru.getFullYear();
    const m = String(enPeru.getMonth() + 1).padStart(2, '0');
    const d = String(enPeru.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
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
          fechaEncuesta: this.fechaHoyPeru(),
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
