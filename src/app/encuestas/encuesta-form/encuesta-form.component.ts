import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EncuestasService } from '../../core/services/encuestas.service';
import { EmpresasService } from '../../core/services/empresas.service';
import { ParametrosService } from '../../core/services/parametros.service';
import { FabricantesService } from '../../core/services/fabricantes.service';
import { Encuesta, Empresa, TipoEmpresa, Parametro, Encuestado } from '../../core/models';
import { EncuestadosService } from '../../core/services/encuestados.service';

@Component({
  selector: 'app-encuesta-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './encuesta-form.component.html',
  styleUrl: './encuesta-form.component.css'
})
export class EncuestaFormComponent implements OnInit {
  encuesta = signal<Encuesta | null>(null);
  cargando = signal(true);
  encuestaId = signal<number>(0);

  // Búsqueda de encuestados
  tipoBusquedaEncuestado = signal<'numdoc' | 'nombres'>('numdoc');
  terminoBusquedaEncuestado = signal('');
  encuestadosEncontrados = signal<Encuestado[]>([]);
  buscandoEncuestado = signal(false);
  mostrarResultadosEncuestado = signal(false);
  encuestadoSeleccionado = signal<Encuestado | null>(null);
  errorBusquedaEncuestado = signal('');
  errorContactoEncuestado = signal('');
  
  // Registro de nuevo encuestado
  mostrarFormularioRegistroEncuestado = signal(false);
  mostrarModalNoEncontradaEncuestado = signal(false);
  guardandoEncuestado = signal(false);
  nuevoEncuestado: Partial<Encuestado> = {
    nombres: '',
    apepat: '',
    apemat: '',
    numdoc: '',
    tipodoc: '',
    cargo: '',
    tipoContacto: '',
    contacto: ''
  };

  // Datos del encuestado (ya no se usa directamente)
  datosEncuestado = signal<Partial<Encuestado>>({
    nombres: '',
    apepat: '',
    apemat: '',
    numdoc: '',
    tipodoc: '',
    cargo: ''
  });

  // Control de secciones expandidas
  seccionExpandida = signal<string | null>(null);

  // Fecha máxima permitida (hoy)
  fechaMaxima = new Date().toISOString().split('T')[0];

  // Búsqueda de empresas
  tipoBusquedaEmpresa = signal<'ruc' | 'razonSocial'>('ruc');
  terminoBusqueda = signal('');
  empresasEncontradas = signal<Empresa[]>([]);
  buscandoEmpresa = signal(false);
  mostrarResultadosEmpresa = signal(false);
  empresaSeleccionada = signal<Empresa | null>(null);
  errorBusquedaRuc = signal(false);
  
  // Registro de nueva empresa
  mostrarFormularioRegistro = signal(false);
  mostrarModalNoEncontrada = signal(false);
  mostrarModalRucDuplicado = signal(false);
  mostrarModalExito = signal(false);
  mostrarModalError = signal(false);
  mensajeModal = signal('');
  guardandoEmpresa = signal(false);
  errorRucRegistro = signal('');
  tiposEmpresa = signal<TipoEmpresa[]>([]);
  lugaresCompra = signal<Parametro[]>([]);
  tiposCompraCemento = signal<Parametro[]>([]);
  tiposPresentacionBolsa = signal<Parametro[]>([]);
  tiposPresentacionGranel = signal<Parametro[]>([]);
  cantidadPresentacionBolsa = signal<Parametro[]>([]);
  cantidadPresentacionBombona = signal<Parametro[]>([]);
  cantidadPresentacionBigbag = signal<Parametro[]>([]);
  mediosContacto = signal<Parametro[]>([]);
  fabricantes = signal<any[]>([]);
  fabricantesCargados = signal(false);
  marcasFabricante = signal<any[]>([]);
  marcasCargadasPorFabricante = signal<{[key: number]: boolean}>({});
  marcasUnicas = signal<string[]>([]);
  tiposCementoPorMarca = signal<any[]>([]);
  nuevaEmpresa = signal<Partial<Empresa>>({
    razonSocial: '',
    ruc: '',
    tipoEmpresaId: 1,
    condicionContribuyente: '',
    tamanoEmpresa: '',
    actividadEconomica: ''
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private encuestasService: EncuestasService,
    private empresasService: EmpresasService,
    private parametrosService: ParametrosService,
    private fabricantesService: FabricantesService,
    private encuestadosService: EncuestadosService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.encuestaId.set(+id);
      this.cargarEncuesta(+id);
    }
    
    // Cargar tipos de empresa
    this.cargarTiposEmpresa();
    
    // Cargar lugares de compra
    this.cargarLugaresCompra();
    
    // Cargar tipos de compra de cemento
    this.cargarTiposCompraCemento();
    
    // Cargar tipos de presentación bolsa
    this.cargarTiposPresentacionBolsa();
    
    // Cargar tipos de presentación granel
    this.cargarTiposPresentacionGranel();
    
    // NO cargar fabricantes automáticamente
    // this.cargarFabricantes();
    
    // Cargar cantidades de presentación
    this.cargarCantidadPresentacionBolsa();
    this.cargarCantidadPresentacionBombona();
    this.cargarCantidadPresentacionBigbag();
    
    // Cargar medios de contacto
    this.cargarMediosContacto();
  }

  cargarTiposEmpresa(): void {
    this.empresasService.listarTipos().subscribe({
      next: (tipos) => {
        this.tiposEmpresa.set(tipos);
      },
      error: (error) => {
        console.error('Error al cargar tipos de empresa:', error);
      }
    });
  }

  cargarLugaresCompra(): void {
    this.parametrosService.listarPorCategoria('LUGAR_COMPRA').subscribe({
      next: (lugares) => {
        this.lugaresCompra.set(lugares);
      },
      error: (error) => {
        console.error('Error al cargar lugares de compra:', error);
      }
    });
  }

  cargarTiposCompraCemento(): void {
    this.parametrosService.listarPorCategoria('TIPO_COMPRA_CEMENTO').subscribe({
      next: (tipos) => {
        this.tiposCompraCemento.set(tipos);
      },
      error: (error) => {
        console.error('Error al cargar tipos de compra de cemento:', error);
      }
    });
  }

