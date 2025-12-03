export interface Parametro {
  parametroId: number;
  categoria: string;
  llave: string;
  valor: string;
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaModificacion: string;
  usuarioModificacion: string;
  indActivo: number;
}

export interface MarcaFabricanteInfo {
  marcaFabricanteId: number;
  fabricanteId: number;
  nombreMarca: string | null;
  tipoCemento: string;
  marca: string;
  subMarca: string | null;
  descFisica: string | null;
}

export interface Fabricante {
  fabricanteId: number;
  razonSocial: string;
  ruc: string | null;
}

export interface Encuestado {
  encuestadoId?: number;
  nombres?: string;
  apepat?: string;
  apemat?: string;
  numdoc?: string;
  tipodoc?: string;
  cargo?: string;
  tipoContacto?: string;
  contacto?: string;
}

export interface Estado {
  estadoId: number;
  descripcionEstado: string;
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaModificacion: string;
  usuarioModificacion: string;
  indActivo: number;
}

export interface Encuesta {
  encuestaId?: number;
  encuestadoId?: number;
  encuestado?: Encuestado;
  empresaId?: number;
  nombreMarca?: string;
  tipoCemento?: string;
  descFisica?: string;
  marcaFabricanteInfo?: MarcaFabricanteInfo;
  estadoEncuesta?: number;
  estadoId: number;
  estadoValor?: string;
  tipoEncuesta: string;
  tipoEncuestaValor?: string;
  concretoPremezclado: number;
  articulosConcreto: number;
  tipoLugarCompra?: string;
  tipoCompra?: string;
  presentacionCompra?: string;
  cantidadPresentacionCompra?: string;
  descCompra?: string;
  usoCemento?: string;
  motivoCompra?: string;
  deseoRegalo?: number;
  fechaEncuesta?: string;
  precio?: string;
  fechaCreacion?: string;
  usuarioCreacion?: string;
  fechaModificacion?: string;
  usuarioModificacion?: string;
  indActivo?: number;
  empresa?: Empresa | null;
  estado?: Estado;
  estados?: Array<{
    encuestaEstadoId: number;
    estadoId: number;
    estadoDescripcion: string;
    encuestaId: number;
    fechaCreacion: string;
    usuarioCreacion: string;
    fechaModificacion: string;
    usuarioModificacion: string;
    indActivo: number;
  }>;
  marcas?: Array<{ marcaFabricanteId: number; fabricanteId: number }>;
  editable?: boolean;
}

export interface Direccion {
  codPais: string;
  codDepartamento: string;
  codProvincia: string;
  codDistrito: string;
  tipoVia: string;
  nombreVia: string;
  numeroVia: string;
  referencia: string;
}

export interface Empresa {
  direccion: Direccion;
  empresaId: number;
  razonSocial: string;
  ruc: string;
  tipoEmpresaId: number;
  tamanoEmpresaTop10k?: string;
  actividadEconomica?: string;
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaModificacion: string;
  usuarioModificacion: string;
  indActivo: number;
}

export interface TipoEmpresa {
  tipoEmpresaId: number;
  descripcionTipoEmpresa: string;
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaModificacion: string;
  usuarioModificacion: string;
  indActivo: number;
}

export interface PaginacionRespuesta<T> {
  data: T[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

export interface EncuestaObservacion {
  observacionId: number;
  encuestaId: number;
  seccion: string;
  observacion: string;
  usuarioId: number;
  fechaCreacion: string;
  fechaModificacion: string;
  usuarioCreacion: string;
  usuarioModificacion: string;
}

export interface EncuestaObservacionHistorial {
  historialId: number;
  encuestaId: number;
  seccion: string;
  texto: string;
  fechaArchivado: string;
  usuarioValidador: string;
  cicloRevision: number;
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaModificacion: string;
  usuarioModificacion: string;
  indActivo: number;
}
