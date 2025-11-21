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

export interface Encuesta {
  encuestaId?: number;
  encuestadoId?: number;
  encuestado?: Encuestado;
  empresaId?: number;
  fabricanteId?: number;
  nombreMarca?: string;
  tipoCemento?: string;
  descFisica?: string;
  marcaFabricante?: number;
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
  precio?: number;
  conIgv?: number;
  fechaCreacion?: string;
  usuarioCreacion?: string;
  fechaModificacion?: string;
  usuarioModificacion?: string;
  indActivo?: number;
  empresa?: Empresa | null;
  fabricante?: Fabricante | null;
}

export interface Empresa {
  empresaId: number;
  razonSocial: string;
  ruc: string;
  tipoEmpresaId: number;
  condicionContribuyente?: string;
  tamanoEmpresa?: string;
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