  cargarTiposPresentacionBolsa(): void {
    this.parametrosService.listarPorCategoria('TIPO_PRESENTACION_BOLSA').subscribe({
      next: (tipos) => {
        this.tiposPresentacionBolsa.set(tipos);
      },
      error: (error) => {
        console.error('Error al cargar tipos de presentación bolsa:', error);
      }
    });
  }

  cargarTiposPresentacionGranel(): void {
    this.parametrosService.listarPorCategoria('TIPO_PRESENTACION_GRANEL').subscribe({
      next: (tipos) => {
        this.tiposPresentacionGranel.set(tipos);
      },
      error: (error) => {
        console.error('Error al cargar tipos de presentación granel:', error);
      }
    });
  }

  cargarFabricantes(): void {
    if (this.fabricantesCargados()) {
      console.log('Fabricantes ya están cargados, no se vuelve a llamar al endpoint');
      return;
    }
    
    console.log('Cargando fabricantes desde el endpoint...');
    this.fabricantesService.listar().subscribe({
      next: (fabricantes) => {
        console.log('Fabricantes cargados:', fabricantes);
        this.fabricantes.set(fabricantes);
        this.fabricantesCargados.set(true);
      },
      error: (error) => {
        console.error('Error al cargar fabricantes:', error);
      }
    });
  }

  onFabricanteDropdownClick(): void {
    console.log('Click en dropdown de Fabricante');
    this.cargarFabricantes();
  }

  cargarCantidadPresentacionBolsa(): void {
    this.parametrosService.listarPorCategoria('CANTIDAD_PRESENTACION_BOLSA').subscribe({
      next: (cantidades) => {
        this.cantidadPresentacionBolsa.set(cantidades);
      },
      error: (error) => {
        console.error('Error al cargar cantidad presentación bolsa:', error);
      }
    });
  }

  cargarCantidadPresentacionBombona(): void {
    this.parametrosService.listarPorCategoria('CANTIDAD_PRESENTACION_BOMBONA').subscribe({
      next: (cantidades) => {
        this.cantidadPresentacionBombona.set(cantidades);
      },
      error: (error) => {
        console.error('Error al cargar cantidad presentación bombona:', error);
      }
    });
  }

  cargarCantidadPresentacionBigbag(): void {
    this.parametrosService.listarPorCategoria('CANTIDAD_PRESENTACION_BIGBAG').subscribe({
      next: (cantidades) => {
        this.cantidadPresentacionBigbag.set(cantidades);
      },
      error: (error) => {
        console.error('Error al cargar cantidad presentación bigbag:', error);
      }
    });
  }

  cargarMediosContacto(): void {
    this.parametrosService.listarPorCategoria('MEDIO_CONTACTO').subscribe({
      next: (medios) => {
        this.mediosContacto.set(medios);
      },
      error: (error) => {
        console.error('Error al cargar medios de contacto:', error);
      }
    });
  }

  cargarEncuesta(id: number): void {
    this.cargando.set(true);
    this.encuestasService.obtenerPorId(id).subscribe({
      next: (encuesta) => {
        console.log('Encuesta cargada del backend:', encuesta);
        
        // Convertir fechaEncuesta de ISO a formato YYYY-MM-DD si existe
        if (encuesta.fechaEncuesta) {
          const fecha = new Date(encuesta.fechaEncuesta);
          const año = fecha.getFullYear();
          const mes = String(fecha.getMonth() + 1).padStart(2, '0');
          const dia = String(fecha.getDate()).padStart(2, '0');
          encuesta.fechaEncuesta = `${año}-${mes}-${dia}`;
        }
        
        // Si viene marcaFabricanteInfo, autocompletar los campos para mostrarlos
        if (encuesta.marcaFabricanteInfo) {
          encuesta.nombreMarca = encuesta.marcaFabricanteInfo.nombreMarca || undefined;
          encuesta.tipoCemento = encuesta.marcaFabricanteInfo.tipoCemento;
          encuesta.descFisica = encuesta.marcaFabricanteInfo.descFisica || undefined;
        }
        
        console.log('Encuesta después de autocompletar:', {
          fabricanteId: encuesta.fabricanteId,
          nombreMarca: encuesta.nombreMarca,
          marcaFabricante: encuesta.marcaFabricante,
          tipoCemento: encuesta.tipoCemento
        });
        
        this.encuesta.set(encuesta);
        this.cargando.set(false);
        
        // Si la encuesta ya tiene empresa, cargar sus datos
        if (encuesta.empresaId) {
          this.cargarEmpresaSeleccionada(encuesta.empresaId);
        }

        // Si la encuesta tiene datos del encuestado, cargarlos
        if (encuesta.encuestado) {
          this.encuestadoSeleccionado.set(encuesta.encuestado);
        }
        
        // NO llamar a cargarMarcasPorFabricante aquí
        // Los datos ya vienen en marcaFabricanteInfo y se muestran directamente
      },
      error: (error) => {
        console.error('Error al cargar encuesta:', error);
        this.cargando.set(false);
        this.mensajeModal.set('Error al cargar la encuesta');
        this.mostrarModalError.set(true);
        setTimeout(() => {
          this.router.navigate(['/encuestas']);
        }, 2000);
      }
    });
  }

  cargarEmpresaSeleccionada(empresaId: number): void {
    this.empresasService.obtenerPorId(empresaId).subscribe({
      next: (empresa) => {
        this.empresaSeleccionada.set(empresa);
        this.terminoBusqueda.set(`${empresa.razonSocial} (RUC: ${empresa.ruc})`);
      },
      error: (error) => {
        console.error('Error al cargar empresa:', error);
      }
    });
  }

