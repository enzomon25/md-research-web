/**
 * Roles del sistema
 */
export const ROLES = {
  ENCUESTADOR: 'Encuestador',
  ADMINISTRADOR: 'Administrador',
  VALIDADOR: 'Validador',
} as const;

/**
 * Tipo para los roles del sistema
 */
export type RolDescripcion = typeof ROLES[keyof typeof ROLES];
