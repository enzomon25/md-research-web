// ✅ REGLA 10: Imports organizados
// 1. Angular Core
import { Component, signal, computed, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// 2. Angular Router
import { Router } from '@angular/router';

// 3. Services propios
import { UsuariosService } from '../../core/services/usuarios.service';
import { AuthService } from '../../core/services/auth.service';
import { ModulosService, Modulo } from '../../core/services/modulos.service';

// 4. Models e Interfaces
import { Usuario, PaginacionRespuesta } from '../../core/models';

/**
 * Component para listar y gestionar usuarios
 * Solo accesible por ADMINISTRADOR
 * ✅ Aplica TODAS las reglas obligatorias desde el inicio
 */
@Component({
  selector: 'app-usuarios-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios-list.component.html',
  styleUrl: './usuarios-list.component.scss'
})
export class UsuariosListComponent implements OnInit {
  // ✅ REGLA 3: Usar inject() en lugar de constructor
  private usuariosService = inject(UsuariosService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private modulosService = inject(ModulosService);

  // ✅ REGLA 8: Signals para estado de UI
  usuarios = signal<Usuario[]>([]);
  paginaActual = signal(1);
  totalPaginas = signal(0);
  total = signal(0);
  cargando = signal(false);

  // Modales
  mostrarConfirmacionEstado = signal(false);
  usuarioEstadoPendiente = signal<Usuario | null>(null);
  nuevoEstadoPendiente = signal<boolean | null>(null);
  cambiandoEstado = signal(false);
  errorCambioEstado = signal<string | null>(null);
  
  // Sidebar y UI
  modulos = signal<Modulo[]>([]);
  mostrarMenuUsuario = signal(false);
  readonly MODULOS_KEYS = { ENCUESTAS: 'ENCUESTAS', USUARIOS: 'USUARIOS' };
  
  // Filtros (variables normales para ngModel bidireccional)
  filtroNombre = '';
  filtroUsername = '';
  filtroActivo: 'todos' | 'activos' | 'inactivos' = 'todos';
  
  // ✅ REGLA 4: Computed signals para valores derivados
  usuariosFiltrados = computed(() => {
    const usuarios = this.usuarios();
    let filtrados = usuarios;

    // Filtrar por nombre
    if (this.filtroNombre) {
      const nombreLower = this.filtroNombre.toLowerCase();
      filtrados = filtrados.filter(u =>
        `${u.nombres} ${u.apepat} ${u.apemat}`.toLowerCase().includes(nombreLower)
      );
    }

    // Filtrar por username
    if (this.filtroUsername) {
      const usernameLower = this.filtroUsername.toLowerCase();
      filtrados = filtrados.filter(u =>
        u.username.toLowerCase().includes(usernameLower)
      );
    }

    // Filtrar por estado
    if (this.filtroActivo === 'activos') {
      filtrados = filtrados.filter(u => u.indActivo === 1);
    } else if (this.filtroActivo === 'inactivos') {
      filtrados = filtrados.filter(u => u.indActivo === 0);
    }

    return filtrados;
  });

  ngOnInit(): void {
    this.cargarUsuarios();
    this.cargarModulos();
  }
  
  /**
   * Carga los módulos disponibles para el usuario
   */
  cargarModulos(): void {
    this.modulosService.obtenerModulosDisponibles().subscribe({
      next: (modulos) => {
        this.modulos.set(modulos);
      },
      error: (error) => {
        console.error('Error al cargar módulos:', error);
      }
    });
  }

  /**
   * Carga usuarios desde el backend
   */
  cargarUsuarios(): void {
    this.cargando.set(true);

    this.usuariosService.listar(this.paginaActual(), 50).subscribe({
      next: (respuesta: PaginacionRespuesta<Usuario>) => {
        this.usuarios.set(respuesta.data);
        this.totalPaginas.set(respuesta.totalPaginas);
        this.total.set(respuesta.total);
        this.cargando.set(false);
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        this.cargando.set(false);
        // ✅ REGLA 6: El error interceptor maneja errores globalmente
      }
    });
  }

  /**
   * Cambia el estado (activo/inactivo) de un usuario
   * ✅ Usa UUID por seguridad
   * @param usuario Usuario a cambiar estado
   */
  cambiarEstadoUsuario(usuario: Usuario, nuevoEstado?: boolean): void {
    const estadoDestino = nuevoEstado ?? (usuario.indActivo === 1 ? false : true);
    this.cambiandoEstado.set(true);
    this.errorCambioEstado.set(null);
    this.usuariosService.cambiarEstado(usuario.userUuid, estadoDestino).subscribe({
      next: () => {
        // Actualizar el estado local usando userUuid
        const usuariosActualizados = this.usuarios().map(u =>
          u.userUuid === usuario.userUuid
            ? { ...u, indActivo: estadoDestino ? 1 : 0 }
            : u
        );
        this.usuarios.set(usuariosActualizados);
        this.cambiandoEstado.set(false);
        this.cerrarModalEstado();
      },
      error: (error) => {
        console.error('Error al cambiar estado:', error);
        this.errorCambioEstado.set('No se pudo actualizar el estado del usuario.');
        this.cambiandoEstado.set(false);
      }
    });
  }

  /**
   * Obtiene el nombre completo del usuario
   * @param usuario Usuario
   * @returns Nombre completo
   */
  obtenerNombreCompleto(usuario: Usuario): string {
    return `${usuario.nombres} ${usuario.apepat} ${usuario.apemat}`.trim();
  }

  /**
   * Obtiene los nombres de los roles del usuario
   * @param usuario Usuario
   * @returns String con roles separados por coma
   */
  obtenerRoles(usuario: Usuario): string {
    if (!usuario.roles || usuario.roles.length === 0) {
      return 'Sin rol';
    }
    return usuario.roles.map(r => r.descripcion).join(', ');
  }

  /**
   * Obtiene la clase CSS según el estado del usuario
   * @param usuario Usuario
   * @returns Clase CSS
   */
  obtenerEstadoClass(usuario: Usuario): string {
    return usuario.indActivo === 1 ? 'badge-success' : 'badge-danger';
  }

  /**
   * Obtiene el texto del estado
   * @param usuario Usuario
   * @returns Texto del estado
   */
  obtenerEstadoTexto(usuario: Usuario): string {
    return usuario.indActivo === 1 ? 'Activo' : 'Inactivo';
  }

  /**
   * Limpia todos los filtros
   */
  limpiarFiltros(): void {
    this.filtroNombre = '';
    this.filtroUsername = '';
    this.filtroActivo = 'todos';
  }

  /**
   * Cambia la página actual
   * @param pagina Número de página
   */
  cambiarPagina(pagina: number): void {
    this.paginaActual.set(pagina);
    this.cargarUsuarios();
  }

  /**
   * Navega al detalle/edición del usuario usando UUID
   * ✅ REGLA 11: No exponer IDs numéricos en URLs (usar UUID)
   * @param userUuid UUID del usuario
   */
  verDetalleUsuario(userUuid: string): void {
    this.router.navigate(['/usuarios', userUuid]);
  }

  /**
   * Solicita confirmación para cambiar estado
   */
  solicitarCambioEstado(usuario: Usuario): void {
    const nuevoEstado = usuario.indActivo === 1 ? false : true;
    this.usuarioEstadoPendiente.set(usuario);
    this.nuevoEstadoPendiente.set(nuevoEstado);
    this.errorCambioEstado.set(null);
    this.mostrarConfirmacionEstado.set(true);
  }

  /**
   * Confirma el cambio de estado
   */
  confirmarCambioEstado(): void {
    const usuario = this.usuarioEstadoPendiente();
    const nuevoEstado = this.nuevoEstadoPendiente();

    if (!usuario || nuevoEstado === null) {
      this.cerrarModalEstado();
      return;
    }

    this.cambiarEstadoUsuario(usuario, nuevoEstado);
  }

  /**
   * Cierra el modal de confirmación de estado
   */
  cerrarModalEstado(): void {
    this.mostrarConfirmacionEstado.set(false);
    this.usuarioEstadoPendiente.set(null);
    this.nuevoEstadoPendiente.set(null);
    this.errorCambioEstado.set(null);
    this.cambiandoEstado.set(false);
  }

  /**
   * Texto de acción para el modal de estado
   */
  obtenerAccionEstado(): string {
    return this.nuevoEstadoPendiente() ? 'activar' : 'desactivar';
  }

  /**
   * Obtiene las iniciales del usuario para el avatar
   * @param usuario Usuario
   * @returns Iniciales (ej: "JD")
   */
  obtenerIniciales(usuario: Usuario): string {
    const inicialNombre = usuario.nombres?.charAt(0).toUpperCase() || '';
    const inicialApellido = usuario.apepat?.charAt(0).toUpperCase() || '';
    return inicialNombre + inicialApellido;
  }

  // ========================================
  // MÉTODOS DEL SIDEBAR Y NAVEGACIÓN
  // ========================================

  /**
   * Obtiene el nombre del usuario actual
   */
  obtenerNombreUsuario(): string {
    const userData = this.authService.getUserData();
    return userData?.nombres || 'Usuario';
  }

  /**
   * Obtiene el rol del usuario actual
   */
  obtenerRolUsuario(): string {
    return this.authService.getRolDescripcion();
  }

  /**
   * Verifica si el usuario es administrador
   */
  esAdministrador(): boolean {
    return this.authService.getRolDescripcion() === 'Administrador';
  }

  /**
   * Navega a la vista de encuestas
   */
  navegarAEncuestas(): void {
    this.router.navigate(['/encuestas']);
  }

  /**
   * Navega a la carga masiva
   */
  navegarACargaMasiva(): void {
    this.router.navigate(['/carga-masiva']);
  }

  /**
   * Navega a un módulo específico
   * @param ruta Ruta del módulo
   */
  navegarAModulo(ruta: string): void {
    this.router.navigate([ruta]);
  }

  /**
   * Verifica si un módulo está activo según la ruta actual
   * @param ruta Ruta del módulo
   */
  esModuloActivo(ruta: string): boolean {
    return this.router.url === ruta;
  }

  /**
   * Obtiene las iniciales del usuario actual para el avatar del menú
   */
  obtenerInicialesUsuario(): string {
    const userData = this.authService.getUserData();
    if (!userData) return 'U';
    
    const inicialNombre = userData.nombres?.charAt(0).toUpperCase() || '';
    const inicialApellido = userData.apepat?.charAt(0).toUpperCase() || '';
    
    return inicialNombre + inicialApellido;
  }

  /**
   * Obtiene el nombre completo del usuario actual
   */
  obtenerNombreCompletoUsuario(): string {
    const userData = this.authService.getUserData();
    if (!userData) return 'Usuario';
    
    return `${userData.nombres} ${userData.apepat}`.trim();
  }

  /**
   * Obtiene el email/username del usuario actual
   */
  obtenerEmailUsuario(): string {
    const userData = this.authService.getUserData();
    return userData?.username || '';
  }

  /**
   * Toggle del menú de usuario
   */
  toggleMenuUsuario(): void {
    this.mostrarMenuUsuario.set(!this.mostrarMenuUsuario());
  }

  /**
   * Cierra sesión del usuario
   */
  cerrarSesion(): void {
    const layoutContainer = document.querySelector('.layout-container');
    if (layoutContainer) {
      layoutContainer.classList.add('fade-out');
    }

    setTimeout(() => {
      this.authService.logout().subscribe({
        next: () => {
          this.router.navigate(['/inicio-sesion']);
        },
        error: (error) => {
          console.error('Error al cerrar sesión:', error);
          this.router.navigate(['/inicio-sesion']);
        }
      });
    }, 300);
  }

  /**
   * Cierra menús al hacer click fuera
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const userMenuContainer = target.closest('.user-menu-container');
    
    if (!userMenuContainer) {
      this.mostrarMenuUsuario.set(false);
    }
  }
}
