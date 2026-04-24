// ✅ REGLA 10: Imports organizados
// 1. Angular Core
import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// 2. Angular Router
import { Router } from '@angular/router';

// 3. Services propios
import { EmpresasService } from '../../core/services/empresas.service';
import { UbicacionService } from '../../core/services/ubicacion.service';

// 4. Models e Interfaces
import { Empresa, TipoEmpresa } from '../../core/models';
import { SidebarComponent } from '../../shared/sidebar/sidebar.component';
import { UserMenuComponent } from '../../shared/user-menu/user-menu.component';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

const COD_PAIS_PERU = '428';

/**
 * Component para listar empresas
 * Accesible para todos los roles autenticados
 */
@Component({
  selector: 'app-empresas-list',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, UserMenuComponent, PageHeaderComponent],
  templateUrl: './empresas-list.component.html',
  styleUrl: './empresas-list.component.scss'
})
export class EmpresasListComponent implements OnInit {
  private empresasService = inject(EmpresasService);
  private ubicacionService = inject(UbicacionService);
  private router = inject(Router);

  // ✅ REGLA 4: Usar Signals
  empresas = signal<Empresa[]>([]);
  tiposEmpresa = signal<TipoEmpresa[]>([]);
  cargando = signal(false);
  error = signal<string | null>(null);

  // Paginación
  paginaActual = signal(1);
  limite = signal(10);
  totalPaginas = signal(0);
  totalRegistros = signal(0);

  // Filtros generales
  filtroRazonSocial = signal('');
  filtroRuc = signal('');
  filtroTipoEmpresa = signal<number | null>(null);
  filtroDireccion = signal('');

  // Filtros ubigeo
  filtroCodDepartamento = signal<string | null>(null);
  filtroCodProvincia = signal<string | null>(null);
  filtroCodDistrito = signal<string | null>(null);

  // Listas para selects ubigeo
  departamentos = signal<any[]>([]);
  provincias = signal<any[]>([]);
  distritos = signal<any[]>([]);

  ngOnInit(): void {
    this.cargarTiposEmpresa();
    this.cargarDepartamentos();
    this.cargarEmpresas();
  }

  // ========================================
  // MÉTODOS DE GESTIÓN DE EMPRESAS
  // ========================================

  cargarEmpresas(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.empresasService.listar(
      this.paginaActual(),
      this.limite(),
      this.filtroRazonSocial() || undefined,
      this.filtroRuc() || undefined,
      this.filtroTipoEmpresa(),
      this.filtroDireccion() || undefined,
      this.filtroCodDepartamento(),
      this.filtroCodProvincia(),
      this.filtroCodDistrito(),
    ).subscribe({
      next: (respuesta) => {
        this.empresas.set(respuesta.data);
        this.totalPaginas.set(respuesta.totalPaginas);
        this.totalRegistros.set(respuesta.total);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar empresas:', err);
        this.error.set('Error al cargar las empresas. Por favor, intente nuevamente.');
        this.cargando.set(false);
      }
    });
  }

  cargarTiposEmpresa(): void {
    this.empresasService.listarTipos().subscribe({
      next: (tipos) => {
        this.tiposEmpresa.set(tipos);
      },
      error: (err) => {
        console.error('Error al cargar tipos de empresa:', err);
      }
    });
  }

  // ========================================
  // MÉTODOS DE UBIGEO (CASCADA)
  // ========================================

  cargarDepartamentos(): void {
    this.ubicacionService.listarDepartamentos(COD_PAIS_PERU).subscribe({
      next: (data) => this.departamentos.set(data),
      error: (err) => console.error('Error al cargar departamentos:', err),
    });
  }

  onDepartamentoChange(codDepartamento: string | null): void {
    this.filtroCodDepartamento.set(codDepartamento || null);
    this.filtroCodProvincia.set(null);
    this.filtroCodDistrito.set(null);
    this.provincias.set([]);
    this.distritos.set([]);

    if (codDepartamento) {
      this.ubicacionService.listarProvincias(codDepartamento, COD_PAIS_PERU).subscribe({
        next: (data) => this.provincias.set(data),
        error: (err) => console.error('Error al cargar provincias:', err),
      });
    }
  }

  onProvinciaChange(codProvincia: string | null): void {
    this.filtroCodProvincia.set(codProvincia || null);
    this.filtroCodDistrito.set(null);
    this.distritos.set([]);

    const codDep = this.filtroCodDepartamento();
    if (codProvincia && codDep) {
      this.ubicacionService.listarDistritos(codProvincia, codDep, COD_PAIS_PERU).subscribe({
        next: (data) => this.distritos.set(data),
        error: (err) => console.error('Error al cargar distritos:', err),
      });
    }
  }

  onDistritoChange(codDistrito: string | null): void {
    this.filtroCodDistrito.set(codDistrito || null);
  }

  // ========================================
  // MÉTODOS DE FILTRADO Y PAGINACIÓN
  // ========================================

  aplicarFiltros(): void {
    this.paginaActual.set(1);
    this.cargarEmpresas();
  }

  limpiarFiltros(): void {
    this.filtroRazonSocial.set('');
    this.filtroRuc.set('');
    this.filtroTipoEmpresa.set(null);
    this.filtroDireccion.set('');
    this.filtroCodDepartamento.set(null);
    this.filtroCodProvincia.set(null);
    this.filtroCodDistrito.set(null);
    this.provincias.set([]);
    this.distritos.set([]);
    this.paginaActual.set(1);
    this.cargarEmpresas();
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas()) {
      this.paginaActual.set(pagina);
      this.cargarEmpresas();
    }
  }

  verDetalleEmpresa(empresaId: number): void {
    this.router.navigate(['/empresas', empresaId]);
  }

  obtenerNombreTipoEmpresa(tipoEmpresaId: number): string {
    const tipo = this.tiposEmpresa().find(t => t.tipoEmpresaId === tipoEmpresaId);
    return tipo ? tipo.descripcionTipoEmpresa : 'N/A';
  }

  // Paginación helpers - muestra solo páginas cercanas a la actual
  get paginasArray(): number[] {
    const total = this.totalPaginas();
    const actual = this.paginaActual();
    const rango = 2; // mostrar 2 páginas antes y después de la actual
    const maxBotones = 5; // máximo de botones de página

    if (total <= maxBotones) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const paginas: number[] = [];
    const inicio = Math.max(1, actual - rango);
    const fin = Math.min(total, actual + rango);

    // Agregar página 1
    paginas.push(1);

    // Agregar ellipsis si necesario
    if (inicio > 2) {
      paginas.push(-1); // -1 representa ellipsis
    }

    // Agregar páginas cercanas a la actual
    for (let i = inicio; i <= fin; i++) {
      if (i !== 1) {
        paginas.push(i);
      }
    }

    // Agregar ellipsis si necesario
    if (fin < total - 1) {
      paginas.push(-1);
    }

    // Agregar última página
    if (fin < total) {
      paginas.push(total);
    }

    return paginas;
  }

  get rangoInicio(): number {
    return (this.paginaActual() - 1) * this.limite() + 1;
  }

  get rangoFin(): number {
    return Math.min(this.paginaActual() * this.limite(), this.totalRegistros());
  }
}
