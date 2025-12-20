/**
 * Constantes para tipos de referencia
 * Usadas para diferencias direcciones de OBRA vs EMPRESA vs CONSTRUCTORA
 */
export const TIPO_REFERENCIA = {
  EMPRESA: 'EMPRESA',
  OBRA: 'OBRA',
  CONSTRUCTORA: 'CONSTRUCTORA',
} as const;

export type TipoReferencia = (typeof TIPO_REFERENCIA)[keyof typeof TIPO_REFERENCIA];
