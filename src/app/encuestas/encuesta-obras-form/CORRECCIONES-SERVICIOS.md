# CORRECCIONES DE NOMBRES DE SERVICIOS

## ❌ NOMBRES INCORRECTOS → ✅ NOMBRES CORRECTOS

### 1. EncuestadosService

**Línea ~455** - Buscar encuestado:
```typescript
// ❌ INCORRECTO:
this.encuestadosService.buscarEncuestado(termino).subscribe({

// ✅ CORRECTO: (no existe método de búsqueda separado, usa crear directamente)
// O busca si existe un método .buscar() o .listar() con filtro
```

**Línea ~500** - Crear encuestado:
```typescript
// ✅ CORRECTO (ya está bien):
this.encuestadosService.crear(encuestado).subscribe({
```

### 2. FabricantesService

**Línea ~616** - Obtener marcas por fabricante:
```typescript
// ❌ INCORRECTO:
this.fabricantesService.listarMarcasPorFabricante(fabricanteId).subscribe({

// ✅ CORRECTO:
this.fabricantesService.obtenerMarcasPorFabricante(fabricanteId).subscribe({
```

**Línea ~668** - Obtener tipos de cemento:
```typescript
// ❌ INCORRECTO:
this.fabricantesService.listarTiposCementoPorMarca(fabricanteId, marcaId).subscribe({

// ✅ CORRECTO: (busca si existe este método o usa otro)
// Probablemente no existe. Mira cómo lo hace encuesta-form.component.ts
// Puede que necesites hacer la lógica diferente
```

**Línea ~702** - Obtener descripciones físicas:
```typescript
// ❌ INCORRECTO:
this.fabricantesService.listarDescripcionesFisicasPorTipo(fabricanteId, marcaId, tipoCemento).subscribe({

// ✅ CORRECTO: (busca si existe este método o usa otro)
// Probablemente no existe. Mira cómo lo hace encuesta-form.component.ts
```

### 3. EncuestasService

**Línea ~750** - Guardar fabricante:
```typescript
// ❌ INCORRECTO:
this.encuestasService.guardarFabricante(datos).subscribe({

// ✅ CORRECTO: Usa .guardar() con el objeto completo encuesta
// O busca si existe un método específico para fabricantes
this.encuestasService.guardar(encuestaActualizada).subscribe({
```

**Línea ~798** - Desestimar fabricante:
```typescript
// ❌ INCORRECTO:
this.encuestasService.desestimarFabricante(encuestaFabricanteId).subscribe({

// ✅ CORRECTO: (busca si existe o usa otra estrategia)
// Puede que no exista método separado
```

**Línea ~836** - Actualizar encuesta:
```typescript
// ❌ INCORRECTO:
this.encuestasService.actualizar(encuestaActual.encuestaId, encuestaActual).subscribe({

// ✅ CORRECTO:
this.encuestasService.guardar(encuestaActual).subscribe({
// O puede ser:
this.encuestasService.actualizarEncuesta(encuestaActual).subscribe({
```

### 4. EncuestaObservacionService

**Línea ~885** - Actualizar observación:
```typescript
// ❌ INCORRECTO:
this.observacionService.actualizar(observacionExistente.observacionId, { observacion: texto }).subscribe({

// ✅ CORRECTO:
this.observacionService.guardarObservacion(encuestaId, seccion, texto).subscribe({
```

**Línea ~910** - Crear observación:
```typescript
// ❌ INCORRECTO:
this.observacionService.crear({ encuestaId, seccion, observacion: texto }).subscribe({

// ✅ CORRECTO:
this.observacionService.guardarObservacion(encuestaId, seccion, texto).subscribe({
```

**Línea ~964** - Eliminar observación:
```typescript
// ❌ INCORRECTO:
this.observacionService.eliminar(observacion.observacionId).subscribe({

// ✅ CORRECTO:
this.observacionService.eliminarObservacion(encuestaId, seccion).subscribe({
```

## 🔍 CÓMO ENCONTRAR LOS MÉTODOS CORRECTOS

Abre `encuesta-form.component.ts` (el de INDUSTRIA) y busca:

1. **Para Encuestados**: Busca `encuestadosService.` y mira qué métodos usa
2. **Para Fabricantes**: Busca `fabricantesService.` y copia exactamente los nombres
3. **Para Encuestas**: Busca `encuestasService.guardar` o `encuestasService.actualizar`
4. **Para Observaciones**: Busca `observacionService.` y copia los nombres

## ⚠️ NOTA IMPORTANTE

Es posible que el formulario de INDUSTRIA NO use cascadas de tipo cemento y descripción física.
Si ves que `encuesta-form.component.ts` no tiene esos métodos, entonces:

1. **Opción A**: Elimina esas cascadas y deja solo Fabricante → Marca
2. **Opción B**: Busca esos métodos en `FabricantesService` y agrégalos si no existen

## 📝 SIGUIENTE ACCIÓN

Usa estos reemplazos para corregir `encuesta-obras-form.component.ts` después de pegar los métodos de `metodos-pendientes.ts`.
