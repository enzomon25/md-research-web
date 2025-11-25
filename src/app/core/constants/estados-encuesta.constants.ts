/**
 * Estados de encuesta (por ID)
 */
export const ESTADOS_ENCUESTA = {
  EN_REGISTRO: 1,
  EN_REVISION: 2,
  TRANSFERIDO: 3,
  EN_CORRECCION: 4,
  APROBADO: 5,
  OBSERVADA: 6,
} as const;

/**
 * Nombres de estados de encuesta
 */
export const NOMBRES_ESTADOS_ENCUESTA = {
  [ESTADOS_ENCUESTA.EN_REGISTRO]: 'En registro',
  [ESTADOS_ENCUESTA.EN_REVISION]: 'En revisión',
  [ESTADOS_ENCUESTA.TRANSFERIDO]: 'Transferido',
  [ESTADOS_ENCUESTA.EN_CORRECCION]: 'En corrección',
  [ESTADOS_ENCUESTA.APROBADO]: 'Aprobado',
  [ESTADOS_ENCUESTA.OBSERVADA]: 'Observada',
} as const;

/**
 * Tipo para los IDs de estados de encuesta
 */
export type EstadoEncuestaId = typeof ESTADOS_ENCUESTA[keyof typeof ESTADOS_ENCUESTA];
