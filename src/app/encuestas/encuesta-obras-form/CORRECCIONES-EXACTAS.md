# ✅ CORRECCIONES FINALES Y EXACTAS

## REEMPLAZOS NECESARIOS EN encuesta-obras-form.component.ts

### 1. Método `buscarEncuestado()` - Línea ~445

**REEMPLAZAR DESDE:**
```typescript
buscarEncuestado(): void {
  const termino = this.terminoBusquedaEncuestado().trim();
  if (!termino || termino.length < 3) {
    this.errorBusquedaEncuestado.set('Debe ingresar al menos 3 caracteres');
    return;
  }

  this.errorBusquedaEncuestado.set('');
  this.buscandoEncuestado.set(true);
  this.encuestadosEncontrados.set([]);

  this.encuestadosService.buscarEncuestado(termino).subscribe({
    next: (encuestados) => {
      this.buscandoEncuestado.set(false);
      if (encuestados.length === 0) {
        this.mostrarModalNoEncontradaEncuestado.set(true);
      } else {
        this.encuestadosEncontrados.set(encuestados);
        this.mostrarResultadosEncuestado.set(true);
      }
    },
    error: (error) => {
      console.error('Error al buscar encuestado:', error);
      this.buscandoEncuestado.set(false);
      this.errorBusquedaEncuestado.set('Error al realizar la búsqueda');
    }
  });
}
```

**REEMPLAZAR POR:**
```typescript
buscarEncuestado(): void {
  const termino = this.terminoBusquedaEncuestado().trim();
  
  if (termino.length < 1) {
    this.encuestadosEncontrados.set([]);
    this.mostrarResultadosEncuestado.set(false);
    this.mostrarFormularioRegistroEncuestado.set(false);
    return;
  }

  if (termino.length < 3) {
    this.errorBusquedaEncuestado.set('Debe ingresar al menos 3 caracteres');
    return;
  }

  this.errorBusquedaEncuestado.set('');
  this.mostrarFormularioRegistroEncuestado.set(false);
  this.buscandoEncuestado.set(true);
  this.mostrarResultadosEncuestado.set(true);

  // Buscar encuestados usando listar con filtro de nombres
  this.encuestadosService.listar(1, 5, termino, undefined).subscribe({
    next: (response: any) => {
      this.encuestadosEncontrados.set(response.data || []);
      this.buscandoEncuestado.set(false);
      
      if (!response.data || response.data.length === 0) {
        this.mostrarModalNoEncontradaEncuestado.set(true);
        this.mostrarResultadosEncuestado.set(false);
        this.nuevoEncuestado = { ...this.nuevoEncuestado, nombres: termino };
      }
    },
    error: (error: any) => {
      console.error('Error al buscar encuestado:', error);
      this.buscandoEncuestado.set(false);
      this.errorBusquedaEncuestado.set('Error al realizar la búsqueda');
      this.encuestadosEncontrados.set([]);
    }
  });
}
```

### 2. Método `seleccionarEncuestado()` - Línea ~475

**REEMPLAZAR DESDE:**
```typescript
seleccionarEncuestado(encuestado: Encuestado): void {
  this.encuestadoSeleccionado.set(encuestado);
  this.mostrarResultadosEncuestado.set(false);
  this.terminoBusquedaEncuestado.set('');
  
  const encuestaActual = this.encuesta();
  if (encuestaActual) {
    this.encuesta.set({
      ...encuestaActual,
      encuestadoId: encuestado.encuestadoId,
      encuestado: encuestado
    });
    this.actualizarEncuesta();
  }
}
```

**REEMPLAZAR POR:**
```typescript
seleccionarEncuestado(encuestado: Encuestado): void {
  const encuestaActual = this.encuesta();
  if (encuestaActual) {
    // Actualizar la encuesta con el encuestadoId seleccionado
    this.encuestasService.guardar({
      encuestaId: encuestaActual.encuestaId,
      encuestadoId: encuestado.encuestadoId
    } as Partial<Encuesta>).subscribe({
      next: (encuestaGuardada: Encuesta) => {
        this.encuesta.set(encuestaGuardada);
        this.encuestadoSeleccionado.set(encuestado);
        this.mostrarResultadosEncuestado.set(false);
        this.terminoBusquedaEncuestado.set('');
      },
      error: (error: any) => {
        console.error('Error al asociar encuestado:', error);
        this.mensajeModal.set('Error al asociar el encuestado');
        this.mostrarModalError.set(true);
      }
    });
  }
}
```

### 3. Método `onFabricanteChange()` - Línea ~560

