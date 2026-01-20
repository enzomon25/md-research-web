import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { ModulosService, Modulo } from '../../core/services/modulos.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent implements OnInit {
  private authService = inject(AuthService);
  private modulosService = inject(ModulosService);
  private router = inject(Router);

  modulos = signal<Modulo[]>([]);

  ngOnInit(): void {
    this.cargarModulos();
  }

  cargarModulos(): void {
    this.modulosService.obtenerModulosDisponibles().subscribe({
      next: (modulos: Modulo[]) => this.modulos.set(modulos),
      error: (error: unknown) => console.error('Error al cargar módulos:', error),
    });
  }

  navegarAModulo(ruta: string): void {
    this.router.navigate([ruta]);
  }

  navegarACargaMasiva(): void {
    this.router.navigate(['/carga-masiva']);
  }

  esModuloActivo(ruta: string): boolean {
    return this.router.url === ruta;
  }

  esAdministrador(): boolean {
    return this.authService.getRolDescripcion() === 'Administrador';
  }

  obtenerNombreUsuario(): string {
    const userData = this.authService.getUserData();
    return userData?.nombres || 'Usuario';
  }

  obtenerRolUsuario(): string {
    return this.authService.getRolDescripcion();
  }
}