  guardarEncuesta(): void {
    const encuestaActual = this.encuesta();
    if (!encuestaActual) {
      this.mensajeModal.set('No hay datos de encuesta para guardar');
      this.mostrarModalError.set(true);
      return;
    }

    // Validar que tenga empresa asignada
    if (!encuestaActual.empresaId) {
      this.mensajeModal.set('Debe seleccionar o registrar una empresa antes de guardar');
      this.mostrarModalError.set(true);
      return;
    }

    // Preparar payload solo con campos que tienen valor (no undefined, no null, no strings vacíos)
    const encuestadoData = this.datosEncuestado();
    const encuestaParaGuardar: Partial<Encuesta> = {
      encuestaId: encuestaActual.encuestaId,
      ...(encuestaActual.empresaId && { empresaId: encuestaActual.empresaId }),
      ...(encuestaActual.tipoEncuesta && { tipoEncuesta: encuestaActual.tipoEncuesta }),
      ...(encuestaActual.tipoEncuestaValor && { tipoEncuestaValor: encuestaActual.tipoEncuestaValor }),
      ...(encuestaActual.fechaEncuesta && { fechaEncuesta: encuestaActual.fechaEncuesta }),
      // Incluir datos del encuestado si están completos
      ...(encuestadoData.nombres && encuestadoData.apepat && encuestadoData.apemat && {
        encuestado: {
          ...(encuestadoData.encuestadoId && { encuestadoId: encuestadoData.encuestadoId }),
          nombres: encuestadoData.nombres,
          apepat: encuestadoData.apepat,
          apemat: encuestadoData.apemat,
          numdoc: encuestadoData.numdoc,
          tipodoc: encuestadoData.tipodoc,
          cargo: encuestadoData.cargo
        }
      }),
      ...(encuestaActual.concretoPremezclado !== undefined && encuestaActual.concretoPremezclado !== null && { concretoPremezclado: encuestaActual.concretoPremezclado }),
      ...(encuestaActual.articulosConcreto !== undefined && encuestaActual.articulosConcreto !== null && { articulosConcreto: encuestaActual.articulosConcreto }),
      ...(encuestaActual.fabricanteId && { fabricanteId: encuestaActual.fabricanteId }),
      ...(encuestaActual.marcaFabricante && { marcaFabricante: encuestaActual.marcaFabricante }),
      ...(encuestaActual.tipoLugarCompra && { tipoLugarCompra: encuestaActual.tipoLugarCompra }),
      ...(encuestaActual.tipoCompra && { tipoCompra: encuestaActual.tipoCompra }),
      ...(encuestaActual.presentacionCompra && { presentacionCompra: encuestaActual.presentacionCompra }),
      ...(encuestaActual.cantidadPresentacionCompra && encuestaActual.cantidadPresentacionCompra.trim() !== '' && { cantidadPresentacionCompra: encuestaActual.cantidadPresentacionCompra }),
      ...(encuestaActual.descCompra && { descCompra: encuestaActual.descCompra }),
      ...(encuestaActual.precio !== undefined && encuestaActual.precio !== null && { precio: encuestaActual.precio }),
      ...(encuestaActual.conIgv !== undefined && encuestaActual.conIgv !== null && { conIgv: encuestaActual.conIgv }),
      ...(encuestaActual.usoCemento && { usoCemento: encuestaActual.usoCemento }),
      ...(encuestaActual.motivoCompra && { motivoCompra: encuestaActual.motivoCompra }),
      ...(encuestaActual.deseoRegalo !== undefined && encuestaActual.deseoRegalo !== null && { deseoRegalo: encuestaActual.deseoRegalo })
    };

    this.encuestasService.guardar(encuestaParaGuardar).subscribe({
      next: (encuestaGuardada) => {
        this.encuesta.set(encuestaGuardada);
        this.mensajeModal.set('Encuesta guardada exitosamente');
        this.mostrarModalExito.set(true);
        // Redirigir al listado después de 1 segundo
        setTimeout(() => {
          this.router.navigate(['/encuestas']);
        }, 1000);
      },
      error: (error) => {
        console.error('Error al guardar encuesta:', error);
        this.mensajeModal.set('Error al guardar la encuesta. Por favor, intente nuevamente.');
        this.mostrarModalError.set(true);
      }
    });
  }

  toggleSeccion(seccion: string): void {
    if (this.seccionExpandida() === seccion) {
      this.seccionExpandida.set(null);
    } else {
      this.seccionExpandida.set(seccion);
    }
  }

  esSeccionExpandida(seccion: string): boolean {
    return this.seccionExpandida() === seccion;
  }

  actualizarFechaEncuesta(event: Event): void {
    const input = event.target as HTMLInputElement;
    const fechaSeleccionada = input.value;
    
    const encuestaActual = this.encuesta();
    if (encuestaActual) {
      this.encuesta.set({
        ...encuestaActual,
        fechaEncuesta: fechaSeleccionada
      });
    }
  }

  seleccionarTipoProducto(tipo: 'premezclado' | 'articulos'): void {
    const encuestaActual = this.encuesta();
    if (encuestaActual) {
      this.encuesta.set({
        ...encuestaActual,
        concretoPremezclado: tipo === 'premezclado' ? 1 : 0,
        articulosConcreto: tipo === 'articulos' ? 1 : 0
      });
    }
  }

  seleccionarLugarCompra(llave: string): void {
    const encuestaActual = this.encuesta();
    if (encuestaActual) {
      this.encuesta.set({
        ...encuestaActual,
        tipoLugarCompra: llave
      });
    }
  }

  seleccionarFabricante(fabricanteId: number | undefined): void {
    const encuestaActual = this.encuesta();
    if (encuestaActual && fabricanteId) {
      console.log('Fabricante seleccionado:', fabricanteId);
      this.encuesta.set({
        ...encuestaActual,
        fabricanteId: fabricanteId,
        marcaFabricante: undefined, // Resetear la referencia de marca
        nombreMarca: undefined, // Resetear la marca al cambiar fabricante
        tipoCemento: undefined, // Resetear tipo cemento
        descFisica: undefined // Resetear descripción física
      });
      
      // Cargar marcas del fabricante seleccionado
      this.cargarMarcasPorFabricante(fabricanteId);
    } else {
      this.marcasFabricante.set([]);
      this.marcasUnicas.set([]);
      this.tiposCementoPorMarca.set([]);
    }
  }

