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
import { ParametrosService } from '../../core/services/parametros.service';
import { UbicacionService } from '../../core/services/ubicacion.service';
import { AuthService } from '../../core/services/auth.service';

// 4. Models e Interfaces
import { Empresa, Direccion, TipoEmpresa, Encuesta, EncuestaEmpresa, EncuestadoEmpresa, ObraEmpresa, Encuestado, Parametro } from '../../core/models';
import { CATEGORIAS_PARAMETROS } from '../../core/constants';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { UserMenuComponent } from '../../shared/user-menu/user-menu.component';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { ESTADOS_ENCUESTA } from '../../core/constants';
import { ROLES } from '../../core/constants/roles.constants';
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
  private parametrosService = inject(ParametrosService);
  private ubicacionService = inject(UbicacionService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  empresa = signal<EmpresaDetalle | null>(null);
  tiposEmpresa = signal<TipoEmpresa[]>([]);
  cargando = signal(false);
  error = signal<string | null>(null);
  empresaId = signal<number | null>(null);

  encuestas = signal<EncuestaEmpresa[]>([]);
  encuestasCargando = signal(false);
  encuestasError = signal<string | null>(null);

  encuestados = signal<EncuestadoEmpresa[]>([]);
  encuestadosCargando = signal(false);

  obrasEmpresa = signal<ObraEmpresa[]>([]);
  obrasCargando = signal(false);
  obrasError = signal<string | null>(null);

  // Gestión de contactos libres
  mostrarBusquedaContacto = signal(false);
  terminoBusquedaContacto = signal('');
  contactosEncontrados = signal<Encuestado[]>([]);
  buscandoContacto = signal(false);

  // Formulario de nuevo contacto
  mostrarFormularioNuevoContacto = signal(false);
  guardandoNuevoContacto = signal(false);
  mediosContacto = signal<Parametro[]>([]);
  nuevoContacto: Partial<Encuestado> = {
    nombres: '',
    apepat: '',
    cargo: '',
    tipoContacto: '',
    contacto: '',
  };

  get esEncuestador(): boolean {
    return this.authService.getRolDescripcion() === ROLES.ENCUESTADOR;
  }

  puedeVerEncuesta(estadoId: number): boolean {
    if (!this.esEncuestador) return true;
    return estadoId === ESTADOS_ENCUESTA.APROBADO || estadoId === ESTADOS_ENCUESTA.TRANSFERIDO;
  }

  encuestaSeleccionada = signal<number | null>(null);

  seleccionarEncuesta(encuestaId: number): void {
    this.encuestaSeleccionada.set(
      this.encuestaSeleccionada() === encuestaId ? null : encuestaId,
    );
  }

  // Modal de confirmación de clonación
  mostrarModalClonar = signal(false);
  encuestaParaClonar = signal<EncuestaEmpresa | null>(null);
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
  isLoadingDepartamentos = false;
  isLoadingProvincias = false;
  isLoadingDistritos = false;

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
    this.cargarEncuestados();
    this.cargarObrasEmpresa();
    this.cargarMediosContacto();
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

    this.empresasService.obtenerEncuestasPorEmpresaId(empresaId).subscribe({
      next: (encuestas) => {
        this.encuestas.set(encuestas);
        this.encuestasCargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar encuestas de la empresa:', err);
        this.encuestasError.set('No se pudo cargar el listado de encuestas.');
        this.encuestasCargando.set(false);
      },
    });
  }

  cargarEncuestados(): void {
    const empresaId = this.empresaId();
    if (!empresaId) {
      return;
    }

    this.encuestadosCargando.set(true);

    this.empresasService.obtenerEncuestadosPorEmpresaId(empresaId).subscribe({
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

  cargarObrasEmpresa(): void {
    const empresaId = this.empresaId();
    if (!empresaId) {
      return;
    }

    this.obrasCargando.set(true);
    this.obrasError.set(null);

    this.empresasService.obtenerObrasPorEmpresaId(empresaId).subscribe({
      next: (obras) => {
        this.obrasEmpresa.set(obras);
        this.obrasCargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar obras de la empresa:', err);
        this.obrasError.set('No se pudo cargar el listado de obras.');
        this.obrasCargando.set(false);
      },
    });
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
    this.isLoadingDepartamentos = !!(emp.direccion?.codPais);
    this.isLoadingProvincias = !!(emp.direccion?.codDepartamento);
    this.isLoadingDistritos = !!(emp.direccion?.codProvincia);
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
    this.isLoadingDepartamentos = true;
    this.ubicacionService.listarDepartamentos(codPais).subscribe({
      next: (data: Departamento[]) => {
        this.departamentos = data;
        this.isLoadingDepartamentos = false;
        const codDep = this.formEdicion.direccion.codDepartamento;
        if (codDep) {
          // Limpiar y restaurar el valor en el siguiente tick para que Angular
          // registre las <option> antes de llamar a writeValue con el valor real.
          this.formEdicion.direccion.codDepartamento = '';
          setTimeout(() => { this.formEdicion.direccion.codDepartamento = codDep; }, 0);
          this.cargarProvincias(codDep, codPais);
        }
      },
      error: () => { this.departamentos = []; this.isLoadingDepartamentos = false; },
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
    this.isLoadingProvincias = true;
    this.ubicacionService.listarProvincias(codDepartamento, codPais).subscribe({
      next: (data: Provincia[]) => {
        this.provincias = data;
        this.isLoadingProvincias = false;
        const codProv = this.formEdicion.direccion.codProvincia;
        if (codProv) {
          this.formEdicion.direccion.codProvincia = '';
          setTimeout(() => { this.formEdicion.direccion.codProvincia = codProv; }, 0);
          this.cargarDistritos(codProv, codDepartamento, codPais);
        }
      },
      error: () => { this.provincias = []; this.isLoadingProvincias = false; },
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
    this.isLoadingDistritos = true;
    this.ubicacionService.listarDistritos(codProvincia, codDepartamento, codPais).subscribe({
      next: (data: Distrito[]) => {
        this.distritos = data;
        this.isLoadingDistritos = false;
        const codDist = this.formEdicion.direccion.codDistrito;
        if (codDist) {
          this.formEdicion.direccion.codDistrito = '';
          setTimeout(() => { this.formEdicion.direccion.codDistrito = codDist; }, 0);
        }
      },
      error: () => { this.distritos = []; this.isLoadingDistritos = false; },
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

  getEncuestadoPorId(id: number | undefined): EncuestadoEmpresa | null {
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

  abrirDialogoClonar(encuesta: EncuestaEmpresa): void {
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

    this.encuestasService.clonar(encuesta.encuestaId).subscribe({
      next: (nuevaEncuesta) => this.finalizarClonado(nuevaEncuesta),
      error: () => {
        this.clonandoEncuesta.set(false);
        alert('Error al clonar la encuesta. Por favor, intenta de nuevo.');
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

  // --- Gestión de contactos libres ---

  cargarMediosContacto(): void {
    this.parametrosService.listarPorCategoria(CATEGORIAS_PARAMETROS.MEDIO_CONTACTO).subscribe({
      next: (medios) => { this.mediosContacto.set(medios); },
      error: () => {},
    });
  }

  toggleBusquedaContacto(): void {
    this.mostrarBusquedaContacto.update(v => !v);
    if (!this.mostrarBusquedaContacto()) {
      this.terminoBusquedaContacto.set('');
      this.contactosEncontrados.set([]);
      this.mostrarFormularioNuevoContacto.set(false);
      this.resetNuevoContacto();
    }
  }

  buscarContactos(): void {
    const termino = this.terminoBusquedaContacto().trim();
    if (!termino) {
      this.contactosEncontrados.set([]);
      return;
    }
    this.buscandoContacto.set(true);
    this.mostrarFormularioNuevoContacto.set(false);
    this.encuestadosService.listar(1, 10, termino).subscribe({
      next: (resp) => {
        this.contactosEncontrados.set(resp.data);
        this.buscandoContacto.set(false);
      },
      error: () => { this.buscandoContacto.set(false); },
    });
  }

  abrirFormularioNuevoContacto(): void {
    this.nuevoContacto = {
      nombres: this.terminoBusquedaContacto().trim(),
      apepat: '',
      cargo: '',
      tipoContacto: '',
      contacto: '',
    };
    this.mostrarFormularioNuevoContacto.set(true);
  }

  cancelarFormularioNuevoContacto(): void {
    this.mostrarFormularioNuevoContacto.set(false);
    this.resetNuevoContacto();
  }

  private resetNuevoContacto(): void {
    this.nuevoContacto = { nombres: '', apepat: '', cargo: '', tipoContacto: '', contacto: '' };
  }

  guardarNuevoContacto(): void {
    if (!this.nuevoContacto.nombres?.trim() || !this.nuevoContacto.cargo?.trim()) {
      return;
    }
    const empresaId = this.empresaId();
    if (!empresaId) return;

    this.guardandoNuevoContacto.set(true);
    this.encuestadosService.crear(this.nuevoContacto).subscribe({
      next: (encuestadoCreado) => {
        this.empresasService.agregarContactoEmpresa(empresaId, encuestadoCreado.encuestadoId!).subscribe({
          next: () => {
            this.guardandoNuevoContacto.set(false);
            this.mostrarBusquedaContacto.set(false);
            this.mostrarFormularioNuevoContacto.set(false);
            this.terminoBusquedaContacto.set('');
            this.contactosEncontrados.set([]);
            this.resetNuevoContacto();
            this.cargarEncuestados();
          },
          error: (err) => {
            console.error('Error al asociar contacto creado:', err);
            this.guardandoNuevoContacto.set(false);
          },
        });
      },
      error: (err) => {
        console.error('Error al crear contacto:', err);
        this.guardandoNuevoContacto.set(false);
      },
    });
  }

  agregarContacto(encuestado: Encuestado): void {
    const empresaId = this.empresaId();
    if (!empresaId || !encuestado.encuestadoId) return;
    this.empresasService.agregarContactoEmpresa(empresaId, encuestado.encuestadoId).subscribe({
      next: () => {
        this.mostrarBusquedaContacto.set(false);
        this.terminoBusquedaContacto.set('');
        this.contactosEncontrados.set([]);
        this.cargarEncuestados();
      },
      error: (err) => { console.error('Error al agregar contacto:', err); },
    });
  }

  quitarContacto(encuestadoId: number): void {
    const empresaId = this.empresaId();
    if (!empresaId) return;
    this.empresasService.eliminarContactoEmpresa(empresaId, encuestadoId).subscribe({
      next: () => { this.cargarEncuestados(); },
      error: (err) => { console.error('Error al quitar contacto:', err); },
    });
  }

  // ---

  obtenerLabelDireccion(tipo?: string | null): string {
    const labels: Record<string, string> = {
      'EMPRESA': 'Dirección Fiscal',
      'CONSTRUCTORA': 'Dirección de Planta',
      'OBRA': 'Dirección de Obra',
    };
    return labels[tipo ?? ''] ?? 'Dirección';
  }
}