**BUSCAR:**
```typescript
this.fabricantesService.listarMarcasPorFabricante(fabricanteId).subscribe({
```

**REEMPLAZAR POR:**
```typescript
this.fabricantesService.obtenerMarcasPorFabricante(fabricanteId).subscribe({
```

### 4. Método `quitarEncuestadoSeleccionado()` - Línea ~490

**REEMPLAZAR DESDE:**
```typescript
quitarEncuestadoSeleccionado(): void {
  this.encuestadoSeleccionado.set(null);
  const encuestaActual = this.encuesta();
  if (encuestaActual) {
    this.encuesta.set({
      ...encuestaActual,
      encuestadoId: undefined,
      encuestado: undefined
    });
    this.actualizarEncuesta();
  }
}
```

**REEMPLAZAR POR:**
```typescript
quitarEncuestadoSeleccionado(): void {
  const encuestaActual = this.encuesta();
  if (encuestaActual) {
    this.encuestasService.guardar({
      encuestaId: encuestaActual.encuestaId,
      encuestadoId: null
    } as Partial<Encuesta>).subscribe({
      next: (encuestaGuardada: Encuesta) => {
        this.encuesta.set(encuestaGuardada);
        this.encuestadoSeleccionado.set(null);
      },
      error: (error: any) => {
        console.error('Error al quitar encuestado:', error);
      }
    });
  }
}
```

### 5. ELIMINAR el método `actualizarEncuesta()` - Línea ~830

**ELIMINAR COMPLETAMENTE:**
```typescript
actualizarEncuesta(): void {
  const encuestaActual = this.encuesta();
  if (!encuestaActual?.encuestaId) return;

  this.encuestasService.actualizar(encuestaActual.encuestaId, encuestaActual).subscribe({
    next: () => {
      this.encuestaOriginal.set(JSON.parse(JSON.stringify(encuestaActual)));
      this.tieneCambiosSinGuardar.set(false);
    },
    error: (error) => console.error('Error al actualizar encuesta:', error)
  });
}
```

**NO REEMPLAZAR - SIMPLEMENTE ELIMINAR. Ya no se usa.**

### 6. ELIMINAR/COMENTAR métodos de tipos de cemento y descripciones físicas

Ya que el servicio FabricantesService no tiene esos métodos, COMENTA O ELIMINA:

- `onTipoCementoChange()` (~680)
- `cargarTiposCemento()` (~668)
- `onDescripcionFisicaChange()` (~710)
- `cargarDescripcionesFisicas()` (~702)

O REEMPLÁZALOS por versiones simplificadas que no hagan llamadas al servicio.

### 7. Método `guardarObservacion()` - Línea ~870

**REEMPLAZAR DESDE:**
```typescript
if (observacionExistente) {
  this.observacionService.actualizar(observacionExistente.observacionId, {
    observacion: texto.trim()
  }).subscribe({
    // ...
  });
} else {
  this.observacionService.crear({
    encuestaId: encuesta.encuestaId,
    seccion: seccion,
    observacion: texto.trim()
  }).subscribe({
    // ...
  });
}
```

**REEMPLAZAR POR:**
```typescript
// Siempre usa guardarObservacion (crea o actualiza automáticamente)
this.observacionService.guardarObservacion(encuesta.encuestaId!, seccion, texto.trim()).subscribe({
  next: () => {
    guardandoMap.delete(seccion);
    this.guardandoObservacion.set(new Map(guardandoMap));
    this.cargarObservaciones(encuesta.encuestaId!);
    this.mensajeModal.set('Observación guardada exitosamente');
    this.mostrarModalExito.set(true);
    setTimeout(() => this.mostrarModalExito.set(false), 2000);
  },
  error: (error: any) => {
    console.error('Error al guardar observación:', error);
    guardandoMap.delete(seccion);
    this.guardandoObservacion.set(new Map(guardandoMap));
    this.mensajeModal.set('Error al guardar la observación');
    this.mostrarModalError.set(true);
  }
});
```

### 8. Método `confirmarDesestimar()` - Línea ~960

**REEMPLAZAR DESDE:**
```typescript
this.observacionService.eliminar(observacion.observacionId).subscribe({
```

**REEMPLAZAR POR:**
```typescript
this.observacionService.eliminarObservacion(encuesta.encuestaId!, seccion).subscribe({
```

### 9. SIMPLIFICAR la sección de Fabricantes

Como no tienes los métodos de cascadas completas, simplifica a solo 2 niveles:

