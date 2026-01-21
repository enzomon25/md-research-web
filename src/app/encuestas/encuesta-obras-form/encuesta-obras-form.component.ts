import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EncuestasService } from '../../core/services/encuestas.service';
import { EmpresasService } from '../../core/services/empresas.service';
import { ParametrosService } from '../../core/services/parametros.service';
import { UbicacionService } from '../../core/services/ubicacion.service';
import { FabricantesService } from '../../core/services/fabricantes.service';
import { Encuesta, Empresa, TipoEmpresa, Parametro, Encuestado, EncuestaObservacion, EncuestaObservacionHistorial, Direccion } from '../../core/models';
import { EncuestadosService } from '../../core/services/encuestados.service';
import { AuthService } from '../../core/services/auth.service';
import { EncuestaObservacionService } from '../../core/services/encuesta-observacion.service';
import { EncuestaObservacionHistorialService } from '../../core/services/encuesta-observacion-historial.service';
import { ObraEncuestaService } from '../../core/services/obra-encuesta.service';
import { ESTADOS_ENCUESTA } from '../../core/constants/estados-encuesta.constants';
import { ROLES } from '../../core/constants/roles.constants';
import { CATEGORIAS_PARAMETROS, TIPO_REFERENCIA } from '../../core/constants';
import { EncuestaHistorialEstadosComponent } from '../encuesta-historial-estados/encuesta-historial-estados.component';

@Component({
  selector: 'app-encuesta-obras-form',
  standalone: true,
  imports: [CommonModule, FormsModule, EncuestaHistorialEstadosComponent],
  templateUrl: './encuesta-obras-form.component.html',
  styleUrls: [
    './encuesta-obras-form.component.css'
  ]
})
export class EncuestaObrasFormComponent implements OnInit {
      /**
       * Devuelve el Map de observacionesTexto para usar con ngModel en el template
       */
      obtenerObservacionesTexto(): Map<string, string> {
        return this.observacionesTexto();
      }
    /**
     * Retorna true si la encuesta está en estado 'En revisión' (id=ESTADOS_ENCUESTA.REVISION)
     */
      esEstadoRevision(): boolean {
        const encuesta = this.encuesta?.();
        console.log('[esEstadoRevision] encuesta.estado:', encuesta?.estado);
        console.log('[esEstadoRevision] encuesta.estado?.estadoId:', encuesta?.estado?.estadoId);
        console.log('[esEstadoRevision] ESTADOS_ENCUESTA.EN_REVISION:', this.ESTADOS_ENCUESTA.EN_REVISION);
        return !!encuesta && encuesta.estado?.estadoId === this.ESTADOS_ENCUESTA.EN_REVISION;
      }
  // Estado para desestimar fabricante individual
  mostrarModalDesestimarFabricante = signal(false);
  encuestaFabricanteIdDesestimar = signal<number | null>(null);
  guardandoDesestimarFabricante = signal<{[id: number]: boolean}>({});

  // Constantes de estado para usar en el template
  ESTADOS_ENCUESTA = ESTADOS_ENCUESTA;

  /**
   * Abrir modal para confirmar desestimar fabricante individual
   */
  abrirModalDesestimarFabricante(encuestaFabricanteId: number): void {
    this.encuestaFabricanteIdDesestimar.set(encuestaFabricanteId);
    this.mostrarModalDesestimarFabricante.set(true);
  }

  /**
   * Verificar si se está guardando desestimación de fabricante
   */
  estaGuardandoDesestimarFabricante(encuestaFabricanteId: number): boolean {
    return !!this.guardandoDesestimarFabricante()[encuestaFabricanteId];
  }

  /**
   * Cerrar modal de desestimar fabricante
   */
  cerrarModalDesestimarFabricante(): void {
    this.mostrarModalDesestimarFabricante.set(false);
    this.encuestaFabricanteIdDesestimar.set(null);
  }

  /**
   * Confirmar y eliminar fabricante individual
   */
  confirmarDesestimarFabricante(): void {
    const id = this.encuestaFabricanteIdDesestimar();
    if (!id) return;
    this.guardandoDesestimarFabricante.set({ ...this.guardandoDesestimarFabricante(), [id]: true });
    this.fabricantesService.eliminarMarcaFabricante(id).subscribe({
      next: () => {
        // Actualizar la UI, eliminar el elemento del array marcasSeleccionadas
        const nuevasMarcas = this.marcasSeleccionadas().filter(m => m.encuestaFabricanteId !== id);
        this.marcasSeleccionadas.set(nuevasMarcas);
        this.guardandoDesestimarFabricante.set({ ...this.guardandoDesestimarFabricante(), [id]: false });
        this.cerrarModalDesestimarFabricante();
      },
      error: () => {
        this.guardandoDesestimarFabricante.set({ ...this.guardandoDesestimarFabricante(), [id]: false });
        // Mostrar error si es necesario
      }
    });
  }


  // --- Lógica clásica para cascada de marcas/tipoCemento/descFisica por fila ---
  marcasPorFila: any[][] = [[/* primer fila */]];
  tiposCementoPorFila: string[][] = [[]];
  descripcionesFisicasPorFila: string[][] = [[]];

  // Modelo extendido: ahora incluye encuestaFabricanteId, tipoCemento y descFisica (ambos string)
  marcasSeleccionadas = signal<Array<{ encuestaFabricanteId: number; marcaFabricanteId: number; fabricanteId: 0; tipoCemento?: string; descFisica?: string; completo?: boolean }>>([
    { encuestaFabricanteId: 0, marcaFabricanteId: 0, fabricanteId: 0, tipoCemento: '', descFisica: '', completo: false }
  ]);

  onFabricanteChange(index: number, event: Event) {
    if (!event.target) return;
    const fabricanteId = +(event.target as HTMLSelectElement).value;
    // Reiniciar toda la cascada dependiente al cambiar fabricante
    this.actualizarMarcaFabricante(index, 'fabricanteId', fabricanteId);
    this.actualizarMarcaFabricante(index, 'marcaFabricanteId', 0);
    this.actualizarMarcaFabricante(index, 'tipoCemento', '');
    this.actualizarMarcaFabricante(index, 'descFisica', '');
    this.actualizarMarcaFabricante(index, 'completo', false);
    // Inicializar arrays dependientes para evitar render vacío
    this.marcasPorFila[index] = [];
    this.tiposCementoPorFila[index] = [];
    this.descripcionesFisicasPorFila[index] = [];
    if (!fabricanteId) {
      // Si no hay fabricante, limpiar dependientes y salir
      this.marcasPorFila[index] = [];
      this.tiposCementoPorFila[index] = [];
      this.descripcionesFisicasPorFila[index] = [];
      return;
    }
    // Llamar al endpoint de marcas inmediatamente
    this.fabricantesService.obtenerMarcasPorFabricante(fabricanteId).subscribe({
      next: (marcas: any[]) => {
        this.marcasPorFila[index] = marcas || [];
        // Forzar actualización del binding para el dropdown de marca
        this.tiposCementoPorFila[index] = [];
        this.descripcionesFisicasPorFila[index] = [];
      },
      error: (error: any) => {
        this.marcasPorFila[index] = [];
        this.tiposCementoPorFila[index] = [];
        this.descripcionesFisicasPorFila[index] = [];
        console.error('Error al cargar marcas del fabricante', fabricanteId, error);
      }
    });
  }

  onMarcaChange(index: number, event: Event) {
    if (!event.target) return;
    const marcaFabricanteId = +(event.target as HTMLSelectElement).value;
    // Reiniciar dependientes al cambiar marca
    this.actualizarMarcaFabricante(index, 'marcaFabricanteId', marcaFabricanteId);
    this.actualizarMarcaFabricante(index, 'tipoCemento', '');
    this.actualizarMarcaFabricante(index, 'descFisica', '');
    this.actualizarMarcaFabricante(index, 'completo', false);
    this.tiposCementoPorFila[index] = [];
    this.descripcionesFisicasPorFila[index] = [];
    if (!marcaFabricanteId) {
      return;
    }
    // Buscar todas las marcas de la marca seleccionada (por nombreMarca)
    const marcas = this.marcasPorFila[index] || [];
    const marcaObj = marcas.find(m => m.marcaFabricanteId === marcaFabricanteId);
    const nombreMarcaSeleccionada = marcaObj ? marcaObj.nombreMarca : '';
    const marcasSeleccionadas = marcas.filter(m => m.nombreMarca === nombreMarcaSeleccionada);
    // Extraer todos los tipos de cemento únicos
    let tiposCemento = Array.from(new Set(marcasSeleccionadas.map(m => m.tipoCemento).filter(Boolean)));
    // Extraer todas las descripciones físicas únicas (solo por nombreMarca y tipoCemento)
    let descripcionesFisicas: string[] = [];
    // Si ya hay tipoCemento seleccionado en la fila, filtrar por ese tipoCemento
    const tipoCementoSeleccionado = this.marcasSeleccionadas()[index]?.tipoCemento || '';
    if (tipoCementoSeleccionado) {
      const marcasFiltradasPorTipo = marcasSeleccionadas.filter(m => m.tipoCemento === tipoCementoSeleccionado);
      descripcionesFisicas = Array.from(new Set(
        marcasFiltradasPorTipo
          .map(m => m.descFisica)
          .filter(Boolean)
      ));
    } else {
      // Si no hay tipoCemento seleccionado, mostrar todas las descripciones físicas de la marca
      descripcionesFisicas = Array.from(new Set(marcasSeleccionadas.map(m => m.descFisica).filter(Boolean)));
    }
    // Lógica anti-duplicados para tipoCemento y descFisica
    // Excluir los tiposCemento ya seleccionados en otras filas
    const tiposSeleccionados = this.marcasSeleccionadas().map((m, i) => i !== index ? m.tipoCemento : '').filter(Boolean);
    tiposCemento = tiposCemento.filter(tc => !tiposSeleccionados.includes(tc));
    // Excluir las descripciones físicas ya seleccionadas en otras filas
    const descsSeleccionadas = this.marcasSeleccionadas().map((m, i) => i !== index ? m.descFisica : '').filter(Boolean);
    descripcionesFisicas = descripcionesFisicas.filter(df => !descsSeleccionadas.includes(df));
    this.tiposCementoPorFila[index] = tiposCemento;
    this.descripcionesFisicasPorFila[index] = descripcionesFisicas;
  }

  // Lógica anti-duplicados para marcas: solo mostrar marcas no seleccionadas en otras filas y sin duplicados por fabricanteId-nombre
  marcasDisponiblesParaFila(index: number): any[] {
    const seleccionadas = this.marcasSeleccionadas().map((m, i) => i !== index ? m.marcaFabricanteId : 0).filter(id => !!id);
    const marcas = (this.marcasPorFila[index] || []).filter(m => !seleccionadas.includes(m.marcaFabricanteId));
    // Filtrar duplicados por fabricanteId y nombreMarca
    const unicos = new Map<string, any>();
    for (const marca of marcas) {
      const key = `${marca.fabricanteId}-${marca.nombreMarca}`;
      if (!unicos.has(key)) {
        unicos.set(key, marca);
      }
    }
    return Array.from(unicos.values());
  }

  onTipoCementoChange(index: number, event: Event) {
    if (!event.target) return;
    const tipoCemento = (event.target as HTMLSelectElement).value;
    // Reiniciar dependientes al cambiar tipoCemento
    this.actualizarMarcaFabricante(index, 'tipoCemento', tipoCemento);

    // Filtrar descripciones físicas por tipoCemento seleccionado
    const marcas = this.marcasPorFila[index] || [];
    const marcaObj = marcas.find(m => m.marcaFabricanteId === this.marcasSeleccionadas()[index].marcaFabricanteId);
    const nombreMarcaSeleccionada = marcaObj ? marcaObj.nombreMarca : '';
    const marcasSeleccionadas = marcas.filter(m => m.nombreMarca === nombreMarcaSeleccionada);
    const marcasFiltradasPorTipo = marcasSeleccionadas.filter(m => m.tipoCemento === tipoCemento);
    let descripcionesFisicas = Array.from(new Set(
      marcasFiltradasPorTipo.map(m => m.descFisica).filter(Boolean)
    ));
    // Lógica anti-duplicados para descFisica
    const descsSeleccionadas = this.marcasSeleccionadas().map((m, i) => i !== index ? m.descFisica : '').filter(Boolean);
    descripcionesFisicas = descripcionesFisicas.filter(df => !descsSeleccionadas.includes(df));
    this.descripcionesFisicasPorFila[index] = descripcionesFisicas;

    // Verificar el estado de descripciones físicas antes de autoselección
    if (descripcionesFisicas && descripcionesFisicas.length === 1 && tipoCemento) {
      this.actualizarMarcaFabricante(index, 'descFisica', descripcionesFisicas[0]);
      // Verificar si la fila está completa y actualizar flag
      this.verificarYActualizarCompletoFabricante(index);
    } else {
      this.actualizarMarcaFabricante(index, 'descFisica', '');
      this.actualizarMarcaFabricante(index, 'completo', false);
    }
  }

