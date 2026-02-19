import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EncuestaObservacion, EncuestaObservacionHistorial } from '../../core/models';

@Component({
  selector: 'app-observaciones-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './observaciones-panel.component.html',
  styleUrl: './observaciones-panel.component.css'
})
export class ObservacionesPanelComponent {
  // Inputs
  observaciones = input<Map<string, EncuestaObservacion>>(new Map());
  observacionesResueltas = input<Set<string>>(new Set());
  panelAbierto = input(true);
  sectionLabels = input<Record<string, string>>({});
  historialObservaciones = input<Map<string, EncuestaObservacionHistorial[]>>(new Map());

  // Outputs
  irASeccion = output<string>();
  togglePanel = output<void>();

  // Panel colapsado/expandido (una sola abierta a la vez)
  seccionExpandida: string | null = null;

  /**
   * Obtener array de observaciones activas (no vacías)
   */
  observacionesActivas = computed(() => {
    const obs = this.observaciones();
    const activas: { seccion: string; data: EncuestaObservacion }[] = [];
    
    obs.forEach((value, key) => {
      if (value.observacion?.trim()) {
        activas.push({ seccion: key, data: value });
      }
    });
    
    return activas.sort((a, b) => a.seccion.localeCompare(b.seccion));
  });

  /**
   * Secciones con historial pero sin observación activa
   */
  seccionesConHistorial = computed(() => {
    const historial = this.historialObservaciones();
    const activasSet = new Set(this.observacionesActivas().map((item) => item.seccion));
    const secciones: string[] = [];

    historial.forEach((lista, seccion) => {
      if (lista?.length > 0 && !activasSet.has(seccion)) {
        secciones.push(seccion);
      }
    });

    return secciones.sort((a, b) => a.localeCompare(b));
  });

  /**
   * Observaciones del último ciclo de historial
   */
  observacionesHistorialUltimoCiclo = computed(() => {
    const historial = this.historialObservaciones();
    let maxCiclo = 0;
    historial.forEach((lista) => {
      lista.forEach((item) => {
        if (item.cicloRevision > maxCiclo) {
          maxCiclo = item.cicloRevision;
        }
      });
    });

    if (maxCiclo === 0) {
      return [];
    }

    const items: { seccion: string; data: EncuestaObservacionHistorial }[] = [];
    historial.forEach((lista, seccion) => {
      const item = lista.find((entry) => entry.cicloRevision === maxCiclo);
      if (item) {
        items.push({ seccion, data: item });
      }
    });

    return items.sort((a, b) => a.seccion.localeCompare(b.seccion));
  });

  /**
   * Verificar si una observación está resuelta
   */
  estaResuelta(seccion: string): boolean {
    return this.observacionesResueltas().has(seccion);
  }

  /**
   * Toggle expandir/colapsar observación
   */
  toggleExpanded(seccion: string): void {
    if (this.seccionExpandida === seccion) {
      this.seccionExpandida = null;
      return;
    }
    this.seccionExpandida = seccion;
  }

  /**
   * Ir a sección y expandir observación
   */
  onIrASeccion(seccion: string): void {
    this.irASeccion.emit(seccion);
    this.toggleExpanded(seccion);
  }

  /**
   * Obtener etiqueta de sección amigable
   */
  obtenerEtiquetaSeccion(seccion: string): string {
    const labels: { [key: string]: string } = {
      'datos_encuesta': 'Datos Generales',
      'datos_obra': 'Datos de la Obra',
      'empresa': 'Empresa',
      'encuestado': 'Datos del Encuestado',
      'productos': 'Productos',
      'fabricante': 'Fabricante, Marca y Tipo de Cemento comprado',
      'compra': 'Información de Compra',
      'uso': 'Comentario Cualitativo',
      'marca': 'Marca/Cemento',
      'ubicacion': 'Ubicación'
    };
    const resolved = { ...labels, ...this.sectionLabels() };
    return resolved[seccion] || seccion;
  }

  /**
   * Truncar texto para vista colapsada
   */
  truncarTexto(texto: string, limite: number = 60): string {
    return texto.length > limite ? texto.substring(0, limite) + '...' : texto;
  }
}
