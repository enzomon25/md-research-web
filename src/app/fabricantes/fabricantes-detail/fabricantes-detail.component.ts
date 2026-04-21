import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FabricantesService,
  Fabricante,
  MarcaFabricante,
  UpsertMarcaPayload,
} from '../../core/services/fabricantes.service';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { UserMenuComponent } from '../../shared/user-menu/user-menu.component';

interface FormMarca {
  marcaFabricanteId?: number;
  nombreMarca: string;
  tipoCemento: string;
  marca: string;
  subMarca: string;
  descFisica: string;
}

@Component({
  selector: 'app-fabricantes-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, PageHeaderComponent, UserMenuComponent],
  templateUrl: './fabricantes-detail.component.html',
  styleUrl: './fabricantes-detail.component.css',
})
export class FabricantesDetailComponent implements OnInit {
  private fabricantesService = inject(FabricantesService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  fabricante = signal<Fabricante | null>(null);
  marcas = signal<MarcaFabricante[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  modoEdicion = signal(false);
  guardando = signal(false);
  errorGuardado = signal<string | null>(null);

  formFabricante = { razonSocial: '', ruc: '' };

  mostrarModalMarca = signal(false);
  editandoMarca = signal(false);
  guardandoMarca = signal(false);
  errorMarca = signal<string | null>(null);
  formMarca: FormMarca = this.marcaVacia();

  procesandoToggleMarca = signal<number | null>(null);

  private fabricanteId!: number;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.fabricanteId = Number(id);
    if (!this.fabricanteId) {
      this.router.navigate(['/fabricantes']);
      return;
    }
    this.cargarDetalle();
  }

  cargarDetalle(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.fabricantesService.obtenerDetalle(this.fabricanteId).subscribe({
      next: (detalle) => {
        this.fabricante.set(detalle.fabricante);
        this.marcas.set(detalle.marcas);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el detalle del fabricante.');
        this.cargando.set(false);
      },
    });
  }

  volver(): void {
    this.router.navigate(['/fabricantes']);
  }

  activarEdicion(): void {
    const fab = this.fabricante();
    if (!fab) return;
    this.formFabricante = { razonSocial: fab.razonSocial, ruc: fab.ruc ?? '' };
    this.errorGuardado.set(null);
    this.modoEdicion.set(true);
  }

  cancelarEdicion(): void {
    this.modoEdicion.set(false);
    this.errorGuardado.set(null);
  }

  guardarCambios(): void {
    if (!this.formFabricante.razonSocial.trim()) {
      this.errorGuardado.set('La razón social es obligatoria.');
      return;
    }
    this.guardando.set(true);
    this.errorGuardado.set(null);

    const marcasPayload: UpsertMarcaPayload[] = this.marcas().map((m) => ({
      marcaFabricanteId: m.marcaFabricanteId,
      nombreMarca: m.nombreMarca,
      tipoCemento: m.tipoCemento,
      marca: m.marca,
      subMarca: m.subMarca,
      descFisica: m.descFisica,
    }));

    this.fabricantesService.upsert(this.fabricanteId, {
      razonSocial: this.formFabricante.razonSocial.trim(),
      ruc: this.formFabricante.ruc.trim() || null,
      marcas: marcasPayload,
    }).subscribe({
      next: (detalle) => {
        this.fabricante.set(detalle.fabricante);
        this.marcas.set(detalle.marcas);
        this.guardando.set(false);
        this.modoEdicion.set(false);
      },
      error: () => {
        this.guardando.set(false);
        this.errorGuardado.set('Error al guardar los cambios. Intente nuevamente.');
      },
    });
  }

  abrirModalNuevaMarca(): void {
    this.formMarca = this.marcaVacia();
    this.errorMarca.set(null);
    this.editandoMarca.set(false);
    this.mostrarModalMarca.set(true);
  }

  abrirModalEditarMarca(marca: MarcaFabricante): void {
    this.formMarca = {
      marcaFabricanteId: marca.marcaFabricanteId,
      nombreMarca: marca.nombreMarca ?? '',
      tipoCemento: marca.tipoCemento,
      marca: marca.marca,
      subMarca: marca.subMarca ?? '',
      descFisica: marca.descFisica ?? '',
    };
    this.errorMarca.set(null);
    this.editandoMarca.set(true);
    this.mostrarModalMarca.set(true);
  }

  cerrarModalMarca(): void {
    this.mostrarModalMarca.set(false);
  }

  guardarMarca(): void {
    if (!this.formMarca.tipoCemento.trim() || !this.formMarca.marca.trim()) {
      this.errorMarca.set('Tipo de cemento y marca son obligatorios.');
      return;
    }
    this.guardandoMarca.set(true);
    this.errorMarca.set(null);

    const payload: UpsertMarcaPayload = {
      ...(this.formMarca.marcaFabricanteId ? { marcaFabricanteId: this.formMarca.marcaFabricanteId } : {}),
      nombreMarca: this.formMarca.nombreMarca.trim() || null,
      tipoCemento: this.formMarca.tipoCemento.trim(),
      marca: this.formMarca.marca.trim(),
      subMarca: this.formMarca.subMarca.trim() || null,
      descFisica: this.formMarca.descFisica.trim() || null,
    };

    this.fabricantesService.upsert(this.fabricanteId, { marcas: [payload] }).subscribe({
      next: (detalle) => {
        this.marcas.set(detalle.marcas);
        this.fabricante.set(detalle.fabricante);
        this.guardandoMarca.set(false);
        this.mostrarModalMarca.set(false);
      },
      error: () => {
        this.guardandoMarca.set(false);
        this.errorMarca.set(
          this.editandoMarca()
            ? 'Error al actualizar la marca. Intente nuevamente.'
            : 'Error al crear la marca. Intente nuevamente.',
        );
      },
    });
  }

  toggleEstadoMarca(marca: MarcaFabricante): void {
    this.procesandoToggleMarca.set(marca.marcaFabricanteId);
    this.fabricantesService.toggleEstadoMarca(this.fabricanteId, marca.marcaFabricanteId).subscribe({
      next: (actualizada) => {
        this.marcas.update((lista) =>
          lista.map((m) =>
            m.marcaFabricanteId === actualizada.marcaFabricanteId ? actualizada : m,
          ),
        );
        this.procesandoToggleMarca.set(null);
      },
      error: () => {
        this.procesandoToggleMarca.set(null);
      },
    });
  }

  esActivo(indActivo: number): boolean {
    return indActivo === 1;
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  private marcaVacia(): FormMarca {
    return { nombreMarca: '', tipoCemento: '', marca: '', subMarca: '', descFisica: '' };
  }
}
