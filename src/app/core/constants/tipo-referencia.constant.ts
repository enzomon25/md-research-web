/**
 * Constantes para tipos de referencia en el sistema
 * Se utiliza en la tabla 'direccion' para diferenciar si una dirección pertenece a una empresa u obra
 */
export const TIPO_REFERENCIA = {
  EMPRESA: 'EMPRESA',
  OBRA: 'OBRA',
} as const;

export type TipoReferencia = (typeof TIPO_REFERENCIA)[keyof typeof TIPO_REFERENCIA];
