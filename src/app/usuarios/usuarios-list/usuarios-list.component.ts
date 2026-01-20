// ✅ REGLA 10: Imports organizados
// 1. Angular Core
import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// 2. Angular Router
import { Router, ActivatedRoute } from '@angular/router';

// 3. Services propios
import { UsuariosService } from '../../core/services/usuarios.service';
import { AuthService } from '../../core/services/auth.service';

// 4. Models e Interfaces
import { Usuario, PaginacionRespuesta } from '../../core/models';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { UserMenuComponent } from '../../shared/user-menu/user-menu.component';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

/**
 * Component para listar y gestionar usuarios
 * Solo accesible por ADMINISTRADOR
 * ✅ Aplica TODAS las reglas obligatorias desde el inicio
 */
@Component({
  selector: 'app-usuarios-list',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, UserMenuComponent, PageHeaderComponent],
  templateUrl: './usuarios-list.component.html',
  styleUrl: './usuarios-list.component.scss'
})
export class UsuariosListComponent implements OnInit {
  // ✅ REGLA 3: Usar inject() en lugar de constructor
  private usuariosService = inject(UsuariosService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // ✅ REGLA 8: Signals para estado de UI
  usuarios = signal<Usuario[]>([]);
  paginaActual = signal(1);
  totalPaginas = signal(0);
  total = signal(0);
  cargando = signal(false);

  // Modales y detalle
  mostrarDetalleModal = signal(false);
  usuarioDetalle = signal<Usuario | null>(null);
  uuidDetalleActual = signal<string | null>(null);
  cargandoDetalle = signal(false);
  errorDetalle = signal<string | null>(null);

  mostrarConfirmacionEstado = signal(false);
  usuarioEstadoPendiente = signal<Usuario | null>(null);
  nuevoEstadoPendiente = signal<boolean | null>(null);
  cambiandoEstado = signal(false);
  errorCambioEstado = signal<string | null>(null);
  
  // Sidebar y UI
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
    this.escucharRutaDetalle();
  }

  /**
   * Escucha el parámetro UUID para abrir el detalle
   */
  escucharRutaDetalle(): void {
    this.route.paramMap.subscribe((params) => {
      const uuid = params.get('uuid');
      if (uuid) {
        if (this.uuidDetalleActual() !== uuid) {
          this.abrirDetalleUsuario(uuid, false);
        }
      } else {
        this.cerrarDetalleModal();
      }
    });
  }
  
  /**
   * Carga los módulos disponibles para el usuario
   */

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
    this.abrirDetalleUsuario(userUuid, true);
  }

  /**
   * Abre el modal de detalle del usuario
   */
  abrirDetalleUsuario(userUuid: string, navegar: boolean): void {
    if (navegar) {
      this.router.navigate(['/usuarios', userUuid]);
    }

    this.mostrarDetalleModal.set(true);
    this.cargandoDetalle.set(true);
    this.errorDetalle.set(null);
    this.uuidDetalleActual.set(userUuid);

    this.usuariosService.obtenerPorUuid(userUuid).subscribe({
      next: (usuario) => {
        this.usuarioDetalle.set(usuario);
        this.cargandoDetalle.set(false);
      },
      error: (error) => {
        console.error('Error al cargar detalle:', error);
        this.usuarioDetalle.set(null);
        this.cargandoDetalle.set(false);
        this.errorDetalle.set('No se pudo cargar el detalle del usuario.');
      }
    });
  }

  /**
   * Cierra el modal de detalle
   */
  cerrarDetalleModal(): void {
    this.mostrarDetalleModal.set(false);
    this.usuarioDetalle.set(null);
    this.uuidDetalleActual.set(null);
    this.errorDetalle.set(null);
    this.cargandoDetalle.set(false);

    if (this.route.snapshot.paramMap.get('uuid')) {
      this.router.navigate(['/usuarios']);
    }
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

}