  cargarMarcasPorFabricante(fabricanteId: number): void {
    // Verificar si ya se cargaron las marcas para este fabricante
    const yaEstanCargadas = this.marcasCargadasPorFabricante()[fabricanteId];
    if (yaEstanCargadas) {
      console.log('Marcas del fabricante', fabricanteId, 'ya están cargadas, no se vuelve a llamar al endpoint');
      return;
    }
    
    console.log('Cargando marcas para fabricanteId:', fabricanteId);
    this.fabricantesService.obtenerMarcasPorFabricante(fabricanteId).subscribe({
      next: (marcas) => {
        console.log('Marcas cargadas:', marcas);
        this.marcasFabricante.set(marcas);
        
        // Marcar como cargadas
        const cargadas = this.marcasCargadasPorFabricante();
        this.marcasCargadasPorFabricante.set({ ...cargadas, [fabricanteId]: true });
        
        // Obtener nombres de marca únicos
        const nombresUnicos = [...new Set(marcas.map((m: any) => m.nombreMarca))].filter(Boolean);
        console.log('Marcas únicas:', nombresUnicos);
        this.marcasUnicas.set(nombresUnicos as string[]);
        
        // Si la encuesta ya tiene nombreMarca, cargar los tipos de cemento para esa marca
        const encuestaActual = this.encuesta();
        console.log('Encuesta actual al cargar marcas:', {
          nombreMarca: encuestaActual?.nombreMarca,
          marcaFabricante: encuestaActual?.marcaFabricante
        });
        
        if (encuestaActual?.nombreMarca) {
          const tiposCemento = marcas.filter((m: any) => m.nombreMarca === encuestaActual.nombreMarca);
          console.log('Tipos de cemento filtrados para marca', encuestaActual.nombreMarca, ':', tiposCemento);
          this.tiposCementoPorMarca.set(tiposCemento);
        } else {
          // Resetear tipos de cemento solo si no hay nombreMarca
          this.tiposCementoPorMarca.set([]);
        }
      },
      error: (error) => {
        console.error('Error al cargar marcas del fabricante:', error);
        this.marcasFabricante.set([]);
        this.marcasUnicas.set([]);
        this.tiposCementoPorMarca.set([]);
      }
    });
  }

  onMarcaDropdownClick(): void {
    const fabricanteId = this.encuesta()?.fabricanteId;
    if (fabricanteId) {
      console.log('Click en dropdown de Marca');
      this.cargarMarcasPorFabricante(fabricanteId);
    }
  }

  seleccionarNombreMarca(nombreMarca: string | undefined): void {
    const encuestaActual = this.encuesta();
    if (encuestaActual && nombreMarca) {
      console.log('Marca seleccionada:', nombreMarca);
      // Filtrar tipos de cemento disponibles para esta marca
      const tiposCemento = this.marcasFabricante().filter(m => m.nombreMarca === nombreMarca);
      console.log('Tipos de cemento para esta marca:', tiposCemento);
      this.tiposCementoPorMarca.set(tiposCemento);
      
      this.encuesta.set({
        ...encuestaActual,
        nombreMarca: nombreMarca,
        marcaFabricante: undefined, // Resetear marcaFabricante hasta que seleccione tipo de cemento
        tipoCemento: undefined,
        descFisica: undefined
      });
    }
  }

  seleccionarMarcaFabricante(marcaFabricanteId: number | undefined): void {
    const encuestaActual = this.encuesta();
    if (encuestaActual && marcaFabricanteId) {
      console.log('Tipo de cemento seleccionado (marcaFabricanteId):', marcaFabricanteId, 'tipo:', typeof marcaFabricanteId);
      
      // Convertir a número si viene como string
      const idNumerico = typeof marcaFabricanteId === 'string' ? Number(marcaFabricanteId) : marcaFabricanteId;
      
      // Buscar la marca seleccionada para obtener sus datos completos
      const marcaSeleccionada = this.marcasFabricante().find(m => m.marcaFabricanteId === idNumerico);
      console.log('Datos completos de la marca:', marcaSeleccionada);
      console.log('Descripción física a establecer:', marcaSeleccionada?.descFisica);
      
      const nuevaEncuesta = {
        ...encuestaActual,
        marcaFabricante: idNumerico,
        // NO actualizar nombreMarca aquí, mantener el valor actual
        tipoCemento: marcaSeleccionada?.tipoCemento,
        descFisica: marcaSeleccionada?.descFisica
      };
      
      console.log('Encuesta actualizada:', nuevaEncuesta);
      this.encuesta.set(nuevaEncuesta);
      console.log('Encuesta después de set:', this.encuesta());
    }
  }

  seleccionarTipoCompraCemento(llave: string): void {
    const encuestaActual = this.encuesta();
    if (encuestaActual) {
      this.encuesta.set({
        ...encuestaActual,
        tipoCompra: llave,
        presentacionCompra: '', // Resetear presentación al cambiar tipo de compra
        cantidadPresentacionCompra: '' // Resetear cantidad al cambiar tipo de compra
      });
    }
  }

  seleccionarPresentacionCompra(llave: string): void {
    const encuestaActual = this.encuesta();
    if (encuestaActual) {
      this.encuesta.set({
        ...encuestaActual,
        presentacionCompra: llave,
        cantidadPresentacionCompra: '' // Resetear cantidad al cambiar presentación
      });
    }
  }

  seleccionarCantidadPresentacion(llave: string): void {
    const encuestaActual = this.encuesta();
    if (encuestaActual) {
      this.encuesta.set({
        ...encuestaActual,
        cantidadPresentacionCompra: llave
      });
    }
  }

  actualizarDescCompra(valor: string): void {
    const encuestaActual = this.encuesta();
    if (encuestaActual) {
      this.encuesta.set({
        ...encuestaActual,
        descCompra: valor && valor.trim() !== '' ? valor : undefined
      });
    }
  }