  onDescFisicaChange(index: number, event: Event) {
    if (!event.target) return;
    const descFisica = (event.target as HTMLSelectElement).value;
    this.actualizarMarcaFabricante(index, 'descFisica', descFisica);
    this.verificarYActualizarCompletoFabricante(index);
  }

  verificarYActualizarCompletoFabricante(index: number): void {
    const marca = this.marcasSeleccionadas()[index];
    const completo = !!(marca.fabricanteId && marca.marcaFabricanteId && marca.tipoCemento && marca.descFisica);
    this.actualizarMarcaFabricante(index, 'completo', completo);
  }

  agregarMarcaFabricante(): void {
    this.marcasSeleccionadas.set([
      ...this.marcasSeleccionadas(),
      { encuestaFabricanteId: 0, marcaFabricanteId: 0, fabricanteId: 0, tipoCemento: '', descFisica: '', completo: false }
    ]);
    this.marcasPorFila.push([]);
    this.tiposCementoPorFila.push([]);
    this.descripcionesFisicasPorFila.push([]);
  }

  eliminarMarcaFabricante(index: number): void {
    if (this.marcasSeleccionadas().length > 1) {
      const nuevas = [...this.marcasSeleccionadas()];
      nuevas.splice(index, 1);
      this.marcasSeleccionadas.set(nuevas);
      this.marcasPorFila.splice(index, 1);
      this.tiposCementoPorFila.splice(index, 1);
      this.descripcionesFisicasPorFila.splice(index, 1);
    } else {
      this.marcasSeleccionadas.set([
        {
          encuestaFabricanteId: 0,
          marcaFabricanteId: 0,
          fabricanteId: 0,
          tipoCemento: '',
          descFisica: '',
          completo: false,
        },
      ]);
      this.marcasPorFila[0] = [];
      this.tiposCementoPorFila[0] = [];
      this.descripcionesFisicasPorFila[0] = [];
    }
  }

  obtenerSeccionesConObservacionesVisibles(): string[] {
      const seccionesNombres: { [key: string]: string } = {
        datos_encuesta: 'Datos Generales',
        datos_obra: 'Datos de la Obra',
        empresa: 'Datos de la Constructora',
        encuestado: 'Datos del Encuestado',
        fabricante: 'Fabricante',
        compra: 'Información de Compra',
      };
      // 1. Si hay observaciones activas, usar las activas
      const activas: string[] = [];
      this.observacionesTexto().forEach((texto, seccion) => {
        if (texto && texto.trim().length > 0) {
          activas.push(seccionesNombres[seccion] || seccion);
        }
      });
      if (activas.length > 0) return activas;

      // 2. Si no hay activas, buscar en el historial el último ciclo
      let maxCiclo = 0;
      // Buscar el ciclo más alto
      this.historialObservaciones().forEach((lista) => {
        lista.forEach(item => {
          if (item.cicloRevision > maxCiclo) maxCiclo = item.cicloRevision;
        });
      });
      if (maxCiclo === 0) return [];
      // Mapear secciones únicas del último ciclo
      const seccionesUltimoCiclo = new Set<string>();
      this.historialObservaciones().forEach((lista, seccion) => {
        lista.forEach(item => {
          if (item.cicloRevision === maxCiclo) {
            seccionesUltimoCiclo.add(seccionesNombres[seccion] || seccion);
          }
        });
      });
      return Array.from(seccionesUltimoCiclo);
    }
  encuesta = signal<Encuesta | null>(null);
  cargando = signal(true);
  encuestaId = signal<number>(0);
  esEditable = signal(true);
  
  // Modal de confirmación para validador
  mostrarModalConfirmacionRevision = signal(false);
  procesandoCambioEstado = signal(false);
  
  // Modal de confirmación para encuestador (encuesta observada)
  mostrarModalEncuestaObservada = signal(false);
  procesandoCambioEstadoCorreccion = signal(false);

  // Búsqueda de encuestados (solo por nombres)
  terminoBusquedaEncuestado = signal('');
  encuestadosEncontrados = signal<Encuestado[]>([]);
  buscandoEncuestado = signal(false);
  mostrarResultadosEncuestado = signal(false);
  encuestadoSeleccionado = signal<Encuestado | null>(null);
  errorBusquedaEncuestado = signal('');
  errorContactoEncuestado = signal('');
  
  // Registro de nuevo encuestado
  mostrarFormularioRegistroEncuestado = signal(false);
  mostrarModalNoEncontradaEncuestado = signal(false);
  guardandoEncuestado = signal(false);
  nuevoEncuestado: Partial<Encuestado> = {
    nombres: '',
    apepat: '',
    cargo: '',
    tipoContacto: '',
    contacto: ''
  };

  // Datos del encuestado (ya no se usa directamente)
  datosEncuestado = signal<Partial<Encuestado>>({
    nombres: '',
    apepat: '',
    cargo: ''
  });

  // Datos de la obra
  datosObra = signal<{ etapaObra: string; fechaFinalizacionObra: string; mixer?: string; metraje?: string; resistencia?: string }>({
    etapaObra: '',
    fechaFinalizacionObra: '',
    mixer: '',
    metraje: '',
    resistencia: ''
  });

  // Dirección de la obra
  direccionObra: {
    direc: string;
    codPais: string;
    codDepartamento: string;
    codProvincia: string;
    codDistrito: string;
    tipoVia: string;
    nombreVia: string;
    numeroVia: string;
    referencia: string;
  } = {
    direc: '',
    codPais: '428', // Perú por defecto
    codDepartamento: '',
    codProvincia: '',
    codDistrito: '',
    tipoVia: '',
    nombreVia: '',
    numeroVia: '',
    referencia: ''
  };

  // Catálogos para Dirección de la obra
  paises: { paisId: number; descPais: string; codPais: string }[] = [];
  departamentosObra: { departamentoId: number; descDepartamento: string; codPais: string; codDepartamento: string }[] = [];
  provinciasObra: { provinciaId: number; descProvincia: string; codPais: string; codDepartamento: string; codProvincia: string }[] = [];
  distritosObra: { distritoId: number; descDistrito: string; codPais: string; codDepartamento: string; codProvincia: string; codDistrito: string }[] = [];
  
  // Catálogos para Dirección de la empresa/constructora
  departamentos: { departamentoId: number; descDepartamento: string; codPais: string; codDepartamento: string }[] = [];
  provincias: { provinciaId: number; descProvincia: string; codPais: string; codDepartamento: string; codProvincia: string }[] = [];
  distritos: { distritoId: number; descDistrito: string; codPais: string; codDepartamento: string; codProvincia: string; codDistrito: string }[] = [];
  
  tiposVia: string[] = [
    'Avenida',
    'Calle',
    'Jirón',
    'Pasaje',
    'Carretera',
    'Prolongación',
    'Alameda',
    'Otro'
  ];

  // Getter para direccionNuevaEmpresa (siempre devuelve un objeto válido para binding en template)
  get direccionNuevaEmpresa() {
    if (!this.nuevaEmpresa().direccion) {
      this.nuevaEmpresa().direccion = this.direccionDefault();
    }
    return this.nuevaEmpresa().direccion!;
  }

  private direccionDefault(): Direccion {
    return {
      direc: '',
      codPais: '',
      codDepartamento: '',
      codProvincia: '',
      codDistrito: '',
      tipoVia: '',
      nombreVia: '',
      numeroVia: '',
      referencia: ''
    };
  }

  // (Eliminado: declaración duplicada de marcasSeleccionadas)

  // (Las versiones de agregarMarcaFabricante y eliminarMarcaFabricante que usan marcasPorFila ya están definidas arriba)

  actualizarMarcaFabricante(
    index: number,
    campo: keyof { marcaFabricanteId: number; fabricanteId: number; tipoCemento?: string; descFisica?: string; completo?: boolean },
    valor: any
  ): void {
    const nuevas = [...this.marcasSeleccionadas()];
    (nuevas[index] as any)[campo] = valor;
    this.marcasSeleccionadas.set(nuevas);
  }

  // Control de secciones expandidas
  seccionExpandida = signal<string | null>(null);

  // Fecha máxima permitida (hoy)
  fechaMaxima = new Date().toISOString().split('T')[0];

  // Búsqueda de empresas
  tipoBusquedaEmpresa = signal<'ruc' | 'razonSocial'>('ruc');
  terminoBusqueda = signal('');
  empresasEncontradas = signal<Empresa[]>([]);
  buscandoEmpresa = signal(false);
  mostrarResultadosEmpresa = signal(false);
  empresaSeleccionada = signal<Empresa | null>(null);
  errorBusquedaRuc = signal(false);
  
      // Registro de nueva empresa
      mostrarFormularioRegistro = signal(false);
      mostrarModalNoEncontrada = signal(false);
      mostrarModalRucDuplicado = signal(false);
      mostrarModalExito = signal(false);
      mostrarModalError = signal(false);
      mensajeModal = signal('');
      guardandoEmpresa = signal(false);
      errorRucRegistro = signal('');
      tiposEmpresa = signal<TipoEmpresa[]>([]);
      lugaresCompra = signal<Parametro[]>([]);
      tiposCompraCemento = signal<Parametro[]>([]);
      tiposPresentacionBolsa = signal<Parametro[]>([]);
      tiposPresentacionGranel = signal<Parametro[]>([]);
      cantidadPresentacionBolsa = signal<Parametro[]>([]);
      cantidadPresentacionBombona = signal<Parametro[]>([]);
      cantidadPresentacionBigbag = signal<Parametro[]>([]);
      mediosContacto = signal<Parametro[]>([]);
      fabricantes = signal<any[]>([]);
      fabricantesCargados = signal(false);
      marcasFabricante = signal<any[]>([]);
      marcasCargadasPorFabricante = signal<{[key: number]: boolean}>({});
      marcasUnicas = signal<string[]>([]);
      tiposCementoPorMarca = signal<any[]>([]);
      nuevaEmpresa = signal<Partial<Empresa>>({
        razonSocial: '',
        ruc: '',
        tipoEmpresaId: 1,
        actividadEconomica: '',
        direccion: {
          codPais: '428', // Perú por defecto
          codDepartamento: '',
          codProvincia: '',
          codDistrito: '',
          tipoVia: '',
          nombreVia: '',
          numeroVia: '',
          referencia: ''
        }
      });

  // Observaciones por sección
  observaciones = signal<Map<string, EncuestaObservacion>>(new Map());
  observacionesTexto = signal<Map<string, string>>(new Map());
  guardandoObservacion = signal<Map<string, boolean>>(new Map());

  // Historial de observaciones por sección (solo para VALIDADOR)
  historialObservaciones = signal<Map<string, EncuestaObservacionHistorial[]>>(new Map());
  seccionesHistorialExpandidas = signal<Set<string>>(new Set());

  // Modal de transferencia/aprobación
  mostrarModalTransferencia = signal(false);
  procesandoTransferencia = signal(false);

  // Modal de confirmación para desestimar observación
  mostrarModalDesestimar = signal(false);
  seccionDesestimar = signal<string>('');
  procesandoDesestimar = signal(false);

