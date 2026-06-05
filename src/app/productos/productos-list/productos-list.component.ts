import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ProductosService,
  CrearProductoPayload,
} from '../../core/services/productos.service';
import { Producto } from '../../core/models';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { UserMenuComponent } from '../../shared/user-menu/user-menu.component';

const TIPOS_PRODUCTO = [
  { llave: 'MEZCLA_LISTA', label: 'Mezcla Lista' },
  { llave: 'BLOQUE_CONCRETO', label: 'Bloque de Concreto' },
] as const;

const CATEGORIAS_POR_TIPO: Record<string, { llave: string; label: string }[]> = {
  MEZCLA_LISTA: [
    { llave: 'CONCRETO_LISTO', label: 'Concreto Listo' },
    { llave: 'MORTERO_LISTO', label: 'Mortero Listo' },
    { llave: 'TARRAJEO_LISTO', label: 'Tarrajeo Listo' },
  ],
  BLOQUE_CONCRETO: [
    { llave: 'KINGBLOCK', label: 'Kingblock' },
    { llave: 'KINGCONCRETO', label: 'Kingconcreto' },
  ],
};

const LABELS_TIPO: Record<string, string> = {
  MEZCLA_LISTA: 'Mezcla Lista',
  BLOQUE_CONCRETO: 'Bloque de Concreto',
};

const LABELS_CATEGORIA: Record<string, string> = {
  CONCRETO_LISTO: 'Concreto Listo',
  MORTERO_LISTO: 'Mortero Listo',
  TARRAJEO_LISTO: 'Tarrajeo Listo',
  KINGBLOCK: 'Kingblock',
  KINGCONCRETO: 'Kingconcreto',
};

type FormProducto = {
  tipoProducto: string;
  marca: string;
  categoria: string;
  nombreBolsa: string;
  proporcion: string;
  resistencia: string;
  descripcion: string;
  dimensiones: string;
};

function formVacio(): FormProducto {
  return {
    tipoProducto: '',
    marca: '',
    categoria: '',
    nombreBolsa: '',
    proporcion: '',
    resistencia: '',
    descripcion: '',
    dimensiones: '',
  };
}

@Component({
  selector: 'app-productos-list',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, PageHeaderComponent, UserMenuComponent],
  templateUrl: './productos-list.component.html',
  styleUrl: './productos-list.component.scss',
})
export class ProductosListComponent implements OnInit {
  private productosService = inject(ProductosService);

  readonly tiposProducto = TIPOS_PRODUCTO;
  readonly categoriasPorTipo = CATEGORIAS_POR_TIPO;
  readonly labelsCategoria = LABELS_CATEGORIA;
  readonly labelsTipo = LABELS_TIPO;

  productos = signal<Producto[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  filtroTipo = signal<string>('');

  productosFiltrados = computed(() => {
    const tipo = this.filtroTipo();
    if (!tipo) return this.productos();
    return this.productos().filter(p => p.tipoProducto === tipo);
  });

  // Modal crear / editar
  mostrarModal = signal(false);
  modoEdicion = signal(false);
  productoEditandoId = signal<number | null>(null);
  guardando = signal(false);
  errorModal = signal<string | null>(null);
  form: FormProducto = formVacio();

  // Modal toggle estado
  mostrarModalToggle = signal(false);
  productoToggle = signal<Producto | null>(null);
  procesandoToggle = signal(false);

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.productosService.listarTodos().subscribe({
      next: (lista) => {
        this.productos.set(lista);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la lista de productos.');
        this.cargando.set(false);
      },
    });
  }

  // --- Modal crear/editar ---

  abrirModalCrear(): void {
    this.form = formVacio();
    this.modoEdicion.set(false);
    this.productoEditandoId.set(null);
    this.errorModal.set(null);
    this.mostrarModal.set(true);
  }

  abrirModalEditar(producto: Producto, event: Event): void {
    event.stopPropagation();
    this.form = {
      tipoProducto: producto.tipoProducto,
      marca:        producto.marca,
      categoria:    producto.categoria,
      nombreBolsa:  producto.nombreBolsa  ?? '',
      proporcion:   producto.proporcion   ?? '',
      resistencia:  producto.resistencia  ?? '',
      descripcion:  producto.descripcion  ?? '',
      dimensiones:  producto.dimensiones  ?? '',
    };
    this.modoEdicion.set(true);
    this.productoEditandoId.set(producto.productoId);
    this.errorModal.set(null);
    this.mostrarModal.set(true);
  }

  cerrarModal(): void {
    this.mostrarModal.set(false);
  }

  onTipoChange(): void {
    this.form.categoria = '';
  }

  categoriasActuales(): { llave: string; label: string }[] {
    return CATEGORIAS_POR_TIPO[this.form.tipoProducto] ?? [];
  }

  esMezclaLista(): boolean {
    return this.form.tipoProducto === 'MEZCLA_LISTA';
  }

  esBloqueConcreto(): boolean {
    return this.form.tipoProducto === 'BLOQUE_CONCRETO';
  }

  guardar(): void {
    if (!this.form.tipoProducto || !this.form.marca.trim() || !this.form.categoria) {
      this.errorModal.set('Tipo de producto, marca y categoría son obligatorios.');
      return;
    }
    this.guardando.set(true);
    this.errorModal.set(null);

    const payload: CrearProductoPayload = {
      tipoProducto: this.form.tipoProducto,
      marca:        this.form.marca.trim(),
      categoria:    this.form.categoria,
      nombreBolsa:  this.form.nombreBolsa.trim()  || null,
      proporcion:   this.form.proporcion.trim()   || null,
      resistencia:  this.form.resistencia.trim()  || null,
      descripcion:  this.form.descripcion.trim()  || null,
      dimensiones:  this.form.dimensiones.trim()  || null,
    };

    const obs = this.modoEdicion()
      ? this.productosService.actualizar(this.productoEditandoId()!, payload)
      : this.productosService.crear(payload);

    obs.subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarModal.set(false);
        this.cargarProductos();
      },
      error: () => {
        this.guardando.set(false);
        this.errorModal.set('Error al guardar el producto. Intente nuevamente.');
      },
    });
  }

  // --- Modal toggle estado ---

  solicitarToggle(producto: Producto, event: Event): void {
    event.stopPropagation();
    this.productoToggle.set(producto);
    this.procesandoToggle.set(false);
    this.mostrarModalToggle.set(true);
  }

  confirmarToggle(): void {
    const prod = this.productoToggle();
    if (!prod) return;
    this.procesandoToggle.set(true);
    this.productosService.toggleEstado(prod.productoId).subscribe({
      next: () => {
        this.procesandoToggle.set(false);
        this.mostrarModalToggle.set(false);
        this.cargarProductos();
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

  // --- Helpers ---

  esActivo(producto: Producto): boolean {
    return producto.indActivo === 1;
  }

  formatearFecha(fecha?: string): string {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    });
  }

  labelTipo(llave: string): string {
    return LABELS_TIPO[llave] ?? llave;
  }

  labelCategoria(llave: string): string {
    return LABELS_CATEGORIA[llave] ?? llave;
  }
}