  validarLimitePrecio(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    const valorActual = input.value;
    const key = event.key;
    
    // Permitir teclas de control (backspace, delete, tab, escape, enter, arrows)
    if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key)) {
      return;
    }
    
    // Permitir Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
    if (event.ctrlKey || event.metaKey) {
      return;
    }
    
    // Construir el nuevo valor que se tendría después de la tecla
    const selectionStart = input.selectionStart || 0;
    const selectionEnd = input.selectionEnd || 0;
    const nuevoValor = valorActual.substring(0, selectionStart) + key + valorActual.substring(selectionEnd);
    const numero = Number(nuevoValor);
    
    // Si el nuevo valor excede el límite, prevenir la entrada
    if (!isNaN(numero) && numero > 99999999.99) {
      event.preventDefault();
    }
  }

  actualizarPrecio(valor: string): void {
    const encuestaActual = this.encuesta();
    if (encuestaActual) {
      const numero = Number(valor);
      const MAX_PRECIO = 99999999.99;
      
      // Si excede el límite, no actualizar (mantener valor anterior)
      if (numero > MAX_PRECIO) {
        return;
      }
      
      this.encuesta.set({
        ...encuestaActual,
        precio: valor && numero >= 0 ? numero : undefined
      });
    }
  }

  toggleIgv(checked: boolean): void {
    const encuestaActual = this.encuesta();
    if (encuestaActual) {
      this.encuesta.set({
        ...encuestaActual,
        conIgv: checked ? 1 : 0
      });
    }
  }

  actualizarUsoCemento(valor: string): void {
    const encuestaActual = this.encuesta();
    if (encuestaActual) {
      this.encuesta.set({
        ...encuestaActual,
        usoCemento: valor.trim() || undefined
      });
    }
  }

  actualizarMotivoCompra(valor: string): void {
    const encuestaActual = this.encuesta();
    if (encuestaActual) {
      this.encuesta.set({
        ...encuestaActual,
        motivoCompra: valor.trim() || undefined
      });
    }
  }

  actualizarDeseoRegalo(valor: string): void {
    const encuestaActual = this.encuesta();
    if (encuestaActual) {
      this.encuesta.set({
        ...encuestaActual,
        deseoRegalo: valor ? Number(valor) : undefined
      });
    }
  }

  validarNumeroPositivo(event: KeyboardEvent): void {
    const char = event.key;
    const input = event.target as HTMLInputElement;
    const currentValue = input.value;
    
    // Permitir teclas de control
    if (event.ctrlKey || event.metaKey || 
        ['Backspace', 'Tab', 'Enter', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(char)) {
      return;
    }
    
    // Bloquear signo negativo, signo positivo y notación científica
    if (['-', '+', 'e', 'E'].includes(char)) {
      event.preventDefault();
      return;
    }
    
    // Permitir punto decimal solo si no hay uno ya
    if (char === '.' || char === ',') {
      if (currentValue.includes('.')) {
        event.preventDefault();
        return;
      }
      return;
    }
    
    // Solo permitir dígitos (0-9)
    if (!/^\d$/.test(char)) {
      event.preventDefault();
    }
  }

  validarBusquedaRuc(): void {
    // No mostrar error mientras escribe, solo al presionar Enter
    this.errorBusquedaRuc.set(false);
  }

  validarRucParaBusqueda(): boolean {
    const termino = this.terminoBusqueda().trim();
    
    if (this.tipoBusquedaEmpresa() === 'ruc') {
      // Verificar que solo tenga números
      const soloNumeros = /^\d+$/.test(termino);
      if (!soloNumeros) {
        this.errorBusquedaRuc.set(true);
        return false;
      }
      // Verificar que tenga exactamente 11 dígitos
      if (termino.length !== 11) {
        this.errorBusquedaRuc.set(true);
        return false;
      }
    }
    
    this.errorBusquedaRuc.set(false);
    return true;
  }

  tieneLetrasEnRuc(): boolean {
    const termino = this.terminoBusqueda().trim();
    return this.tipoBusquedaEmpresa() === 'ruc' && !/^\d*$/.test(termino) && termino.length > 0;
  }

  rucLongitudIncorrecta(): boolean {
    const termino = this.terminoBusqueda().trim();
    return this.tipoBusquedaEmpresa() === 'ruc' && /^\d+$/.test(termino) && termino.length !== 11;
  }

  volver(): void {
    this.router.navigate(['/encuestas']);
  }

  buscarEmpresa(): void {
    const termino = this.terminoBusqueda().trim();
    
    if (termino.length < 1) {
      this.empresasEncontradas.set([]);
      this.mostrarResultadosEmpresa.set(false);
      this.mostrarFormularioRegistro.set(false);
      return;
    }

    // Validar RUC si es búsqueda por RUC
    if (!this.validarRucParaBusqueda()) {
      // El error ya se muestra debajo del input
      return;
    }

    // Limpiar el formulario de registro cuando se hace una nueva búsqueda
    this.mostrarFormularioRegistro.set(false);
    this.nuevaEmpresa.set({
      razonSocial: '',
      ruc: '',
      tipoEmpresaId: 1,
      condicionContribuyente: '',
      tamanoEmpresa: '',
      actividadEconomica: ''
    });

    this.buscandoEmpresa.set(true);
    this.mostrarResultadosEmpresa.set(true);

    // Usar el tipo de búsqueda seleccionado y limitar a 5 resultados
    const razonSocial = this.tipoBusquedaEmpresa() === 'razonSocial' ? termino : undefined;
    const ruc = this.tipoBusquedaEmpresa() === 'ruc' ? termino : undefined;

    this.empresasService.listar(1, 5, razonSocial, ruc).subscribe({
      next: (response) => {
        this.empresasEncontradas.set(response.data);
        this.buscandoEmpresa.set(false);
        
        // Si no hay resultados, mostrar modal de confirmación
        if (response.data.length === 0) {
          this.mostrarModalNoEncontrada.set(true);
          this.mostrarResultadosEmpresa.set(false);
        }
      },
      error: (error) => {
        console.error('Error al buscar empresas:', error);
        this.buscandoEmpresa.set(false);
        this.empresasEncontradas.set([]);
      }
    });
  }

  seleccionarEmpresa(empresa: Empresa): void {
    const encuestaActual = this.encuesta();
    if (encuestaActual) {
      // Guardar solo los campos necesarios: id, empresaId, tipoEncuesta, tipoEncuestaValor y fechaEncuesta
      const encuestaActualizada: Partial<Encuesta> = {
        encuestaId: encuestaActual.encuestaId,
        empresaId: empresa.empresaId,
        tipoEncuesta: encuestaActual.tipoEncuesta,
        tipoEncuestaValor: encuestaActual.tipoEncuestaValor,
        fechaEncuesta: encuestaActual.fechaEncuesta
      };
      
      this.encuestasService.guardar(encuestaActualizada).subscribe({
        next: (encuestaGuardada) => {
          this.encuesta.set(encuestaGuardada);
          this.empresaSeleccionada.set(empresa);
          this.mostrarResultadosEmpresa.set(false);
          this.terminoBusqueda.set(`${empresa.razonSocial} (RUC: ${empresa.ruc})`);
        },
        error: (error) => {
          console.error('Error al actualizar encuesta:', error);
          this.mensajeModal.set('Error al asignar la empresa a la encuesta');
          this.mostrarModalError.set(true);
        }
      });
    }
  }

  cerrarResultadosEmpresa(): void {
    this.mostrarResultadosEmpresa.set(false);
  }

  confirmarRegistroEmpresa(): void {
    this.mostrarModalNoEncontrada.set(false);
    this.mostrarFormularioRegistro.set(true);
    
    const termino = this.terminoBusqueda().trim();
    
    // Pre-llenar el campo según el tipo de búsqueda
    if (this.tipoBusquedaEmpresa() === 'ruc') {
      this.nuevaEmpresa.set({ ...this.nuevaEmpresa(), ruc: termino });
    } else {
      this.nuevaEmpresa.set({ ...this.nuevaEmpresa(), razonSocial: termino });
    }
  }

  cerrarModalNoEncontrada(): void {
    this.mostrarModalNoEncontrada.set(false);
  }

  cancelarRegistroEmpresa(): void {
    this.mostrarFormularioRegistro.set(false);
    this.errorRucRegistro.set('');
    this.nuevaEmpresa.set({
      razonSocial: '',
      ruc: '',
      tipoEmpresaId: 1,
      condicionContribuyente: '',
      tamanoEmpresa: '',
      actividadEconomica: ''
    });
  }

  validarRucRegistro(): void {
    const ruc = this.nuevaEmpresa().ruc || '';
    
    if (ruc.length === 0) {
      this.errorRucRegistro.set('');
      return;
    }

    const soloNumeros = /^\d+$/.test(ruc);
    if (!soloNumeros) {
      this.errorRucRegistro.set('El RUC debe contener solo números');
      return;
    }

    if (ruc.length !== 11) {
      this.errorRucRegistro.set('El RUC debe tener exactamente 11 dígitos');
      return;
    }

    this.errorRucRegistro.set('');
  }

  guardarNuevaEmpresa(): void {
    const empresa = this.nuevaEmpresa();
    
    // Validar que todos los campos obligatorios estén completos
    if (!empresa.razonSocial || !empresa.ruc || !empresa.tipoEmpresaId || 
        !empresa.condicionContribuyente || !empresa.tamanoEmpresa || !empresa.actividadEconomica) {
      this.mensajeModal.set('Todos los campos son obligatorios');
      this.mostrarModalError.set(true);
      return;
    }

    // Validar formato y longitud del RUC
    const soloNumeros = /^\d+$/.test(empresa.ruc);
    if (!soloNumeros) {
      this.errorRucRegistro.set('El RUC debe contener solo números');
      return;
    }
    if (empresa.ruc.length !== 11) {
      this.errorRucRegistro.set('El RUC debe tener exactamente 11 dígitos');
      return;
    }

    this.errorRucRegistro.set('');
    this.guardandoEmpresa.set(true);
    
    // Paso 1: Crear la empresa
    this.empresasService.crear(empresa).subscribe({
      next: (empresaCreada) => {
        // Paso 2: Guardar la encuesta completa con el ID de la empresa creada
        const encuestaActual = this.encuesta();
        if (encuestaActual) {
          const encuestaActualizada: Partial<Encuesta> = {
            encuestaId: encuestaActual.encuestaId,
            empresaId: empresaCreada.empresaId,
            tipoEncuesta: encuestaActual.tipoEncuesta,
            tipoEncuestaValor: encuestaActual.tipoEncuestaValor,
            fechaEncuesta: encuestaActual.fechaEncuesta
          };
          
          this.encuestasService.guardar(encuestaActualizada).subscribe({
            next: (encuestaGuardada) => {
              this.guardandoEmpresa.set(false);
              this.mostrarFormularioRegistro.set(false);
              
              // Actualizar la encuesta y la empresa seleccionada
              this.encuesta.set(encuestaGuardada);
              this.empresaSeleccionada.set(empresaCreada);
              this.terminoBusqueda.set(`${empresaCreada.razonSocial} (RUC: ${empresaCreada.ruc})`);
              
              // Resetear el formulario
              this.nuevaEmpresa.set({
                razonSocial: '',
                ruc: '',
                tipoEmpresaId: 1,
                condicionContribuyente: '',
                tamanoEmpresa: '',
                actividadEconomica: ''
              });
              
              this.mensajeModal.set('Empresa registrada y asignada correctamente');
              this.mostrarModalExito.set(true);
            },
            error: (error) => {
              console.error('Error al actualizar encuesta:', error);
              this.guardandoEmpresa.set(false);
              this.mensajeModal.set('Empresa creada, pero error al asignarla a la encuesta');
              this.mostrarModalError.set(true);
            }
          });
        } else {
          this.guardandoEmpresa.set(false);
          this.mensajeModal.set('Error: No se pudo obtener el ID de la encuesta');
          this.mostrarModalError.set(true);
        }
      },
      error: (error) => {
        console.error('Error al guardar empresa:', error);
        this.guardandoEmpresa.set(false);
        
        if (error.status === 409) {
          this.mostrarModalRucDuplicado.set(true);
        } else {
          this.mensajeModal.set('Error al guardar la empresa');
          this.mostrarModalError.set(true);
        }
      }
    });
  }

  cerrarModalRucDuplicado(): void {
    this.mostrarModalRucDuplicado.set(false);
  }

  cerrarModalExito(): void {
    this.mostrarModalExito.set(false);
  }

  cerrarModalError(): void {
    this.mostrarModalError.set(false);
  }

  cambiarEmpresa(): void {
    this.empresaSeleccionada.set(null);
    this.terminoBusqueda.set('');
  }

  // ==================== MÉTODOS DE ENCUESTADO ====================

  buscarEncuestado(): void {
    const termino = this.terminoBusquedaEncuestado().trim();
    
    if (termino.length < 1) {
      this.encuestadosEncontrados.set([]);
      this.mostrarResultadosEncuestado.set(false);
      this.mostrarFormularioRegistroEncuestado.set(false);
      return;
    }

    // Validar el término de búsqueda
    if (!this.validarEncuestadoParaBusqueda()) {
      return;
    }

    // Limpiar el formulario de registro cuando se hace una nueva búsqueda
    this.mostrarFormularioRegistroEncuestado.set(false);
    this.nuevoEncuestado = {
      nombres: '',
      apepat: '',
      apemat: '',
      numdoc: '',
      tipodoc: '',
      cargo: '',
      tipoContacto: '',
      contacto: ''
    };

    this.buscandoEncuestado.set(true);
    this.mostrarResultadosEncuestado.set(true);

    // Usar el tipo de búsqueda seleccionado y limitar a 5 resultados
    const nombres = this.tipoBusquedaEncuestado() === 'nombres' ? termino : undefined;
    const numdoc = this.tipoBusquedaEncuestado() === 'numdoc' ? termino : undefined;

    this.encuestadosService.listar(1, 5, nombres, numdoc).subscribe({
      next: (response) => {
        console.log('Respuesta del servicio de encuestados:', response);
        this.encuestadosEncontrados.set(response.data);
        this.buscandoEncuestado.set(false);
        
        // Si no hay resultados, mostrar formulario de registro directamente
        if (response.data.length === 0) {
          console.log('No hay resultados, mostrando formulario de registro');
          this.mostrarFormularioRegistroEncuestado.set(true);
          this.mostrarResultadosEncuestado.set(false);
          
          // Pre-llenar el campo según el tipo de búsqueda
          if (this.tipoBusquedaEncuestado() === 'numdoc') {
            this.nuevoEncuestado = { ...this.nuevoEncuestado, numdoc: termino };
          } else {
            this.nuevoEncuestado = { ...this.nuevoEncuestado, nombres: termino };
          }
          console.log('Estado después de setear:', {
            mostrarFormulario: this.mostrarFormularioRegistroEncuestado(),
            mostrarResultados: this.mostrarResultadosEncuestado(),
            nuevoEncuestado: this.nuevoEncuestado
          });
        }
      },
      error: (error) => {
        console.error('Error al buscar encuestados:', error);
        this.buscandoEncuestado.set(false);
        this.encuestadosEncontrados.set([]);
      }
    });
  }

  seleccionarEncuestado(encuestado: Encuestado): void {
    const encuestaActual = this.encuesta();
    if (encuestaActual) {
      // Actualizar la encuesta solo con el encuestadoId
      this.encuestasService.guardar({
        encuestaId: encuestaActual.encuestaId,
        encuestadoId: encuestado.encuestadoId
      } as Partial<Encuesta>).subscribe({
        next: (encuestaGuardada) => {
          this.encuesta.set(encuestaGuardada);
          this.encuestadoSeleccionado.set(encuestado);
          this.mostrarResultadosEncuestado.set(false);
          this.terminoBusquedaEncuestado.set('');
        },
        error: (error) => {
          console.error('Error al actualizar encuesta con encuestado:', error);
          this.mensajeModal.set('Error al asignar el encuestado a la encuesta');
          this.mostrarModalError.set(true);
        }
      });
    }
  }

  cambiarEncuestado(): void {
    this.encuestadoSeleccionado.set(null);
    this.terminoBusquedaEncuestado.set('');
  }

  validarBusquedaEncuestado(): void {
    // Limpiar el error mientras escribe
    this.errorBusquedaEncuestado.set('');
  }

  validarEncuestadoParaBusqueda(): boolean {
    const termino = this.terminoBusquedaEncuestado().trim();
    
    if (termino.length < 1) {
      this.errorBusquedaEncuestado.set('Debe ingresar un término de búsqueda');
      return false;
    }

    // Si busca por número de documento DNI, validar que tenga exactamente 8 dígitos
    if (this.tipoBusquedaEncuestado() === 'numdoc') {
      const soloNumeros = /^\d+$/.test(termino);
      if (!soloNumeros) {
        this.errorBusquedaEncuestado.set('El número de documento debe contener solo números');
        return false;
      }
      if (termino.length !== 8) {
        this.errorBusquedaEncuestado.set(`El DNI debe tener exactamente 8 dígitos (actual: ${termino.length})`);
        return false;
      }
    }

    // Si busca por nombres, validar que tenga al menos 3 caracteres y solo letras
    if (this.tipoBusquedaEncuestado() === 'nombres') {
      if (termino.length < 3) {
        this.errorBusquedaEncuestado.set('El nombre debe tener al menos 3 caracteres');
        return false;
      }
      // Validar que solo contenga letras, espacios, tildes y ñ
      const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(termino);
      if (!soloLetras) {
        this.errorBusquedaEncuestado.set('El nombre solo debe contener letras, espacios y tildes');
        return false;
      }
    }
    
    this.errorBusquedaEncuestado.set('');
    return true;
  }

  cancelarRegistroEncuestado(): void {
    this.mostrarFormularioRegistroEncuestado.set(false);
    this.errorContactoEncuestado.set('');
    this.nuevoEncuestado = {
      nombres: '',
      apepat: '',
      apemat: '',
      numdoc: '',
      tipodoc: '',
      cargo: '',
      tipoContacto: '',
      contacto: ''
    };
  }

  validarContactoEncuestado(): void {
    // Limpiar el error mientras escribe
    this.errorContactoEncuestado.set('');
  }

  obtenerPlaceholderContacto(): string {
    const tipo = this.nuevoEncuestado.tipoContacto;
    if (!tipo) return 'Seleccione primero un tipo de contacto';
    
    if (tipo === 'EMAIL') {
      return 'ejemplo@correo.com';
    } else if (tipo === 'TELEFONO' || tipo === 'CELULAR' || tipo === 'WHATSAPP') {
      return 'Ingrese número (9 dígitos)';
    }
    return 'Ingrese contacto';
  }

  validarContactoParaGuardar(): boolean {
    const contacto = this.nuevoEncuestado.contacto?.trim() || '';
    const tipo = this.nuevoEncuestado.tipoContacto;

    if (!contacto) {
      this.errorContactoEncuestado.set('El contacto es obligatorio');
      return false;
    }

    // Validar email
    if (tipo === 'EMAIL') {
      if (contacto.length > 100) {
        this.errorContactoEncuestado.set(`El correo no puede exceder 100 caracteres (actual: ${contacto.length})`);
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contacto)) {
        this.errorContactoEncuestado.set('Ingrese un correo electrónico válido');
        return false;
      }
    }

    // Validar teléfonos (deben ser exactamente 9 dígitos numéricos)
    if (tipo === 'TELEFONO' || tipo === 'CELULAR' || tipo === 'WHATSAPP') {
      const soloNumeros = /^\d+$/.test(contacto);
      if (!soloNumeros) {
        this.errorContactoEncuestado.set('El número debe contener solo dígitos');
        return false;
      }
      if (contacto.length !== 9) {
        this.errorContactoEncuestado.set(`El número debe tener exactamente 9 dígitos (actual: ${contacto.length})`);
        return false;
      }
    }

    this.errorContactoEncuestado.set('');
    return true;
  }

  guardarNuevoEncuestado(): void {
    const encuestado = this.nuevoEncuestado;
    
    // Validar que solo los campos obligatorios estén completos (nombres, apepat, cargo)
    if (!encuestado.nombres || !encuestado.apepat || !encuestado.cargo) {
      this.mensajeModal.set('Los campos Nombre, Apellido Paterno y Cargo son obligatorios');
      this.mostrarModalError.set(true);
      return;
    }

    // Validar el formato del contacto según el tipo (si se proporcionó)
    if (encuestado.tipoContacto && encuestado.contacto) {
      if (!this.validarContactoParaGuardar()) {
        return;
      }
    }

    this.guardandoEncuestado.set(true);
    
    // Crear el encuestado
    this.encuestadosService.crear(encuestado).subscribe({
      next: (encuestadoCreado) => {
        // Guardar la encuesta solo con el ID del encuestado creado
        const encuestaActual = this.encuesta();
        if (encuestaActual) {
          this.encuestasService.guardar({
            encuestaId: encuestaActual.encuestaId,
            encuestadoId: encuestadoCreado.encuestadoId
          } as Partial<Encuesta>).subscribe({
            next: (encuestaGuardada) => {
              this.guardandoEncuestado.set(false);
              this.mostrarFormularioRegistroEncuestado.set(false);
              
              // Actualizar la encuesta y el encuestado seleccionado
              this.encuesta.set(encuestaGuardada);
              this.encuestadoSeleccionado.set(encuestadoCreado);
              this.terminoBusquedaEncuestado.set('');
              
              // Resetear el formulario
              this.nuevoEncuestado = {
                nombres: '',
                apepat: '',
                apemat: '',
                numdoc: '',
                tipodoc: '',
                cargo: '',
                tipoContacto: '',
                contacto: ''
              };
              
              this.mensajeModal.set('Encuestado registrado y asignado correctamente');
              this.mostrarModalExito.set(true);
            },
            error: (error) => {
              console.error('Error al actualizar encuesta:', error);
              this.guardandoEncuestado.set(false);
              this.mensajeModal.set('Encuestado creado, pero error al asignarlo a la encuesta');
              this.mostrarModalError.set(true);
            }
          });
        } else {
          this.guardandoEncuestado.set(false);
          this.mensajeModal.set('Error: No se pudo obtener el ID de la encuesta');
          this.mostrarModalError.set(true);
        }
      },
      error: (error) => {
        console.error('Error al guardar encuestado:', error);
        this.guardandoEncuestado.set(false);
        this.mensajeModal.set('Error al guardar el encuestado');
        this.mostrarModalError.set(true);
      }
    });
  }

  // Determina si una sección está completa
  seccionCompleta(seccion: string): boolean {
    switch (seccion) {
      case 'datosGenerales':
        // Considera completa si tipoEncuesta y fechaEncuesta existen
        return !!(this.encuesta()?.tipoEncuesta && this.encuesta()?.fechaEncuesta);
      case 'empresa':
        return !!this.encuesta()?.empresaId;
      case 'encuestado':
        return !!this.encuestadoSeleccionado();
      case 'productos':
        return !!(
          (this.encuesta()?.concretoPremezclado === 1 || this.encuesta()?.articulosConcreto === 1) &&
          this.encuesta()?.tipoLugarCompra
        );
      case 'fabricante':
        return !!(
          this.encuesta()?.fabricanteId &&
          this.encuesta()?.nombreMarca &&
          this.encuesta()?.marcaFabricante
        );
      case 'compra':
        const enc = this.encuesta();
        if (!enc?.tipoCompra || !enc?.descCompra || enc?.precio == null) {
          return false;
        }
        // Validar campos específicos según el tipo de compra
        if (enc.tipoCompra === 'BOLSAS') {
          return !!enc.cantidadPresentacionCompra;
        }
        if (enc.tipoCompra === 'GRANEL') {
          return !!(enc.presentacionCompra && enc.cantidadPresentacionCompra);
        }
        return true;
      case 'uso':
        return !!(
          this.encuesta()?.usoCemento &&
          this.encuesta()?.motivoCompra &&
          this.encuesta()?.deseoRegalo != null
        );
      default:
        return false;
    }
  }

  // Determina si todas las secciones están completas
  todasLasSeccionesCompletas(): boolean {
    const secciones = ['datosGenerales', 'empresa', 'encuestado', 'productos', 'fabricante', 'compra', 'uso'];
    return secciones.every(seccion => this.seccionCompleta(seccion));
  }

  completarEncuesta(): void {
    const encuestaActual = this.encuesta();
    if (!encuestaActual || !encuestaActual.encuestaId) {
      this.mensajeModal.set('No hay datos de encuesta para completar');
      this.mostrarModalError.set(true);
      return;
    }

    // Validar que todas las secciones estén completas
    if (!this.todasLasSeccionesCompletas()) {
      this.mensajeModal.set('Debe completar todas las secciones antes de finalizar la encuesta');
      this.mostrarModalError.set(true);
      return;
    }

    // Cambiar estado a 3 (Transferido) usando el nuevo endpoint
    this.encuestasService.cambiarEstado(encuestaActual.encuestaId, 3).subscribe({
      next: (encuestaActualizada) => {
        // Si viene marcaFabricanteInfo, extraer los campos para mostrarlos
        if (encuestaActualizada.marcaFabricanteInfo) {
          encuestaActualizada.nombreMarca = encuestaActualizada.marcaFabricanteInfo.nombreMarca || undefined;
          encuestaActualizada.tipoCemento = encuestaActualizada.marcaFabricanteInfo.tipoCemento;
          encuestaActualizada.descFisica = encuestaActualizada.marcaFabricanteInfo.descFisica || undefined;
        }
        
        this.encuesta.set(encuestaActualizada);
        this.mensajeModal.set('Encuesta completada y transferida exitosamente');
        this.mostrarModalExito.set(true);
        // Redirigir al listado después de 1 segundo
        setTimeout(() => {
          this.router.navigate(['/encuestas']);
        }, 1000);
      },
      error: (error) => {
        console.error('Error al completar encuesta:', error);
        this.mensajeModal.set('Error al completar la encuesta. Por favor, intente nuevamente.');
        this.mostrarModalError.set(true);
      }
    });
  }
}