  // Control de cambios sin guardar
  encuestaOriginal = signal<Encuesta | null>(null);
  tieneCambiosSinGuardar = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private encuestasService: EncuestasService,
    private empresasService: EmpresasService,
    private parametrosService: ParametrosService,
    private ubicacionService: UbicacionService,
    private fabricantesService: FabricantesService,
    private encuestadosService: EncuestadosService,
    private authService: AuthService,
    private observacionService: EncuestaObservacionService,
    private historialObservacionService: EncuestaObservacionHistorialService,
    private obraEncuestaService: ObraEncuestaService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.encuestaId.set(+id);
      this.verificarYCargarEncuesta(+id);
    }

    // Cargar tipos de empresa
    this.cargarTiposEmpresa();

    // Cargar lugares de compra
    this.cargarLugaresCompra();

    // Cargar tipos de compra de cemento
    this.cargarTiposCompraCemento();

    // Cargar tipos de presentación bolsa
    this.cargarTiposPresentacionBolsa();

    // Cargar tipos de presentación granel
    this.cargarTiposPresentacionGranel();

    // Cargar fabricantes automáticamente para el select
    this.cargarFabricantes();

    // Cargar cantidades de presentación
    this.cargarCantidadPresentacionBolsa();
    this.cargarCantidadPresentacionBombona();
    this.cargarCantidadPresentacionBigbag();

    // Cargar medios de contacto
    this.cargarMediosContacto();

    // Cargar ubicaciones para la dirección de la obra
    this.cargarPaises();
  }

  cargarTiposEmpresa(): void {
    this.empresasService.listarTipos().subscribe({
      next: (tipos) => {
        this.tiposEmpresa.set(tipos);
        // Buscar y autoseleccionar "CONSTRUCTORA" (búsqueda exacta case-insensitive)
        const constructora = tipos.find(t => 
          t.descripcionTipoEmpresa?.toUpperCase().trim() === 'CONSTRUCTORA' ||
          t.descripcionTipoEmpresa?.toUpperCase().trim() === 'CONSTRUCTORAS'
        );
        if (constructora) {
          this.nuevaEmpresa.update(empresa => ({
            ...empresa,
            tipoEmpresaId: constructora.tipoEmpresaId
          }));
        }
      },
      error: (error) => {
        console.error('Error al cargar tipos de empresa:', error);
      }
    });
  }

  cargarLugaresCompra(): void {
    this.parametrosService.listarPorCategoria(CATEGORIAS_PARAMETROS.LUGAR_COMPRA).subscribe({
      next: (lugares) => {
        this.lugaresCompra.set(lugares);
      },
      error: (error) => {
        console.error('Error al cargar lugares de compra:', error);
      }
    });
  }

  cargarTiposCompraCemento(): void {
    this.parametrosService.listarPorCategoria(CATEGORIAS_PARAMETROS.TIPO_COMPRA_CEMENTO).subscribe({
      next: (tipos) => {
        this.tiposCompraCemento.set(tipos);
      },
      error: (error) => {
        console.error('Error al cargar tipos de compra de cemento:', error);
      }
    });
  }

  cargarTiposPresentacionBolsa(): void {
    this.parametrosService.listarPorCategoria(CATEGORIAS_PARAMETROS.TIPO_PRESENTACION_BOLSA).subscribe({
      next: (tipos) => {
        this.tiposPresentacionBolsa.set(tipos);
      },
      error: (error) => {
        console.error('Error al cargar tipos de presentación bolsa:', error);
      }
    });
  }

  cargarTiposPresentacionGranel(): void {
    this.parametrosService.listarPorCategoria(CATEGORIAS_PARAMETROS.TIPO_PRESENTACION_GRANEL).subscribe({
      next: (tipos) => {
        this.tiposPresentacionGranel.set(tipos);
      },
      error: (error) => {
        console.error('Error al cargar tipos de presentación granel:', error);
      }
    });
  }

  cargarFabricantes(): void {
    if (this.fabricantesCargados()) {
      console.log('Fabricantes ya están cargados, no se vuelve a llamar al endpoint');
      return;
    }
    
    console.log('Cargando fabricantes desde el endpoint...');
    this.fabricantesService.listar().subscribe({
      next: (fabricantes) => {
        console.log('Fabricantes cargados:', fabricantes);
        this.fabricantes.set(fabricantes);
        this.fabricantesCargados.set(true);
      },
      error: (error) => {
        console.error('Error al cargar fabricantes:', error);
      }
    });
  }

  onFabricanteDropdownClick(): void {
    console.log('Click en dropdown de Fabricante');
    this.cargarFabricantes();
  }

  cargarCantidadPresentacionBolsa(): void {
    this.parametrosService.listarPorCategoria(CATEGORIAS_PARAMETROS.CANTIDAD_PRESENTACION_BOLSA).subscribe({
      next: (cantidades) => {
        this.cantidadPresentacionBolsa.set(cantidades);
      },
      error: (error) => {
        console.error('Error al cargar cantidad presentación bolsa:', error);
      }
    });
  }

  cargarCantidadPresentacionBombona(): void {
    this.parametrosService.listarPorCategoria(CATEGORIAS_PARAMETROS.CANTIDAD_PRESENTACION_BOMBONA).subscribe({
      next: (cantidades) => {
        this.cantidadPresentacionBombona.set(cantidades);
      },
      error: (error) => {
        console.error('Error al cargar cantidad presentación bombona:', error);
      }
    });
  }

  cargarCantidadPresentacionBigbag(): void {
    this.parametrosService.listarPorCategoria(CATEGORIAS_PARAMETROS.CANTIDAD_PRESENTACION_BIGBAG).subscribe({
      next: (cantidades) => {
        this.cantidadPresentacionBigbag.set(cantidades);
      },
      error: (error) => {
        console.error('Error al cargar cantidad presentación bigbag:', error);
      }
    });
  }

  cargarMediosContacto(): void {
    this.parametrosService.listarPorCategoria(CATEGORIAS_PARAMETROS.MEDIO_CONTACTO).subscribe({
      next: (medios) => {
        this.mediosContacto.set(medios);
      },
      error: (error) => {
        console.error('Error al cargar medios de contacto:', error);
      }
    });
  }

  // ===== MÉTODOS PARA DIRECCIÓN DE OBRA =====

  cargarPaises(): void {
    this.ubicacionService.listarPaises().subscribe({
      next: (data: any[]) => {
        this.paises = data;
        // Cargar automáticamente los departamentos de Perú para la obra
        if (this.direccionObra.codPais === '428') {
          this.cargarDepartamentosObra('428');
        }
        // Cargar automáticamente los departamentos de Perú para la empresa (nuevaEmpresa tiene 428 por defecto)
        if (this.nuevaEmpresa().direccion?.codPais === '428') {
          this.cargarDepartamentos('428');
        }
      },
      error: () => {
        this.paises = [];
      }
    });
  }

  onPaisChangeObra(): void {
    this.direccionObra.codDepartamento = '';
    this.direccionObra.codProvincia = '';
    this.direccionObra.codDistrito = '';
    this.departamentosObra = [];
    this.provinciasObra = [];
    this.distritosObra = [];

    if (this.direccionObra.codPais) {
      this.cargarDepartamentosObra(this.direccionObra.codPais);
    }
  }

  cargarDepartamentosObra(codPais: string): void {
    this.ubicacionService.listarDepartamentos(codPais).subscribe({
      next: (data: any[]) => {
        this.departamentosObra = data;
      },
      error: () => {
        this.departamentosObra = [];
      }
    });
  }

  onDepartamentoChangeObra(): void {
    this.direccionObra.codProvincia = '';
    this.direccionObra.codDistrito = '';
    this.provinciasObra = [];
    this.distritosObra = [];

    if (this.direccionObra.codDepartamento && this.direccionObra.codPais) {
      this.cargarProvinciasObra(this.direccionObra.codDepartamento, this.direccionObra.codPais);
    }
  }

  cargarProvinciasObra(codDepartamento: string, codPais: string): void {
    this.ubicacionService.listarProvincias(codDepartamento, codPais).subscribe({
      next: (data: any[]) => {
        this.provinciasObra = data;
      },
      error: () => {
        this.provinciasObra = [];
      }
    });
  }

  onProvinciaChangeObra(): void {
    this.direccionObra.codDistrito = '';
    this.distritosObra = [];

    if (this.direccionObra.codProvincia && this.direccionObra.codDepartamento && this.direccionObra.codPais) {
      this.cargarDistritosObra(
        this.direccionObra.codDistrito,
        this.direccionObra.codProvincia,
        this.direccionObra.codDepartamento,
        this.direccionObra.codPais
      );
    }
  }

  cargarDistritosObra(codDistrito: string, codProvincia: string, codDepartamento: string, codPais: string): void {
    this.ubicacionService.listarDistritos(codProvincia, codDepartamento, codPais).subscribe({
      next: (data: any[]) => {
        this.distritosObra = data;
      },
      error: () => {
        this.distritosObra = [];
      }
    });
  }

  // ===== MÉTODOS PARA DIRECCIÓN DE EMPRESA/CONSTRUCTORA =====

  cargarDepartamentos(codPais: string): void {
    this.ubicacionService.listarDepartamentos(codPais).subscribe({
      next: (data: any[]) => {
        this.departamentos = data;
      },
      error: () => {
        this.departamentos = [];
      }
    });
  }

  cargarProvincias(codDepartamento: string, codPais: string): void {
    this.ubicacionService.listarProvincias(codDepartamento, codPais).subscribe({
      next: (data: any[]) => {
        this.provincias = data;
      },
      error: () => {
        this.provincias = [];
      }
    });
  }

  cargarDistritos(codProvincia: string, codDepartamento: string, codPais: string): void {
    this.ubicacionService.listarDistritos(codProvincia, codDepartamento, codPais).subscribe({
      next: (data: any[]) => {
        this.distritos = data;
      },
      error: () => {
        this.distritos = [];
      }
    });
  }

  onPaisChange(): void {
    if (!this.nuevaEmpresa().direccion) {
      this.nuevaEmpresa().direccion = this.direccionDefault();
    }
    const direccion = this.nuevaEmpresa().direccion;
    if (!direccion) return;
    const codPais = direccion.codPais;
    if (codPais) {
      this.cargarDepartamentos(codPais);
      this.departamentos = [];
      this.provincias = [];
      this.distritos = [];
      direccion.codDepartamento = '';
      direccion.codProvincia = '';
      direccion.codDistrito = '';
    }
  }

  onDepartamentoChange(): void {
    if (!this.nuevaEmpresa().direccion) {
      this.nuevaEmpresa().direccion = this.direccionDefault();
    }
    const direccion = this.nuevaEmpresa().direccion;
    if (!direccion) return;
    const codDepartamento = direccion.codDepartamento;
    const codPais = direccion.codPais;
    if (codDepartamento) {
      this.cargarProvincias(codDepartamento, codPais);
      this.provincias = [];
      this.distritos = [];
      direccion.codProvincia = '';
      direccion.codDistrito = '';
    }
  }

  onProvinciaChange(): void {
    if (!this.nuevaEmpresa().direccion) {
      this.nuevaEmpresa().direccion = this.direccionDefault();
    }
    const direccion = this.nuevaEmpresa().direccion;
    if (!direccion) return;
    const codProvincia = direccion.codProvincia;
    const codDepartamento = direccion.codDepartamento;
    const codPais = direccion.codPais;

    if (codProvincia) {
      this.cargarDistritos(codProvincia, codDepartamento, codPais);
      this.distritos = [];
      direccion.codDistrito = '';
    }
  }

  /**
   * Verifica si el usuario es VALIDADOR y la encuesta está en TRANSFERIDO
   * Si es así, muestra modal de confirmación antes de cargar el detalle
   */
  verificarYCargarEncuesta(id: number): void {
    this.cargando.set(true);
    
    // Primero obtenemos solo el estadoId de la encuesta sin cargar todo el detalle
    this.encuestasService.obtenerPorId(id).subscribe({
      next: (encuesta) => {
        const rolUsuario = this.authService.getRolDescripcion();
        const esValidador = rolUsuario === ROLES.VALIDADOR;
        const estaTransferido = encuesta.estadoId === ESTADOS_ENCUESTA.TRANSFERIDO;

        // Si es VALIDADOR y la encuesta está en TRANSFERIDO, mostrar modal de confirmación
        if (esValidador && estaTransferido) {
          this.cargando.set(false);
          this.mostrarModalConfirmacionRevision.set(true);
        } else {
          // Caso normal: cargar el detalle directamente
          this.procesarEncuesta(encuesta);
        }
      },
      error: (error) => {
        console.error('Error al verificar encuesta:', error);
        this.cargando.set(false);
        this.mensajeModal.set('Error al cargar la encuesta');
        this.mostrarModalError.set(true);
        setTimeout(() => {
          this.router.navigate(['/encuestas']);
        }, 2000);
      }
    });
  }

  /**
   * Método llamado cuando el validador acepta revisar la encuesta
   */
  aceptarRevision(): void {
    const id = this.encuestaId();
    this.procesandoCambioEstado.set(true);
    
    // Cambiar estado a EN_REVISION
    this.encuestasService.cambiarEstado(id, ESTADOS_ENCUESTA.EN_REVISION).subscribe({
      next: (encuestaActualizada) => {
        this.procesandoCambioEstado.set(false);
        this.mostrarModalConfirmacionRevision.set(false);
        // Ahora sí cargar el detalle completo
        this.procesarEncuesta(encuestaActualizada);
      },
      error: (error) => {
        console.error('Error al cambiar estado:', error);
        this.procesandoCambioEstado.set(false);
        this.mensajeModal.set('Error al cambiar el estado de la encuesta');
        this.mostrarModalError.set(true);
      }
    });
  }

  /**
   * Método llamado cuando el validador cancela la revisión
   */
  cancelarRevision(): void {
    this.mostrarModalConfirmacionRevision.set(false);
    this.router.navigate(['/encuestas']);
  }

  /**
   * Procesa y muestra el detalle de la encuesta
   */
  procesarEncuesta(encuesta: Encuesta): void {
    console.log('LOG-1: Encuesta cargada del backend', encuesta);
    
    // Convertir fechaEncuesta de ISO a formato YYYY-MM-DD si existe
    if (encuesta.fechaEncuesta) {
      const fecha = new Date(encuesta.fechaEncuesta);
      const año = fecha.getFullYear();
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      const dia = String(fecha.getDate()).padStart(2, '0');
      encuesta.fechaEncuesta = `${año}-${mes}-${dia}`;
    }
    
    // Guardar copia original para detectar cambios
    this.encuestaOriginal.set(JSON.parse(JSON.stringify(encuesta)));
    
    // Limpieza: ya no se usa marcaFabricanteInfo ni campos legacy
    // console.log('Encuesta después de autocompletar:', encuesta);

    this.encuesta.set(encuesta);

    // --- NUEVO: Poblar marcasSeleccionadas y marcasPorFila desde la API si existen ---
    if (Array.isArray(encuesta.marcas) && encuesta.marcas.length > 0) {
      console.log('LOG-2: Marcas recibidas en encuesta', encuesta.marcas);
      // Poblar marcasSeleccionadas con todos los campos relevantes
      const marcasAdaptadas = encuesta.marcas.map((m: any) => {
        const tipoCemento = m.marcaFabricante?.tipoCemento || '';
        const descFisica = m.marcaFabricante?.descFisica || '';
        const completo = !!(m.encuestaFabricanteId || m.encuesta_fabricante_id) && !!(m.marcaFabricanteId) && !!(m.fabricanteId) && !!tipoCemento && !!descFisica;
        return {
          encuestaFabricanteId: m.encuestaFabricanteId || m.encuesta_fabricante_id || 0,
          marcaFabricanteId: m.marcaFabricanteId || 0,
          fabricanteId: m.fabricanteId || 0,
          tipoCemento,
          descFisica,
          completo
        };
      });
      this.marcasSeleccionadas.set(marcasAdaptadas);
      console.log('LOG-3: marcasSeleccionadas adaptadas', marcasAdaptadas);
      // Inicializar marcasPorFila, tiposCementoPorFila y descripcionesFisicasPorFila con los valores del backend
      this.marcasPorFila = Array(marcasAdaptadas.length).fill([]);
      this.tiposCementoPorFila = Array(marcasAdaptadas.length).fill([]);
      this.descripcionesFisicasPorFila = Array(marcasAdaptadas.length).fill([]);
      marcasAdaptadas.forEach((item, idx) => {
        if (item.fabricanteId) {
          this.fabricantesService.obtenerMarcasPorFabricante(item.fabricanteId).subscribe({
            next: (marcas: any[]) => {
              this.marcasPorFila[idx] = marcas || [];
              // Inicializar tiposCementoPorFila y descripcionesFisicasPorFila con los valores del backend si existen
              const marcaObj = marcas.find(m => m.marcaFabricanteId === item.marcaFabricanteId);
              if (marcaObj) {
                // Tipos de cemento disponibles para la marca
                const tiposCemento = Array.from(new Set(marcas.filter(m => m.nombreMarca === marcaObj.nombreMarca).map(m => m.tipoCemento).filter(Boolean)));
                this.tiposCementoPorFila[idx] = tiposCemento;
                // Descripciones físicas disponibles para la marca y tipoCemento
                const descripcionesFisicas = Array.from(new Set(marcas.filter(m => m.nombreMarca === marcaObj.nombreMarca && m.tipoCemento === item.tipoCemento).map(m => m.descFisica).filter(Boolean)));
                this.descripcionesFisicasPorFila[idx] = descripcionesFisicas;
              }
            },
            error: () => {
              this.marcasPorFila[idx] = [];
              this.tiposCementoPorFila[idx] = [];
              this.descripcionesFisicasPorFila[idx] = [];
            }
          });
        } else {
          this.marcasPorFila[idx] = [];
          this.tiposCementoPorFila[idx] = [];
          this.descripcionesFisicasPorFila[idx] = [];
        }
      });
    } else {
      // Si no hay marcas, dejar al menos una fila vacía
      this.marcasSeleccionadas.set([{ encuestaFabricanteId: 0, marcaFabricanteId: 0, fabricanteId: 0, tipoCemento: '', descFisica: '', completo: false }]);
      console.log('LOG-4: marcasSeleccionadas vacío', this.marcasSeleccionadas());
      this.marcasPorFila = [[]];
    }

    // Establecer si la encuesta es editable
    // Para VALIDADOR, los formularios siempre están deshabilitados
    const rolUsuario = this.authService.getRolDescripcion();
    const esValidador = rolUsuario === ROLES.VALIDADOR;
    const esEncuestador = rolUsuario === ROLES.ENCUESTADOR;

    // Si es ENCUESTADOR y la encuesta está OBSERVADA, mostrar modal
    if (esEncuestador && encuesta.estadoId === ESTADOS_ENCUESTA.OBSERVADA) {
      this.mostrarModalEncuestaObservada.set(true);
    }

    // VALIDADOR y ADMINISTRADOR: nunca pueden editar campos del formulario (solo lectura)
    // ENCUESTADOR: solo puede editar en estados EN_REGISTRO (1) y EN_CORRECCION (4)
    const esAdministrador = rolUsuario === ROLES.ADMINISTRADOR;

    if (esValidador || esAdministrador) {
      this.esEditable.set(false);
    } else if (esEncuestador) {
      const puedeEditar =
        encuesta.estadoId === ESTADOS_ENCUESTA.EN_REGISTRO ||
        encuesta.estadoId === ESTADOS_ENCUESTA.EN_CORRECCION;
      this.esEditable.set(puedeEditar);
    } else {
      // Otros roles (fallback)
      this.esEditable.set(false);
    }

    this.cargando.set(false);

    // Si la encuesta tiene datos del encuestado, cargarlos
    if (encuesta.encuestado) {
      this.encuestadoSeleccionado.set(encuesta.encuestado);
    }

    // Si la encuesta tiene empresa asignada, cargarla
    if (encuesta.empresaId) {
      console.log('LOG-5: Cargando empresa con ID', encuesta.empresaId);
      this.cargarEmpresaSeleccionada(encuesta.empresaId);
    }

    // Limpieza: ya no se usa fabricanteId ni carga de marcas por fabricante legacy

    // Si la encuesta tiene datos de obra (tipo OBRA), cargarlos
    if (encuesta.obra) {
      console.log('LOG-6: Datos de obra encontrados', encuesta.obra);
      // Poblar datosObra signal
      this.datosObra.set({
        etapaObra: encuesta.obra.etapaObra ?? '',
        fechaFinalizacionObra: encuesta.obra.fechaFinalizacionObra ?? '',
        mixer: encuesta.obra.mixer ?? '',
        metraje: encuesta.obra.metraje ?? '',
        resistencia: encuesta.obra.resistencia ?? ''
      });
      
      // Si la obra tiene dirección, cargarla
      if (encuesta.obra.direccion) {
        console.log('LOG-7: Dirección de obra encontrada', encuesta.obra.direccion);
        this.direccionObra = {
          direc: encuesta.obra.direccion.direc || '',
          codPais: encuesta.obra.direccion.codPais || '',
          codDepartamento: encuesta.obra.direccion.codDepartamento || '',
          codProvincia: encuesta.obra.direccion.codProvincia || '',
          codDistrito: encuesta.obra.direccion.codDistrito || '',
          tipoVia: encuesta.obra.direccion.tipoVia || '',
          nombreVia: encuesta.obra.direccion.nombreVia || '',
          numeroVia: encuesta.obra.direccion.numeroVia || '',
          referencia: encuesta.obra.direccion.referencia || ''
        };
        
        // Cargar catálogos en cascada para los selects
        if (this.direccionObra.codPais) {
          this.cargarDepartamentosObra(this.direccionObra.codPais);
        }
        if (this.direccionObra.codDepartamento && this.direccionObra.codPais) {
          this.cargarProvinciasObra(this.direccionObra.codDepartamento, this.direccionObra.codPais);
        }
        if (this.direccionObra.codProvincia && this.direccionObra.codDepartamento && this.direccionObra.codPais) {
          this.cargarDistritosObra(
            this.direccionObra.codDistrito,
            this.direccionObra.codProvincia,
            this.direccionObra.codDepartamento,
            this.direccionObra.codPais
          );
        }
      }
    }

    // Cargar observaciones si es VALIDADOR o ENCUESTADOR con encuesta observada/en corrección
    if ((esValidador || esEncuestador) && encuesta.encuestaId) {
      this.cargarObservaciones(encuesta.encuestaId);
    }
  }

  cargarEncuesta(id: number): void {
    // Método legacy mantenido por compatibilidad
    // Ahora usa verificarYCargarEncuesta para el flujo principal
    this.verificarYCargarEncuesta(id);
  }

  cargarEmpresaSeleccionada(empresaId: number): void {
    this.empresasService.obtenerPorId(empresaId).subscribe({
      next: (empresa) => {
        this.empresaSeleccionada.set(empresa);
        this.terminoBusqueda.set(`${empresa.razonSocial} (RUC: ${empresa.ruc})`);
      },
      error: (error) => {
        console.error('Error al cargar empresa:', error);
      }
    });
  }

  guardarEncuesta(): void {
    const encuestaActual = this.encuesta();
    if (!encuestaActual) {
      this.mensajeModal.set('No hay datos de encuesta para guardar');
      this.mostrarModalError.set(true);
      return;
    }

    // Validar que al menos una marca/fabricante esté seleccionada
    const marcasValidas = this.marcasSeleccionadas().filter(m => m.marcaFabricanteId && m.fabricanteId);
    if (marcasValidas.length === 0) {
      this.mensajeModal.set('Debe seleccionar al menos un fabricante y marca.');
      this.mostrarModalError.set(true);
      return;
    }

    // VALIDACIÓN PREVIA: Verificar datos de obra ANTES de guardar la encuesta
    const datosObra = this.datosObra();
    if (datosObra.etapaObra && datosObra.fechaFinalizacionObra) {
      // Si hay datos de obra, validar que la dirección esté completa
      if (!this.direccionObra.codPais || !this.direccionObra.codDepartamento || 
          !this.direccionObra.codProvincia || !this.direccionObra.codDistrito) {
        this.mensajeModal.set('Debe completar los datos de dirección (País, Departamento, Provincia, Distrito) antes de guardar la encuesta');
        this.mostrarModalError.set(true);
        return;
      }
    }

    // Preparar payload solo con campos que tienen valor (no undefined, no null, no strings vacíos)
    const encuestadoData = this.datosEncuestado();
    const encuestaParaGuardar: Partial<Encuesta> = {
      encuestaId: encuestaActual.encuestaId,
      ...(encuestaActual.tipoEncuesta && { tipoEncuesta: encuestaActual.tipoEncuesta }),
      ...(encuestaActual.tipoEncuestaValor && { tipoEncuestaValor: encuestaActual.tipoEncuestaValor }),
      ...(encuestaActual.fechaEncuesta && { fechaEncuesta: encuestaActual.fechaEncuesta }),
      // Incluir datos del encuestado si están completos
      ...(encuestadoData.nombres && encuestadoData.apepat && {
        encuestado: {
          ...(encuestadoData.encuestadoId && { encuestadoId: encuestadoData.encuestadoId }),
          nombres: encuestadoData.nombres,
          apepat: encuestadoData.apepat,
          cargo: encuestadoData.cargo
        }
      }),
      ...(encuestaActual.concretoPremezclado !== undefined && encuestaActual.concretoPremezclado !== null && { concretoPremezclado: encuestaActual.concretoPremezclado }),
      ...(encuestaActual.articulosConcreto !== undefined && encuestaActual.articulosConcreto !== null && { articulosConcreto: encuestaActual.articulosConcreto }),
      ...(encuestaActual.tipoLugarCompra && { tipoLugarCompra: encuestaActual.tipoLugarCompra }),
      ...(encuestaActual.tipoCompra && { tipoCompra: encuestaActual.tipoCompra }),
      ...(encuestaActual.presentacionCompra && { presentacionCompra: encuestaActual.presentacionCompra }),
      ...(encuestaActual.cantidadPresentacionCompra && encuestaActual.cantidadPresentacionCompra.trim() !== '' && { cantidadPresentacionCompra: encuestaActual.cantidadPresentacionCompra }),
      ...(encuestaActual.descCompra && { descCompra: encuestaActual.descCompra }),
      ...(encuestaActual.precio !== undefined && encuestaActual.precio !== null && { precio: encuestaActual.precio }),
      ...(encuestaActual.usoCemento && { usoCemento: encuestaActual.usoCemento }),
      ...(encuestaActual.motivoCompra && { motivoCompra: encuestaActual.motivoCompra }),
      ...(encuestaActual.deseoRegalo !== undefined && encuestaActual.deseoRegalo !== null && { deseoRegalo: encuestaActual.deseoRegalo }),
      ...(encuestaActual.audioUrl && encuestaActual.audioUrl.trim() !== '' && { audioUrl: encuestaActual.audioUrl }),
      ...(encuestaActual.comentarioCuantitativo && encuestaActual.comentarioCuantitativo.trim() !== '' && { comentarioCuantitativo: encuestaActual.comentarioCuantitativo }),
      marcas: marcasValidas
    };

    this.encuestasService.guardar(encuestaParaGuardar).subscribe({
      next: (encuestaGuardada) => {
        this.procesarEncuesta(encuestaGuardada);
        this.tieneCambiosSinGuardar.set(false);
        
        // Ahora guardar los datos de la obra si están completos
        const datosObra = this.datosObra();
        if (datosObra.etapaObra && datosObra.fechaFinalizacionObra && encuestaGuardada.encuestaId) {
          const obraDto: any = {
            encuestaId: encuestaGuardada.encuestaId!,
            etapaObra: datosObra.etapaObra,
            fechaFinalizacionObra: datosObra.fechaFinalizacionObra,
            ...(datosObra.mixer && { mixer: datosObra.mixer }),
            ...(datosObra.metraje && { metraje: datosObra.metraje }),
            ...(datosObra.resistencia && { resistencia: datosObra.resistencia }),
            tipoReferencia: TIPO_REFERENCIA.OBRA,
            // Datos de dirección (ya validados antes de guardar la encuesta)
            codPais: this.direccionObra.codPais,
            codDepartamento: this.direccionObra.codDepartamento,
            codProvincia: this.direccionObra.codProvincia,
            codDistrito: this.direccionObra.codDistrito,
            tipoVia: this.direccionObra.tipoVia,
            nombreVia: this.direccionObra.nombreVia,
            numeroVia: this.direccionObra.numeroVia,
            referencia: this.direccionObra.referencia,
          };
          
          this.obraEncuestaService.crear(obraDto).subscribe({
            next: (obraCreada) => {
              console.log('Obra encuesta guardada exitosamente:', obraCreada);
              this.mensajeModal.set('Encuesta y datos de la obra guardados exitosamente');
              this.mostrarModalExito.set(true);
            },
            error: (errorObra) => {
              console.error('Error al guardar datos de la obra:', errorObra);
              // La encuesta se guardó pero hubo error en la obra
              this.mensajeModal.set('Encuesta guardada, pero hubo un error al guardar los datos de la obra. Por favor, intente nuevamente.');
              this.mostrarModalExito.set(true);
            }
          });
        } else {
          this.mensajeModal.set('Encuesta guardada exitosamente');
          this.mostrarModalExito.set(true);
        }
      },
      error: (error) => {
        console.error('Error al guardar encuesta:', error);
        this.mensajeModal.set('Error al guardar la encuesta. Por favor, intente nuevamente.');
        this.mostrarModalError.set(true);
      }
    });
  }

  toggleSeccion(seccion: string): void {
    if (this.seccionExpandida() === seccion) {
      this.seccionExpandida.set(null);
    } else {
      this.seccionExpandida.set(seccion);
      // Si se expande la sección de fabricante, cargar fabricantes si no están cargados
      if (seccion === 'fabricante' && !this.fabricantesCargados()) {
        this.cargarFabricantes();
      }
    }
  }

  esSeccionExpandida(seccion: string): boolean {
    return this.seccionExpandida() === seccion;
  }

  actualizarFechaEncuesta(event: Event): void {
    const input = event.target as HTMLInputElement;
    const fechaSeleccionada = input.value;
    
    const encuestaActual = this.encuesta();
    if (encuestaActual) {
      this.encuesta.set({
        ...encuestaActual,
        fechaEncuesta: fechaSeleccionada
      });
    }
  }

  actualizarAudioUrl(valor: string): void {
    const encuestaActual = this.encuesta();
    if (encuestaActual) {
      this.encuesta.set({
        ...encuestaActual,
        audioUrl: valor
      });
      this.detectarCambios();
    }
  }

  actualizarComentarioCuantitativo(valor: string): void {
    const encuestaActual = this.encuesta();
    if (encuestaActual) {
      this.encuesta.set({
        ...encuestaActual,
        comentarioCuantitativo: valor
      });
      this.detectarCambios();
    }
  }

  actualizarDatosObra(campo: 'etapaObra' | 'fechaFinalizacionObra' | 'mixer' | 'metraje' | 'resistencia', valor: string): void {
    const datosActuales = this.datosObra();
    this.datosObra.set({
      ...datosActuales,
      [campo]: valor
    });
    this.detectarCambios();
  }

  seleccionarTipoProducto(tipo: 'premezclado' | 'articulos'): void {
    const encuestaActual = this.encuesta();
    if (encuestaActual) {
      this.encuesta.set({
        ...encuestaActual,
        concretoPremezclado: tipo === 'premezclado' ? 1 : 0,
        articulosConcreto: tipo === 'articulos' ? 1 : 0
      });
    }
  }

  seleccionarLugarCompra(llave: string): void {
    const encuestaActual = this.encuesta();
    if (encuestaActual) {
      this.encuesta.set({
        ...encuestaActual,
        tipoLugarCompra: llave
      });
    }
  }

  seleccionarFabricante(fabricanteId: number | undefined): void {
    // Legacy: método obsoleto, ya no se usa con el nuevo modelo de marcasSeleccionadas
    // Mantener vacío o eliminar en limpieza final
  }

  onMarcaDropdownClick(): void {
    // Legacy: método obsoleto, ya no se usa con el nuevo modelo de marcasSeleccionadas
  }

  seleccionarNombreMarca(nombreMarca: string | undefined): void {
    // Legacy: método obsoleto, ya no se usa con el nuevo modelo de marcasSeleccionadas
  }

  seleccionarMarcaFabricante(marcaFabricanteId: number | undefined): void {
    // Legacy: método obsoleto, ya no se usa con el nuevo modelo de marcasSeleccionadas
  }

  seleccionarTipoCompraCemento(llave: string): void {
    const encuestaActual = this.encuesta();
    if (encuestaActual) {
      this.encuesta.set({
        ...encuestaActual,
        tipoCompra: llave,
        presentacionCompra: '', // Resetear presentación al cambiar tipo de compra
        cantidadPresentacionCompra: '' // Resetear cantidad al cambiar tipo de compra
      });
    }
  }

  seleccionarPresentacionCompra(llave: string): void {
    const encuestaActual = this.encuesta();
    if (encuestaActual) {
      this.encuesta.set({
        ...encuestaActual,
        presentacionCompra: llave,
        cantidadPresentacionCompra: '' // Resetear cantidad al cambiar presentación
      });
    }
  }

  seleccionarCantidadPresentacion(llave: string): void {
    const encuestaActual = this.encuesta();
    if (encuestaActual) {
      this.encuesta.set({
        ...encuestaActual,
        cantidadPresentacionCompra: llave
      });
    }
  }

  actualizarDescCompra(valor: string): void {
    const encuestaActual = this.encuesta();
    if (encuestaActual) {
      this.encuesta.set({
        ...encuestaActual,
        descCompra: valor && valor.trim() !== '' ? valor : undefined
      });
    }
  }

  actualizarPrecio(valor: string): void {
    const encuestaActual = this.encuesta();
    if (encuestaActual) {
      this.encuesta.set({
        ...encuestaActual,
        precio: valor || undefined
      });
    }
  }

  actualizarUsoCemento(valor: string): void {
    const encuestaActual = this.encuesta();
    if (encuestaActual) {
      this.encuesta.set({
        ...encuestaActual,
        usoCemento: valor.trim() || undefined
      });
    }
  }

  actualizarMotivoCompra(valor: string): void {
    const encuestaActual = this.encuesta();
    if (encuestaActual) {
      this.encuesta.set({
        ...encuestaActual,
        motivoCompra: valor.trim() || undefined
      });
    }
  }

  actualizarDeseoRegalo(valor: string): void {
    const encuestaActual = this.encuesta();
    if (encuestaActual) {
      this.encuesta.set({
        ...encuestaActual,
        deseoRegalo: valor ? Number(valor) : undefined
      });
    }
  }

  validarNumeroPositivo(event: KeyboardEvent): void {
    const char = event.key;
    const input = event.target as HTMLInputElement;
    const currentValue = input.value;
    
    // Permitir teclas de control
    if (event.ctrlKey || event.metaKey || 
        ['Backspace', 'Tab', 'Enter', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(char)) {
      return;
    }
    
    // Bloquear signo negativo, signo positivo y notación científica
    if (['-', '+', 'e', 'E'].includes(char)) {
      event.preventDefault();
      return;
    }
    
    // Permitir punto decimal solo si no hay uno ya
    if (char === '.' || char === ',') {
      if (currentValue.includes('.')) {
        event.preventDefault();
        return;
      }
      return;
    }
    
    // Solo permitir dígitos (0-9)
    if (!/^\d$/.test(char)) {
      event.preventDefault();
    }
  }

  validarBusquedaRuc(): void {
    // No mostrar error mientras escribe, solo al presionar Enter
    this.errorBusquedaRuc.set(false);
  }

  validarRucParaBusqueda(): boolean {
    const termino = this.terminoBusqueda().trim();
    
    if (this.tipoBusquedaEmpresa() === 'ruc') {
      // Verificar que solo tenga números
      const soloNumeros = /^\d+$/.test(termino);
      if (!soloNumeros) {
        this.errorBusquedaRuc.set(true);
        return false;
      }
      // Verificar que tenga exactamente 11 dígitos
      if (termino.length !== 11) {
        this.errorBusquedaRuc.set(true);
        return false;
      }
    }
    
    this.errorBusquedaRuc.set(false);
    return true;
  }

  tieneLetrasEnRuc(): boolean {
    const termino = this.terminoBusqueda().trim();
    return this.tipoBusquedaEmpresa() === 'ruc' && !/^\d*$/.test(termino) && termino.length > 0;
  }

  rucLongitudIncorrecta(): boolean {
    const termino = this.terminoBusqueda().trim();
    return this.tipoBusquedaEmpresa() === 'ruc' && /^\d+$/.test(termino) && termino.length !== 11;
  }

  volver(): void {
    this.router.navigate(['/encuestas']);
  }

  /**
   * Cargar observaciones de la encuesta
   */
  cargarObservaciones(encuestaId: number): void {
    this.observacionService.listarObservaciones(encuestaId).subscribe({
      next: (observaciones) => {
        const map = new Map<string, EncuestaObservacion>();
        const textoMap = new Map<string, string>();
        
        observaciones.forEach(obs => {
          map.set(obs.seccion, obs);
          textoMap.set(obs.seccion, obs.observacion);
        });
        
        this.observaciones.set(map);
        this.observacionesTexto.set(textoMap);

        // Cargar historial de observaciones para todos los usuarios
        this.cargarHistorialObservaciones(encuestaId);
      },
      error: (error) => {
        console.error('Error al cargar observaciones:', error);
      }
    });
  }

  /**
   * Cargar historial de observaciones para todos los usuarios
   */
  cargarHistorialObservaciones(encuestaId: number): void {
    this.historialObservacionService.listarPorEncuesta(encuestaId).subscribe({
      next: (historial) => {
        // Agrupar por sección
        const map = new Map<string, EncuestaObservacionHistorial[]>();
        
        // Verificar que historial no sea null
        if (historial && Array.isArray(historial)) {
          historial.forEach(item => {
            const lista = map.get(item.seccion) || [];
            lista.push(item);
            map.set(item.seccion, lista);
          });
        }
        
        this.historialObservaciones.set(map);
      },
      error: (error) => {
        console.error('Error al cargar historial de observaciones:', error);
        // Inicializar con Map vacío en caso de error
        this.historialObservaciones.set(new Map());
      }
    });
  }

  /**
   * Verificar si una sección tiene historial de observaciones
   */
  tieneHistorial(seccion: string): boolean {
    const historial = this.historialObservaciones().get(seccion);
    return !!historial && historial.length > 0;
  }

  /**
   * Alternar expansión de sección de historial
   */
  toggleHistorialSeccion(seccion: string): void {
    const expandidas = new Set(this.seccionesHistorialExpandidas());
    if (expandidas.has(seccion)) {
      expandidas.delete(seccion);
    } else {
      expandidas.add(seccion);
    }
    this.seccionesHistorialExpandidas.set(expandidas);
  }

  /**
   * Verificar si el historial de una sección está expandido
   */
  esHistorialExpandido(seccion: string): boolean {
    return this.seccionesHistorialExpandidas().has(seccion);
  }

  /**
   * Obtener historial de una sección ordenado por ciclo descendente
   */
  obtenerHistorialSeccion(seccion: string): EncuestaObservacionHistorial[] {
    return this.historialObservaciones().get(seccion) || [];
  }

  /**
   * Guardar observación de una sección
   */
  guardarObservacion(seccion: string): void {
    const encuestaId = this.encuesta()?.encuestaId;
    if (!encuestaId) return;

    // Obtener texto del Map (backend validará si está vacío)
    const observacion = this.obtenerObservacionTexto(seccion);

    // Marcar como guardando
    const guardandoMap = new Map(this.guardandoObservacion());
    guardandoMap.set(seccion, true);
    this.guardandoObservacion.set(guardandoMap);

    this.observacionService.guardarObservacion(encuestaId, seccion, observacion).subscribe({
      next: () => {
        // Actualizar estado de guardado
        guardandoMap.set(seccion, false);
        this.guardandoObservacion.set(guardandoMap);
        // Recargar observaciones para obtener datos actualizados
        this.cargarObservaciones(encuestaId);
      },
      error: (error) => {
        console.error('Error al guardar observación:', error);
        guardandoMap.set(seccion, false);
        this.guardandoObservacion.set(guardandoMap);
        
        // Mostrar error del backend en modal
        let mensajeError = 'Error al guardar la observación';
        if (error?.error?.errores && Array.isArray(error.error.errores) && error.error.errores.length > 0) {
          // Si hay array de errores, mostrar el primero
          mensajeError = error.error.errores[0];
        } else if (error?.error?.message) {
          mensajeError = error.error.message;
        } else if (error?.message) {
          mensajeError = error.message;
        }
        this.mensajeModal.set(mensajeError);
        this.mostrarModalError.set(true);
      }
    });
  }

  /**
   * Abrir modal para confirmar desestimar observación
   */
  abrirModalDesestimar(seccion: string): void {
    this.seccionDesestimar.set(seccion);
    this.mostrarModalDesestimar.set(true);
  }

  /**
   * Cerrar modal de desestimar observación
   */
  cerrarModalDesestimar(): void {
    this.mostrarModalDesestimar.set(false);
    this.seccionDesestimar.set('');
  }

  /**
   * Confirmar y eliminar observación de una sección
   */
  confirmarDesestimar(): void {
    const encuestaId = this.encuesta()?.encuestaId;
    const seccion = this.seccionDesestimar();
    
    if (!encuestaId || !seccion) return;

    this.procesandoDesestimar.set(true);

    // Usar el endpoint DELETE para eliminar la observación
    this.observacionService.eliminarObservacion(encuestaId, seccion).subscribe({
      next: () => {
        // Limpiar el texto local
        const textoMap = new Map(this.observacionesTexto());
        textoMap.set(seccion, '');
        this.observacionesTexto.set(textoMap);
        
        this.procesandoDesestimar.set(false);
        this.cerrarModalDesestimar();
        
        // Recargar observaciones
        this.cargarObservaciones(encuestaId);
      },
      error: (error) => {
        console.error('Error al eliminar observación:', error);
        this.procesandoDesestimar.set(false);
        this.mensajeModal.set('Error al desestimar la observación');
        this.mostrarModalError.set(true);
      }
    });
  }

  /**
   * Actualizar texto de observación
   */
  actualizarObservacionTexto(seccion: string, texto: string): void {
    const textoMap = new Map(this.observacionesTexto());
    textoMap.set(seccion, texto);
    this.observacionesTexto.set(textoMap);
  }

  /**
   * Verificar si es validador
   */
  esValidador(): boolean {
    return this.authService.getRolDescripcion() === ROLES.VALIDADOR;
  }

  /**
   * Verificar si es encuestador
   */
  esEncuestador(): boolean {
    return this.authService.getRolDescripcion() === ROLES.ENCUESTADOR;
  }

  /**
   * Verificar si el validador puede editar observaciones
   * Solo puede editar cuando la encuesta está en estado EN_REVISION (2)
   */
  puedeEditarObservaciones(): boolean {
    const encuesta = this.encuesta?.();
    const esValidador = this.esValidador();
    const estadoId = encuesta?.estado?.estadoId;
    return esValidador && estadoId === this.ESTADOS_ENCUESTA.EN_REVISION;
  }



  /**
   * Verificar si el validador o administrador puede ver observaciones en modo lectura
   * Puede ver cuando es validador/admin pero la encuesta ya fue procesada
   */
  puedeVerObservaciones(): boolean {
    const estadoId = this.encuesta()?.estadoId;
    const esValidador = this.esValidador();
    const esAdmin = this.authService.getRolDescripcion() === ROLES.ADMINISTRADOR;
    const esObservada = estadoId === ESTADOS_ENCUESTA.OBSERVADA;
    const esAprobado = estadoId === ESTADOS_ENCUESTA.APROBADO;
    const esCorreccion = estadoId === ESTADOS_ENCUESTA.EN_CORRECCION;
    return (esValidador || esAdmin) && (esObservada || esAprobado || esCorreccion);
  }

  /**
   * Verificar si el encuestador puede ver observaciones
   * Puede ver cuando es encuestador y la encuesta está OBSERVADA o EN_CORRECCION
   */
  encuestadorPuedeVerObservaciones(): boolean {
    const estadoId = this.encuesta()?.estadoId;
    const esEncuestador = this.esEncuestador();
    const esObservada = estadoId === ESTADOS_ENCUESTA.OBSERVADA;
    const esCorreccion = estadoId === ESTADOS_ENCUESTA.EN_CORRECCION;
    return esEncuestador && (esObservada || esCorreccion);
  }



  /**
   * Confirmar que el encuestador vio las observaciones y cambiar a EN_CORRECCION
   */
  confirmarVisualizacionObservaciones(): void {
    const encuestaActual = this.encuesta();
    if (!encuestaActual || !encuestaActual.encuestaId) {
      return;
    }

    this.procesandoCambioEstadoCorreccion.set(true);
    
    this.encuestasService.cambiarEstado(encuestaActual.encuestaId, ESTADOS_ENCUESTA.EN_CORRECCION).subscribe({
      next: (encuestaActualizada) => {
        this.encuesta.set(encuestaActualizada);
        this.mostrarModalEncuestaObservada.set(false);
        this.procesandoCambioEstadoCorreccion.set(false);
        this.mensajeModal.set('Ahora puede editar los campos observados');
        this.mostrarModalExito.set(true);
        setTimeout(() => {
          this.mostrarModalExito.set(false);
        }, 2000);
      },
      error: (error) => {
        console.error('Error al cambiar estado:', error);
        this.procesandoCambioEstadoCorreccion.set(false);
        this.mensajeModal.set('Error al cambiar el estado de la encuesta');
        this.mostrarModalError.set(true);
      }
    });
  }

  /**
   * Cancelar visualización y redirigir al listado
   */
  cancelarVisualizacionObservaciones(): void {
    this.router.navigate(['/encuestas']);
  }

  /**
   * Obtener texto de observación
   */
  obtenerObservacionTexto(seccion: string): string {
    return this.observacionesTexto().get(seccion) || '';
  }

  /**
   * Verificar si se está guardando observación
   */
  estaGuardandoObservacion(seccion: string): boolean {
    return this.guardandoObservacion().get(seccion) || false;
  }

  /**
   * Contar observaciones con texto
   */
  contarObservaciones(): number {
    let count = 0;
    this.observacionesTexto().forEach((texto) => {
      if (texto && texto.trim().length > 0) {
        count++;
      }
    });
    return count;
  }

  /**
   * Obtener secciones con observaciones
   */
  obtenerSeccionesConObservaciones(): string[] {
    const secciones: string[] = [];
    const seccionesNombres: { [key: string]: string } = {
      datos_encuesta: 'Datos Generales',
      datos_obra: 'Datos de la Obra',
      encuestado: 'Encuestado',
      fabricante: 'Fabricante',
      compra: 'Compra',
    };

    this.observacionesTexto().forEach((texto, seccion) => {
      if (texto && texto.trim().length > 0) {
        secciones.push(seccionesNombres[seccion] || seccion);
      }
    });

    return secciones;
  }

  /**
   * Verificar si hay observaciones
   */
  tieneObservaciones(): boolean {
    return this.contarObservaciones() > 0;
  }

  /**
   * Obtener total de registros en historial
   */
  obtenerHistorialTotal(): number {
    let total = 0;
    this.historialObservaciones().forEach((lista) => {
      total += lista.length;
    });
    return total;
  }

  /**
   * Abrir modal de transferencia
   */
  abrirModalTransferencia(): void {
    this.mostrarModalTransferencia.set(true);
  }

  /**
   * Cerrar modal de transferencia
   */
  cerrarModalTransferencia(): void {
    this.mostrarModalTransferencia.set(false);
  }

  /**
   * Transferir o aprobar encuesta según observaciones
   */
  confirmarTransferencia(): void {
    const encuestaId = this.encuesta()?.encuestaId;
    if (!encuestaId) return;

    this.procesandoTransferencia.set(true);

    // Si hay observaciones → OBSERVADA (6)
    // Si no hay observaciones → APROBADO (5)
    const nuevoEstado = this.tieneObservaciones()
      ? ESTADOS_ENCUESTA.OBSERVADA
      : ESTADOS_ENCUESTA.APROBADO;

    this.encuestasService.cambiarEstado(encuestaId, nuevoEstado).subscribe({
      next: () => {
        this.procesandoTransferencia.set(false);
        this.mostrarModalTransferencia.set(false);
        this.mensajeModal.set(
          this.tieneObservaciones()
            ? 'Encuesta devuelta al encuestador con observaciones'
            : 'Encuesta aprobada correctamente'
        );
        this.mostrarModalExito.set(true);
        
        setTimeout(() => {
          this.router.navigate(['/encuestas']);
        }, 2000);
      },
      error: (error) => {
        console.error('Error al transferir encuesta:', error);
        this.procesandoTransferencia.set(false);
        this.mostrarModalTransferencia.set(false);
        
        // Mostrar mensaje de error específico del backend
        const mensajeError = error?.error?.message || 'Error al procesar la encuesta';
        this.mensajeModal.set(mensajeError);
        this.mostrarModalError.set(true);
      }
    });
  }

  buscarEmpresa(): void {
    const termino = this.terminoBusqueda().trim();
    
    if (termino.length < 1) {
      this.empresasEncontradas.set([]);
      this.mostrarResultadosEmpresa.set(false);
      this.mostrarFormularioRegistro.set(false);
      return;
    }

    // Validar RUC si es búsqueda por RUC
    if (!this.validarRucParaBusqueda()) {
      // El error ya se muestra debajo del input
      return;
    }

    // Limpiar el formulario de registro cuando se hace una nueva búsqueda
    this.mostrarFormularioRegistro.set(false);
    this.nuevaEmpresa.set({
      razonSocial: '',
      ruc: '',
      tipoEmpresaId: 1,
      actividadEconomica: '',
      direccion: {
        codPais: '428',
        codDepartamento: '',
        codProvincia: '',
        codDistrito: '',
        tipoVia: '',
        nombreVia: '',
        numeroVia: '',
        referencia: ''
      }
    });

    this.buscandoEmpresa.set(true);
    this.mostrarResultadosEmpresa.set(true);

    // Usar el tipo de búsqueda seleccionado y limitar a 5 resultados
    const razonSocial = this.tipoBusquedaEmpresa() === 'razonSocial' ? termino : undefined;
    const ruc = this.tipoBusquedaEmpresa() === 'ruc' ? termino : undefined;

    this.empresasService.listar(1, 5, razonSocial, ruc).subscribe({
      next: (response) => {
        this.empresasEncontradas.set(response.data);
        this.buscandoEmpresa.set(false);
        
        // Si no hay resultados, mostrar modal de confirmación
        if (response.data.length === 0) {
          this.mostrarModalNoEncontrada.set(true);
          this.mostrarResultadosEmpresa.set(false);
        }
      },
      error: (error) => {
        console.error('Error al buscar empresas:', error);
        this.buscandoEmpresa.set(false);
        this.empresasEncontradas.set([]);
      }
    });
  }

  seleccionarEmpresa(empresa: Empresa): void {
    const encuestaActual = this.encuesta();
    if (encuestaActual) {
      // Guardar solo los campos necesarios: id, empresaId, tipoEncuesta, tipoEncuestaValor y fechaEncuesta
      const encuestaActualizada: Partial<Encuesta> = {
        encuestaId: encuestaActual.encuestaId,
        empresaId: empresa.empresaId,
        tipoEncuesta: encuestaActual.tipoEncuesta,
        tipoEncuestaValor: encuestaActual.tipoEncuestaValor,
        fechaEncuesta: encuestaActual.fechaEncuesta
      };
      
      this.encuestasService.guardar(encuestaActualizada).subscribe({
        next: (encuestaGuardada) => {
          this.procesarEncuesta(encuestaGuardada);
          this.empresaSeleccionada.set(empresa);
          this.mostrarResultadosEmpresa.set(false);
          this.terminoBusqueda.set(`${empresa.razonSocial} (RUC: ${empresa.ruc})`);
        },
        error: (error) => {
          console.error('Error al actualizar encuesta:', error);
          this.mensajeModal.set('Error al asignar la empresa a la encuesta');
          this.mostrarModalError.set(true);
        }
      });
    }
  }

  cerrarResultadosEmpresa(): void {
    this.mostrarResultadosEmpresa.set(false);
  }

  confirmarRegistroEmpresa(): void {
    this.mostrarModalNoEncontrada.set(false);
    this.mostrarFormularioRegistro.set(true);
    
    const termino = this.terminoBusqueda().trim();
    
    // Pre-llenar el campo según el tipo de búsqueda
    if (this.tipoBusquedaEmpresa() === 'ruc') {
      this.nuevaEmpresa.set({ ...this.nuevaEmpresa(), ruc: termino });
    } else {
      this.nuevaEmpresa.set({ ...this.nuevaEmpresa(), razonSocial: termino });
    }
  }

  confirmarRegistroEncuestado(): void {
    this.mostrarModalNoEncontradaEncuestado.set(false);
    this.mostrarFormularioRegistroEncuestado.set(true);

    const termino = this.terminoBusquedaEncuestado().trim();
    // Siempre pre-llenamos con el nombre buscado
    this.nuevoEncuestado = { ...this.nuevoEncuestado, nombres: termino };
  }

  cerrarModalNoEncontrada(): void {
    this.mostrarModalNoEncontrada.set(false);
  }

  cerrarModalNoEncontradaEncuestado(): void {
    this.mostrarModalNoEncontradaEncuestado.set(false);
  }

  cancelarRegistroEmpresa(): void {
    this.mostrarFormularioRegistro.set(false);
    this.errorRucRegistro.set('');
    this.nuevaEmpresa.set({
      razonSocial: '',
      ruc: '',
      tipoEmpresaId: 1,
      actividadEconomica: '',
      direccion: {
        codPais: '428',
        codDepartamento: '',
        codProvincia: '',
        codDistrito: '',
        tipoVia: '',
        nombreVia: '',
        numeroVia: '',
        referencia: ''
      }
    });
    // Recargar departamentos para Perú
    this.cargarDepartamentos('428');
  }

  validarRucRegistro(): void {
    const ruc = this.nuevaEmpresa().ruc || '';
    
    if (ruc.length === 0) {
      this.errorRucRegistro.set('');
      return;
    }

    const soloNumeros = /^\d+$/.test(ruc);
    if (!soloNumeros) {
      this.errorRucRegistro.set('El RUC debe contener solo números');
      return;
    }

    if (ruc.length !== 11) {
      this.errorRucRegistro.set('El RUC debe tener exactamente 11 dígitos');
      return;
    }

    this.errorRucRegistro.set('');
  }

  guardarNuevaEmpresa(): void {
    const empresa = this.nuevaEmpresa();

    // Validar que todos los campos obligatorios estén completos, incluyendo dirección
    if (!empresa.razonSocial || !empresa.ruc || !empresa.tipoEmpresaId || !empresa.actividadEconomica || !empresa.direccion) {
      this.mensajeModal.set('Todos los campos son obligatorios, incluyendo la dirección');
      this.mostrarModalError.set(true);
      return;
    }

    const dir = empresa.direccion;
    if (
      dir.codPais === undefined || dir.codDepartamento === undefined || dir.codProvincia === undefined ||
      dir.codDistrito === undefined || !dir.tipoVia || !dir.nombreVia
    ) {
      this.mensajeModal.set('Los campos de país, departamento, provincia, distrito, tipo de vía y nombre de vía son obligatorios');
      this.mostrarModalError.set(true);
      return;
    }

    // Validar formato y longitud del RUC
    const soloNumeros = /^\d+$/.test(empresa.ruc);
    if (!soloNumeros) {
      this.errorRucRegistro.set('El RUC debe contener solo números');
      return;
    }
    if (empresa.ruc.length !== 11) {
      this.errorRucRegistro.set('El RUC debe tener exactamente 11 dígitos');
      return;
    }

    this.errorRucRegistro.set('');
    this.guardandoEmpresa.set(true);

    // Establecer tipo de referencia como CONSTRUCTORA para la dirección
    if (empresa.direccion) {
      (empresa.direccion as any).tipoReferencia = TIPO_REFERENCIA.CONSTRUCTORA;
    }

    // Paso 1: Crear la empresa
    this.empresasService.crear(empresa).subscribe({
      next: (empresaCreada) => {
        // Paso 2: Guardar la encuesta completa con el ID de la empresa creada
        const encuestaActual = this.encuesta();
        if (encuestaActual) {
          const encuestaActualizada: Partial<Encuesta> = {
            encuestaId: encuestaActual.encuestaId,
            empresaId: empresaCreada.empresaId,
            tipoEncuesta: encuestaActual.tipoEncuesta,
            tipoEncuestaValor: encuestaActual.tipoEncuestaValor,
            fechaEncuesta: encuestaActual.fechaEncuesta
          };
          
          this.encuestasService.guardar(encuestaActualizada).subscribe({
            next: (encuestaGuardada) => {
              this.guardandoEmpresa.set(false);
              this.mostrarFormularioRegistro.set(false);
              
              // Actualizar la encuesta y la empresa seleccionada
              this.procesarEncuesta(encuestaGuardada);
              this.empresaSeleccionada.set(empresaCreada);
              this.terminoBusqueda.set(`${empresaCreada.razonSocial} (RUC: ${empresaCreada.ruc})`);
              
              // Resetear el formulario
              this.nuevaEmpresa.set({
                razonSocial: '',
                ruc: '',
                tipoEmpresaId: 1,
                actividadEconomica: '',
                direccion: {
                  codPais: '428',
                  codDepartamento: '',
                  codProvincia: '',
                  codDistrito: '',
                  tipoVia: '',
                  nombreVia: '',
                  numeroVia: '',
                  referencia: ''
                }
              });
              
              this.mensajeModal.set('Empresa registrada y asignada correctamente');
              this.mostrarModalExito.set(true);
            },
            error: (error) => {
              console.error('Error al actualizar encuesta:', error);
              this.guardandoEmpresa.set(false);
              this.mensajeModal.set('Empresa creada, pero error al asignarla a la encuesta');
              this.mostrarModalError.set(true);
            }
          });
        } else {
          this.guardandoEmpresa.set(false);
          this.mensajeModal.set('Error: No se pudo obtener el ID de la encuesta');
          this.mostrarModalError.set(true);
        }
      },
      error: (error) => {
        console.error('Error al guardar empresa:', error);
        this.guardandoEmpresa.set(false);
        
        if (error.status === 409) {
          this.mostrarModalRucDuplicado.set(true);
        } else {
          this.mensajeModal.set('Error al guardar la empresa');
          this.mostrarModalError.set(true);
        }
      }
    });
  }

  cerrarModalRucDuplicado(): void {
    this.mostrarModalRucDuplicado.set(false);
  }

  cerrarModalExito(): void {
    this.mostrarModalExito.set(false);
  }

  cerrarModalError(): void {
    this.mostrarModalError.set(false);
  }

  cambiarEmpresa(): void {
    this.empresaSeleccionada.set(null);
    this.terminoBusqueda.set('');
  }

  // ==================== MÉTODOS DE ENCUESTADO ====================

  buscarEncuestado(): void {
    const termino = this.terminoBusquedaEncuestado().trim();
    
    if (termino.length < 1) {
      this.encuestadosEncontrados.set([]);
      this.mostrarResultadosEncuestado.set(false);
      this.mostrarFormularioRegistroEncuestado.set(false);
      return;
    }

    // Validar el término de búsqueda
    if (!this.validarEncuestadoParaBusqueda()) {
      return;
    }

    // Limpiar el formulario de registro cuando se hace una nueva búsqueda
    this.mostrarFormularioRegistroEncuestado.set(false);
    this.nuevoEncuestado = {
      nombres: '',
      apepat: '',
      cargo: '',
      tipoContacto: '',
      contacto: ''
    };

    this.buscandoEncuestado.set(true);
    this.mostrarResultadosEncuestado.set(true);

    // Buscar siempre por nombres, limitar a 5 resultados
    this.encuestadosService.listar(1, 5, termino, undefined).subscribe({
      next: (response) => {
        console.log('Respuesta del servicio de encuestados:', response);
        this.encuestadosEncontrados.set(response.data);
        this.buscandoEncuestado.set(false);
        
        // Si no hay resultados, mostrar formulario de registro directamente
        if (response.data.length === 0) {
          console.log('No hay resultados, mostrando formulario de registro');
          // this.mostrarFormularioRegistroEncuestado.set(true);
          this.mostrarModalNoEncontradaEncuestado.set(true);
          this.mostrarResultadosEncuestado.set(false);
          
          // Pre-llenar el campo nombres con el término buscado
          this.nuevoEncuestado = { ...this.nuevoEncuestado, nombres: termino };
          console.log('Estado después de setear:', {
            mostrarFormulario: this.mostrarFormularioRegistroEncuestado(),
            mostrarResultados: this.mostrarResultadosEncuestado(),
            nuevoEncuestado: this.nuevoEncuestado
          });
        }
      },
      error: (error) => {
        console.error('Error al buscar encuestados:', error);
        this.buscandoEncuestado.set(false);
        this.encuestadosEncontrados.set([]);
      }
    });
  }

  seleccionarEncuestado(encuestado: Encuestado): void {
    const encuestaActual = this.encuesta();
    if (encuestaActual) {
      // Actualizar la encuesta solo con el encuestadoId
      this.encuestasService.guardar({
        encuestaId: encuestaActual.encuestaId,
        encuestadoId: encuestado.encuestadoId
      } as Partial<Encuesta>).subscribe({
        next: (encuestaGuardada) => {
          this.procesarEncuesta(encuestaGuardada);
          this.encuestadoSeleccionado.set(encuestado);
          this.mostrarResultadosEncuestado.set(false);
          this.terminoBusquedaEncuestado.set('');
        },
        error: (error) => {
          console.error('Error al actualizar encuesta con encuestado:', error);
          this.mensajeModal.set('Error al asignar el encuestado a la encuesta');
          this.mostrarModalError.set(true);
        }
      });
    }
  }

  cambiarEncuestado(): void {
    this.encuestadoSeleccionado.set(null);
    this.terminoBusquedaEncuestado.set('');
  }

  validarBusquedaEncuestado(): void {
    // Limpiar el error mientras escribe
    this.errorBusquedaEncuestado.set('');
  }

  validarEncuestadoParaBusqueda(): boolean {
    const termino = this.terminoBusquedaEncuestado().trim();
    
    if (termino.length < 1) {
      this.errorBusquedaEncuestado.set('Debe ingresar un término de búsqueda');
      return false;
    }

    // Validar que tenga al menos 3 caracteres
    if (termino.length < 3) {
      this.errorBusquedaEncuestado.set('Debe ingresar al menos 3 caracteres');
      return false;
    }
    
    // Validar que solo contenga letras, espacios, tildes y ñ
    const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(termino);
    if (!soloLetras) {
      this.errorBusquedaEncuestado.set('Solo debe contener letras, espacios y tildes');
      return false;
    }
    
    this.errorBusquedaEncuestado.set('');
    return true;
  }

  cancelarRegistroEncuestado(): void {
    this.mostrarFormularioRegistroEncuestado.set(false);
    this.errorContactoEncuestado.set('');
    this.nuevoEncuestado = {
      nombres: '',
      apepat: '',
      cargo: '',
      tipoContacto: '',
      contacto: ''
    };
  }

  validarContactoEncuestado(): void {
    // Limpiar el error mientras escribe
    this.errorContactoEncuestado.set('');
  }

  obtenerPlaceholderContacto(): string {
    const tipo = this.nuevoEncuestado.tipoContacto;
    if (!tipo) return 'Seleccione primero un tipo de contacto';
    
    if (tipo === 'EMAIL') {
      return 'ejemplo@correo.com';
    } else if (tipo === 'TELEFONO' || tipo === 'CELULAR' || tipo === 'WHATSAPP') {
      return 'Ingrese número (9 dígitos)';
    }
    return 'Ingrese contacto';
  }

  validarContactoParaGuardar(): boolean {
    const contacto = this.nuevoEncuestado.contacto?.trim() || '';
    const tipo = this.nuevoEncuestado.tipoContacto;

    if (!contacto) {
      this.errorContactoEncuestado.set('El contacto es obligatorio');
      return false;
    }

    // Validar email
    if (tipo === 'EMAIL') {
      if (contacto.length > 100) {
        this.errorContactoEncuestado.set(`El correo no puede exceder 100 caracteres (actual: ${contacto.length})`);
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contacto)) {
        this.errorContactoEncuestado.set('Ingrese un correo electrónico válido');
        return false;
      }
    }

    // Validar teléfonos (deben ser exactamente 9 dígitos numéricos)
    if (tipo === 'TELEFONO' || tipo === 'CELULAR' || tipo === 'WHATSAPP') {
      const soloNumeros = /^\d+$/.test(contacto);
      if (!soloNumeros) {
        this.errorContactoEncuestado.set('El número debe contener solo dígitos');
        return false;
      }
      if (contacto.length !== 9) {
        this.errorContactoEncuestado.set(`El número debe tener exactamente 9 dígitos (actual: ${contacto.length})`);
        return false;
      }
    }

    this.errorContactoEncuestado.set('');
    return true;
  }

  guardarNuevoEncuestado(): void {
    const encuestado = this.nuevoEncuestado;
    
    // Validar que solo los campos obligatorios estén completos (nombres, cargo)
    if (!encuestado.nombres || !encuestado.cargo) {
      this.mensajeModal.set('Los campos Nombre y Cargo son obligatorios');
      this.mostrarModalError.set(true);
      return;
    }

    // Validar el formato del contacto según el tipo (si se proporcionó)
    if (encuestado.tipoContacto && encuestado.contacto) {
      if (!this.validarContactoParaGuardar()) {
        return;
      }
    }

    this.guardandoEncuestado.set(true);
    
    // Crear el encuestado
    this.encuestadosService.crear(encuestado).subscribe({
      next: (encuestadoCreado) => {
        // Guardar la encuesta solo con el ID del encuestado creado
        const encuestaActual = this.encuesta();
        if (encuestaActual) {
          this.encuestasService.guardar({
            encuestaId: encuestaActual.encuestaId,
            encuestadoId: encuestadoCreado.encuestadoId
          } as Partial<Encuesta>).subscribe({
            next: (encuestaGuardada) => {
              this.guardandoEncuestado.set(false);
              this.mostrarFormularioRegistroEncuestado.set(false);
              
              // Actualizar la encuesta y el encuestado seleccionado
              this.procesarEncuesta(encuestaGuardada);
              this.encuestadoSeleccionado.set(encuestadoCreado);
              this.terminoBusquedaEncuestado.set('');
              
              // Resetear el formulario
              this.nuevoEncuestado = {
                nombres: '',
                apepat: '',
                cargo: '',
                tipoContacto: '',
                contacto: ''
              };
              
              this.mensajeModal.set('Encuestado registrado y asignado correctamente');
              this.mostrarModalExito.set(true);
            },
            error: (error) => {
              console.error('Error al actualizar encuesta:', error);
              this.guardandoEncuestado.set(false);
              this.mensajeModal.set('Encuestado creado, pero error al asignarlo a la encuesta');
              this.mostrarModalError.set(true);
            }
          });
        } else {
          this.guardandoEncuestado.set(false);
          this.mensajeModal.set('Error: No se pudo obtener el ID de la encuesta');
          this.mostrarModalError.set(true);
        }
      },
      error: (error) => {
        console.error('Error al guardar encuestado:', error);
        this.guardandoEncuestado.set(false);
        this.mensajeModal.set('Error al guardar el encuestado');
        this.mostrarModalError.set(true);
      }
    });
  }

  // Determina si una sección está completa
  seccionCompleta(seccion: string): boolean {
    switch (seccion) {
      case 'datosGenerales':
        // Considera completa si tipoEncuesta y fechaEncuesta existen
        return !!(this.encuesta()?.tipoEncuesta && this.encuesta()?.fechaEncuesta);
      case 'empresa':
        // Sección de empresa completa si hay una empresa seleccionada
        return !!this.empresaSeleccionada();
      case 'datosObra':
        // Requiere etapaObra y fechaFinalizacionObra
        return !!(this.datosObra()?.etapaObra && this.datosObra()?.fechaFinalizacionObra);
      case 'encuestado':
        return !!this.encuestadoSeleccionado();
      case 'fabricante':
        // Requiere al menos una marca/fabricante válida con todos los campos obligatorios
        return this.marcasSeleccionadas().some(m => 
          m.marcaFabricanteId && 
          m.fabricanteId && 
          m.tipoCemento && 
          m.descFisica
        );
      case 'compra':
        const enc = this.encuesta();
        if (!enc?.tipoCompra || !enc?.tipoLugarCompra || !enc?.descCompra || enc?.precio == null) {
          return false;
        }
        // Validar campos específicos según el tipo de compra
        if (enc.tipoCompra === 'BOLSAS') {
          return !!enc.cantidadPresentacionCompra;
        }
        if (enc.tipoCompra === 'GRANEL') {
          return !!(enc.presentacionCompra && enc.cantidadPresentacionCompra);
        }
        return true;
      case 'uso':
        return !!(
          this.encuesta()?.motivoCompra &&
          this.encuesta()?.deseoRegalo != null
        );
      default:
        return false;
    }
  }

  // Determina si todas las secciones están completas
  todasLasSeccionesCompletas(): boolean {
    const secciones = ['datosGenerales', 'datosObra', 'encuestado', 'fabricante', 'compra'];
    return secciones.every(seccion => this.seccionCompleta(seccion));
  }

  // Determina si los campos deben estar deshabilitados
  camposDeshabilitados(): boolean {
    return !this.esEditable();
  }

  /**
   * Detectar si hay cambios sin guardar
   */
  detectarCambios(): void {
    const original = this.encuestaOriginal();
    const actual = this.encuesta();
    
    if (!original || !actual) {
      this.tieneCambiosSinGuardar.set(false);
      return;
    }

    // Comparar campos relevantes (sin fabricanteId ni marcaFabricante)
    const hayCambios = 
      original.fechaEncuesta !== actual.fechaEncuesta ||
      original.encuestadoId !== actual.encuestadoId ||
      original.tipoLugarCompra !== actual.tipoLugarCompra ||
      original.tipoCompra !== actual.tipoCompra ||
      original.presentacionCompra !== actual.presentacionCompra ||
      original.cantidadPresentacionCompra !== actual.cantidadPresentacionCompra ||
      original.concretoPremezclado !== actual.concretoPremezclado ||
      original.articulosConcreto !== actual.articulosConcreto ||
      original.audioUrl !== actual.audioUrl ||
      original.comentarioCuantitativo !== actual.comentarioCuantitativo ||
      original.precio !== actual.precio ||
      original.usoCemento !== actual.usoCemento ||
      original.motivoCompra !== actual.motivoCompra ||
      original.deseoRegalo !== actual.deseoRegalo ||
      original.descCompra !== actual.descCompra;

    this.tieneCambiosSinGuardar.set(hayCambios);
  }

  completarEncuesta(): void {
    const encuestaActual = this.encuesta();
    if (!encuestaActual || !encuestaActual.encuestaId) {
      this.mensajeModal.set('No hay datos de encuesta para completar');
      this.mostrarModalError.set(true);
      return;
    }

    // Validar que todas las secciones estén completas
    if (!this.todasLasSeccionesCompletas()) {
      this.mensajeModal.set('Debe completar todas las secciones antes de finalizar la encuesta');
      this.mostrarModalError.set(true);
      return;
    }

    // Validar que no haya cambios sin guardar
    this.detectarCambios();
    if (this.tieneCambiosSinGuardar()) {
      this.mensajeModal.set('Tiene cambios sin guardar. Por favor, guarde los cambios antes de completar la encuesta.');
      this.mostrarModalError.set(true);
      return;
    }

    // Cambiar estado a TRANSFERIDO usando el nuevo endpoint
    this.encuestasService.cambiarEstado(encuestaActual.encuestaId, ESTADOS_ENCUESTA.TRANSFERIDO).subscribe({
      next: (encuestaActualizada) => {
        // Si viene marcaFabricanteInfo, extraer los campos para mostrarlos
        if (encuestaActualizada.marcaFabricanteInfo) {
          encuestaActualizada.nombreMarca = encuestaActualizada.marcaFabricanteInfo.nombreMarca || undefined;
          encuestaActualizada.tipoCemento = encuestaActualizada.marcaFabricanteInfo.tipoCemento;
          encuestaActualizada.descFisica = encuestaActualizada.marcaFabricanteInfo.descFisica || undefined;
        }
        
        this.encuesta.set(encuestaActualizada);
        this.mensajeModal.set('Encuesta completada y transferida exitosamente');
        this.mostrarModalExito.set(true);
        // Redirigir al listado después de 1 segundo
        setTimeout(() => {
          this.router.navigate(['/encuestas']);
        }, 1000);
      },
      error: (error) => {
        console.error('Error al completar encuesta:', error);
        this.mensajeModal.set('Error al completar la encuesta. Por favor, intente nuevamente.');
        this.mostrarModalError.set(true);
      }
    });
  }
}
