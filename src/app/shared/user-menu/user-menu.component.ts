import { Component, HostListener, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-menu.component.html',
  styleUrl: './user-menu.component.css',
})
export class UserMenuComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  mostrarMenuUsuario = signal(false);

  obtenerInicialesUsuario(): string {
    const userData = this.authService.getUserData();
    if (!userData) return 'U';

    const inicialNombre = userData.nombres?.charAt(0).toUpperCase() || '';
    const inicialApellido = userData.apepat?.charAt(0).toUpperCase() || '';

    return inicialNombre + inicialApellido;
  }

  obtenerNombreCompletoUsuario(): string {
    const userData = this.authService.getUserData();
    if (!userData) return 'Usuario';

    return `${userData.nombres} ${userData.apepat}`.trim();
  }

  obtenerEmailUsuario(): string {
    const userData = this.authService.getUserData();
    return userData?.username || '';
  }

  toggleMenuUsuario(): void {
    this.mostrarMenuUsuario.set(!this.mostrarMenuUsuario());
  }

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
        error: (error: unknown) => {
          console.error('Error al cerrar sesión:', error);
          this.router.navigate(['/inicio-sesion']);
        },
      });
    }, 300);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const userMenuContainer = target.closest('.user-menu-container');

    if (!userMenuContainer) {
      this.mostrarMenuUsuario.set(false);
    }
  }
}
