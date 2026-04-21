import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  FabricantesService,
  Fabricante,
  CrearFabricantePayload,
  ToggleEstadoResult,
} from '../../core/services/fabricantes.service';
import { AuthService } from '../../core/services/auth.service';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { UserMenuComponent } from '../../shared/user-menu/user-menu.component';

@Component({
  selector: 'app-fabricantes-list',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, PageHeaderComponent, UserMenuComponent],
  templateUrl: './fabricantes-list.component.html',
  styleUrl: './fabricantes-list.component.css',
})
export class FabricantesListComponent implements OnInit {
  private fabricantesService = inject(FabricantesService);
  private authService = inject(AuthService);
  private router = inject(Router);

  fabricantes = signal<Fabricante[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  mostrarModalCrear = signal(false);
  guardando = signal(false);
  errorModal = signal<string | null>(null);

  mostrarModalToggle = signal(false);
  fabricanteToggle = signal<Fabricante | null>(null);
  marcasAfectadas = signal(0);
  procesandoToggle = signal(false);

  formCrear: CrearFabricantePayload = { razonSocial: '', ruc: '' };

  ngOnInit(): void {
    this.cargarFabricantes();
  }

  cargarFabricantes(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.fabricantesService.listarTodos().subscribe({
      next: (lista) => {
        this.fabricantes.set(lista);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la lista de fabricantes.');
        this.cargando.set(false);
      },
    });
  }

  verDetalle(fabricante: Fabricante): void {
    this.router.navigate(['/fabricantes', fabricante.fabricanteId]);
  }

  abrirModalCrear(): void {
    this.formCrear = { razonSocial: '', ruc: '' };
    this.errorModal.set(null);
    this.mostrarModalCrear.set(true);
  }

  cerrarModalCrear(): void {
    this.mostrarModalCrear.set(false);
  }

  guardarNuevoFabricante(): void {
    if (!this.formCrear.razonSocial.trim()) {
      this.errorModal.set('La razón social es obligatoria.');
      return;
    }
    this.guardando.set(true);
    this.errorModal.set(null);
    const payload: CrearFabricantePayload = {
      razonSocial: this.formCrear.razonSocial.trim(),
      ruc: this.formCrear.ruc?.trim() || null,
    };
    this.fabricantesService.crear(payload).subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarModalCrear.set(false);
        this.cargarFabricantes();
      },
      error: () => {
        this.guardando.set(false);
        this.errorModal.set('Error al crear el fabricante. Intente nuevamente.');
      },
    });
  }

  solicitarToggleEstado(fabricante: Fabricante, event: Event): void {
    event.stopPropagation();
    this.fabricanteToggle.set(fabricante);
    this.marcasAfectadas.set(0);
    this.procesandoToggle.set(false);
    this.mostrarModalToggle.set(true);
  }

  confirmarToggleEstado(): void {
    const fab = this.fabricanteToggle();
    if (!fab) return;
    this.procesandoToggle.set(true);
    this.fabricantesService.toggleEstadoFabricante(fab.fabricanteId).subscribe({
      next: (result: ToggleEstadoResult) => {
        this.marcasAfectadas.set(result.marcasAfectadas);
        this.procesandoToggle.set(false);
        this.mostrarModalToggle.set(false);
        this.cargarFabricantes();
      },
      error: () => {
        this.procesandoToggle.set(false);
        this.mostrarModalToggle.set(false);
      },
    });
  }

  cerrarModalToggle(): void {
    this.mostrarModalToggle.set(false);
  }

  esActivo(fabricante: Fabricante): boolean {
    return fabricante.indActivo === 1;
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }
}