**En el TypeScript, REEMPLAZA los métodos de Fabricante con:**

```typescript
// Solo mantener Fabricante → Marca (sin tipo cemento ni descripción física)
onFabricanteChange(index: number, event: Event): void {
  const select = event.target as HTMLSelectElement;
  const fabricanteId = parseInt(select.value);
  
  const marcasActuales = this.marcasSeleccionadas();
  marcasActuales[index] = {
    ...marcasActuales[index],
    fabricanteId: fabricanteId,
    marcaFabricanteId: 0,
    completo: false
  };
  this.marcasSeleccionadas.set([...marcasActuales]);

  if (fabricanteId) {
    this.cargarMarcas(index, fabricanteId);
  } else {
    this.marcasPorFila[index] = [];
  }
}

cargarMarcas(filaIndex: number, fabricanteId: number): void {
  this.fabricantesService.obtenerMarcasPorFabricante(fabricanteId).subscribe({
    next: (marcas: any[]) => {
      const marcasYaSeleccionadas = this.marcasSeleccionadas()
        .filter((_, idx) => idx !== filaIndex)
        .map(ms => ms.marcaFabricanteId);

      const marcasFiltradas = marcas.filter(m => 
        !marcasYaSeleccionadas.includes(m.marcaFabricanteId)
      );

      this.marcasPorFila[filaIndex] = marcasFiltradas;
    },
    error: (error: any) => console.error('Error al cargar marcas:', error)
  });
}

onMarcaChange(index: number, event: Event): void {
  const select = event.target as HTMLSelectElement;
  const marcaId = parseInt(select.value);

  const marcasActuales = this.marcasSeleccionadas();
  marcasActuales[index] = {
    ...marcasActuales[index],
    marcaFabricanteId: marcaId,
    completo: !!(marcasActuales[index].fabricanteId && marcaId)
  };
  this.marcasSeleccionadas.set([...marcasActuales]);

  if (marcaId && marcasActuales[index].completo) {
    this.guardarFabricante(index);
  }
}
```

### 10. Método `guardarFabricante()` - Línea ~730

**REEMPLAZAR TODO EL MÉTODO POR:**

```typescript
guardarFabricante(index: number): void {
  const marca = this.marcasSeleccionadas()[index];
  const encuestaActual = this.encuesta();

  if (!marca.completo || !encuestaActual?.encuestaId) {
    return;
  }

  const fabricante = this.fabricantes().find(f => f.fabricanteId === marca.fabricanteId);
  const marcaObj = this.marcasPorFila[index].find((m: any) => m.marcaFabricanteId === marca.marcaFabricanteId);

  if (!fabricante || !marcaObj) return;

  // Actualizar encuesta con la marca seleccionada
  const marcasActualizadas = [...(encuestaActual.marcas || [])];
  marcasActualizadas[index] = {
    fabricanteId: fabricante.fabricanteId,
    marcaFabricanteId: marcaObj.marcaFabricanteId
  };

  this.encuestasService.guardar({
    encuestaId: encuestaActual.encuestaId,
    marcas: marcasActualizadas
  } as Partial<Encuesta>).subscribe({
    next: (encuestaGuardada: Encuesta) => {
      this.encuesta.set(encuestaGuardada);
      this.mensajeModal.set('Fabricante guardado exitosamente');
      this.mostrarModalExito.set(true);
      setTimeout(() => this.mostrarModalExito.set(false), 2000);
    },
    error: (error: any) => {
      console.error('Error al guardar fabricante:', error);
      this.mensajeModal.set('Error al guardar el fabricante');
      this.mostrarModalError.set(true);
    }
  });
}
```

## ⚠️ IMPORTANTE

Después de hacer estos cambios:

1. **Elimina** las propiedades y arrays relacionados con tipo cemento y descripción física de la sección de Fabricantes si no los vas a usar
2. **Actualiza** el HTML para eliminar los dropdowns de tipo cemento y descripción física
3. **Verifica** que los tipos de datos sean correctos (agrega `: any` donde sea necesario para evitar errores de tipo)

## 📝 RESUMEN

Los cambios principales son:
- Usar `encuestadosService.listar()` en lugar de `.buscarEncuestado()`
- Usar `fabricantesService.obtenerMarcasPorFabricante()` en lugar de `.listarMarcasPorFabricante()`
- Usar `encuestasService.guardar()` para todas las actualizaciones
- Usar `observacionService.guardarObservacion()` y `.eliminarObservacion()` con encuestaId y seccion
- Simplificar fabricantes a solo 2 niveles (Fabricante → Marca)
