import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ESTADOS_ENCUESTA } from '../../core/constants/estados-encuesta.constants';

interface EstadoHistorial {
  encuestaEstadoId: number;
  estadoId: number;
  estadoDescripcion: string;
  encuestaId: number;
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaModificacion: string;
  usuarioModificacion: string;
  indActivo: number;
}

@Component({
  selector: 'app-encuesta-historial-estados',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './encuesta-historial-estados.component.html',
  styleUrls: ['./encuesta-historial-estados.component.css']
})
export class EncuestaHistorialEstadosComponent {
  // Input con signals API - recibe el array de estados desde el componente padre
  estadosInput = input<EstadoHistorial[]>([]);
  // Controla si el historial está expandido o colapsado
  expanded = false;
  
  /**
   * Computed signal que ordena los estados por encuestaEstadoId descendente
   * El estado ACTUAL siempre es el que tiene el ID mayor (más reciente)
   */
  estados = computed(() => {
    return [...this.estadosInput()].sort((a, b) => b.encuestaEstadoId - a.encuestaEstadoId);
  });

  /**
   * Devuelve solo el estado actual (más reciente)
   */
  estadoActual = computed(() => {
    return this.estados().length > 0 ? [this.estados()[0]] : [];
  });

  /**
   * Alterna el estado expandido/colapsado
   */
  toggleExpand() {
    this.expanded = !this.expanded;
  }

  /**
   * Formatea una fecha ISO a formato legible
   * @param fecha Fecha en formato ISO
   * @returns Fecha formateada como "DD/MM/YYYY HH:mm"
   */
  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const año = date.getFullYear();
    const horas = String(date.getHours()).padStart(2, '0');
    const minutos = String(date.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${año} ${horas}:${minutos}`;
  }

  /**
   * Obtiene la clase CSS para el badge según el estado
   * @param estadoId ID del estado
   * @returns Clase CSS correspondiente
   */
  getEstadoClase(estadoId: number): string {
    switch (estadoId) {
      case ESTADOS_ENCUESTA.EN_REGISTRO:
        return 'estado-registro';
      case ESTADOS_ENCUESTA.EN_REVISION:
        return 'estado-revision';
      case ESTADOS_ENCUESTA.TRANSFERIDO:
        return 'estado-transferido';
      case ESTADOS_ENCUESTA.EN_CORRECCION:
        return 'estado-en-correccion';
      case ESTADOS_ENCUESTA.APROBADO:
        return 'estado-aprobado';
      case ESTADOS_ENCUESTA.OBSERVADA:
        return 'estado-observada';
      default:
        return 'estado-default';
    }
  }
}
