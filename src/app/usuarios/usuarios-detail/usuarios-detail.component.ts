// ✅ REGLA 10: Imports organizados
// 1. Angular Core
import { Component, signal, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

// 2. Angular Router
import { ActivatedRoute, Router } from '@angular/router';

// 3. Services propios
import { UsuariosService } from '../../core/services/usuarios.service';
import { AuthService } from '../../core/services/auth.service';
import { ModulosService, Modulo } from '../../core/services/modulos.service';

// 4. Models e Interfaces
import { Usuario } from '../../core/models';

/**
 * Component para ver el detalle de un usuario
 * Solo accesible por ADMINISTRADOR
 * ✅ Aplica TODAS las reglas obligatorias desde el inicio
 */
@Component({
  selector: 'app-usuarios-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './usuarios-detail.component.html',
  styleUrl: './usuarios-detail.component.scss'
})
export class UsuariosDetailComponent implements OnInit {
  // ✅ REGLA 3: Usar inject() en lugar de constructor
  private usuariosService = inject(UsuariosService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private modulosService = inject(ModulosService);

  // Estado principal
  usuario = signal<Usuario | null>(null);
  cargando = signal(false);
  error = signal<string | null>(null);

  // Sidebar y UI
  modulos = signal<Modulo[]>([]);
  mostrarMenuUsuario = signal(false);

  ngOnInit(): void {
    this.cargarModulos();
    this.escucharRutaDetalle();
  }

  /**
   * Escucha el parámetro UUID para cargar detalle
   */
  escucharRutaDetalle(): void {
    this.route.paramMap.subscribe((params) => {
      const uuid = params.get('uuid');
      if (!uuid) {
        this.router.navigate(['/usuarios']);
        return;
      }
      this.cargarDetalle(uuid);
    });
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
   * Carga el detalle del usuario desde el backend
   */
  cargarDetalle(uuid: string): void {
    this.cargando.set(true);
    this.error.set(null);

    this.usuariosService.obtenerPorUuid(uuid).subscribe({
      next: (usuario) => {
        this.usuario.set(usuario);
        this.cargando.set(false);
      },
      error: (error) => {
        console.error('Error al cargar detalle:', error);
        this.usuario.set(null);
        this.cargando.set(false);
        this.error.set('No se pudo cargar el detalle del usuario.');
      }
    });
  }

  /**
   * Navega de regreso a la lista
   */
  volverALista(): void {
    this.router.navigate(['/usuarios']);
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
