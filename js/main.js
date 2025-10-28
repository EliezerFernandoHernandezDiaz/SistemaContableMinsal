// ============================================
// VARIABLES GLOBALES
// ============================================
let workbook = null;
let hojas = {
    catalogo: [],
    inventario: [],
    compras: [],
    salidas: [],
    diario: [],
    mayor: []
};

// ============================================
// FUNCIÓN PARA CONVERTIR FECHAS DE EXCEL
// ============================================
// ============================================
// FUNCIÓN MEJORADA PARA PROCESAR FECHAS (VERSIÓN DEFINITIVA)
// ============================================
function procesarFecha(fecha) {
    // Si es null, undefined o vacío
    if (fecha === null || fecha === undefined || fecha === '' || fecha === 'null') {
        return null;
    }
    
    // Si ya es una cadena con formato dd/mm/yyyy o dd/mm/yy
    if (typeof fecha === 'string') {
        // Formato dd/mm/yyyy o dd/mm/yy
        if (fecha.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/)) {
            return fecha;
        }
        
        // Formato yyyy-mm-dd (ISO)
        if (fecha.match(/^\d{4}-\d{2}-\d{2}/)) {
            const partes = fecha.split('-');
            return `${partes[2].substring(0,2)}/${partes[1]}/${partes[0]}`;
        }
        
        // Formato dd-mm-yyyy
        if (fecha.match(/^\d{1,2}-\d{1,2}-\d{4}$/)) {
            const partes = fecha.split('-');
            return `${partes[0]}/${partes[1]}/${partes[2]}`;
        }
    }
    
    // Si es un objeto Date
    if (fecha instanceof Date && !isNaN(fecha.getTime())) {
        const dia = String(fecha.getDate()).padStart(2, '0');
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const anio = fecha.getFullYear();
        return `${dia}/${mes}/${anio}`;
    }
    
    // Si es un número serial de Excel (44927 = alguna fecha)
    if (typeof fecha === 'number' && fecha > 0) {
        try {
            // Fórmula de conversión de Excel serial date
            const excelEpoch = new Date(1899, 11, 30);
            const dias = Math.floor(fecha);
            const fechaConvertida = new Date(excelEpoch.getTime() + dias * 86400000);
            
            const dia = String(fechaConvertida.getDate()).padStart(2, '0');
            const mes = String(fechaConvertida.getMonth() + 1).padStart(2, '0');
            const anio = fechaConvertida.getFullYear();
            return `${dia}/${mes}/${anio}`;
        } catch (e) {
            console.warn('Error convirtiendo número serial:', fecha, e);
        }
    }
    
    // Último intento: intentar parsear como Date
    try {
        const d = new Date(fecha);
        if (!isNaN(d.getTime())) {
            const dia = String(d.getUTCDate()).padStart(2, '0');
            const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
            const anio = d.getUTCFullYear();
            return `${dia}/${mes}/${anio}`;
        }
    } catch (e) {
        console.warn('No se pudo procesar la fecha:', fecha);
    }
    
    return null;
}

// ============================================
// 🔧 FUNCIÓN DE NORMALIZACIÓN FINAL DE FECHAS EN INVENTARIO
// ============================================
function normalizarFechasInventario() {
    hojas.inventario = hojas.inventario.map(lote => {
        const nuevo = { ...lote };

        // Detectar columnas de fecha con distintos nombres
        for (const clave in lote) {
            const key = clave.toLowerCase().replace(/\s/g, '');

            if (key.includes('fab')) {
                nuevo[clave] = procesarFecha(lote[clave]);
            }
            if (key.includes('venc')) {
                nuevo[clave] = procesarFecha(lote[clave]);
            }
        }

        return nuevo;
    });

    console.log("🧹 Fechas normalizadas en Inventario:", hojas.inventario.slice(0, 3));
}


// ============================================
// FUNCIÓN PARA LIMPIAR NOMBRES DE COLUMNAS
// ============================================
function limpiarObjeto(obj) {
    const nuevoObj = {};
    for (let key in obj) {
        // Eliminar espacios al inicio y final del nombre de columna
        const nuevoKey = key.trim();
        nuevoObj[nuevoKey] = obj[key];
    }
    return nuevoObj;
}
// Limpia espacios invisibles, NBSP, etc.
function _cleanText(v) {
  if (v == null) return v;
  return String(v).replace(/\u00A0/g, ' ').trim();
}

// Canoniza nombres de columnas: sin acentos/espacios, minúsculas
function _canonKey(k) {
  return _cleanText(k)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // sin acentos
    .replace(/[^a-zA-Z0-9]/g, '')                    // quita símbolos
    .toLowerCase();
}

// Mapea nombres “parecidos” a los oficiales
function normalizarClavesFila(row) {
  const map = {
    // inventario
    idlote: 'ID_Lote',
    id_lote: 'ID_Lote',
    codigomed: 'Código_Med',
    codigo_med: 'Código_Med',
    nombremed: 'Nombre_Med',
    nombre_med: 'Nombre_Med',
    numlote: 'Num_Lote',
    num_lote: 'Num_Lote',
    cantinicial: 'Cant_Inicial',
    cant_inicial: 'Cant_Inicial',
    cantactual: 'Cant_Actual',
    cant_actual: 'Cant_Actual',
    fechafab: 'Fecha_Fab',
    fechafabricacion: 'Fecha_Fab',
    fecha_fab: 'Fecha_Fab',
    fechavenc: 'Fecha_Venc',
    fechavencimiento: 'Fecha_Venc',
    fecha_venc: 'Fecha_Venc',
    costounit: 'Costo_Unit',
    costo_unit: 'Costo_Unit',

    // catálogo
    presentacion: 'Presentación',
    presentaci\u00F3n: 'Presentación',
    precio_unit: 'Precio_Unit',
    precioUnit: 'Precio_Unit',
    claseabc: 'Clase_ABC',
    stockmin: 'Stock_Min',
    stockmax: 'Stock_Max',
    stockactual: 'Stock_Actual'
  };

  const out = {};
  for (const k in row) {
    const ck = _canonKey(k);
    const target = map[ck] || k.trim();
    out[target] = row[k];
  }
  return out;
}

// Conversión de fecha (string/número/Date) a dd/mm/yyyy o null
function procesarFecha(valor) {
  if (valor == null || valor === '' || valor === 'null') return null;

  // número serial Excel
  if (typeof valor === 'number' && isFinite(valor)) {
    const base = new Date(1899, 11, 30);
    const d = new Date(base.getTime() + Math.floor(valor) * 86400000);
    const dd = String(d.getDate()).padStart(2,'0');
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const yy = d.getFullYear();
    return `${dd}/${mm}/${yy}`;
  }

  // texto: limpia y reconoce formatos comunes
  if (typeof valor === 'string') {
    const v = _cleanText(valor);

    // dd/mm/yyyy  ó  d/m/yyyy
    if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(v)) return v;

    // yyyy-mm-dd (ISO)
    if (/^\d{4}-\d{2}-\d{2}/.test(v)) {
      const [y,m,d] = v.split('-');
      return `${d.substring(0,2)}/${m}/${y}`;
    }

    // dd-mm-yyyy
    if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(v)) {
      const [d,m,y] = v.split('-');
      return `${d}/${m}/${y}`;
    }

    // último intento: Date.parse
    const tryD = new Date(v);
    if (!Number.isNaN(tryD.getTime())) {
      const dd = String(tryD.getDate()).padStart(2,'0');
      const mm = String(tryD.getMonth()+1).padStart(2,'0');
      const yy = tryD.getFullYear();
      return `${dd}/${mm}/${yy}`;
    }
  }

  // objeto Date
  if (valor instanceof Date && !Number.isNaN(valor.getTime())) {
    const dd = String(valor.getDate()).padStart(2,'0');
    const mm = String(valor.getMonth()+1).padStart(2,'0');
    const yy = valor.getFullYear();
    return `${dd}/${mm}/${yy}`;
  }

  return null;
}


// ============================================
// FUNCIÓN PRINCIPAL: CARGAR EXCEL (VERSIÓN FINAL)
// ============================================
function cargarArchivo() {
    const input = document.getElementById('fileInput');
    const file = input.files[0];
    
    if (!file) {
        alert('⚠️ Por favor selecciona un archivo Excel');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            console.log('📂 Leyendo archivo...');
            
            const data = new Uint8Array(e.target.result);
            
            // LEER el workbook SIN procesar fechas aún
            workbook = XLSX.read(data, {
                type: 'array',
                cellDates: false,  // NO convertir automáticamente
                cellNF: false,
                cellText: false
            });
            
            console.log('📊 Hojas encontradas:', workbook.SheetNames);
            
            // Leer cada hoja SIN formateo automático
            hojas.catalogo = XLSX.utils.sheet_to_json(workbook.Sheets['Catálogo'], {
                raw: true,  // Obtener valores crudos
                defval: null
            });
            
            hojas.inventario = XLSX.utils.sheet_to_json(workbook.Sheets['Inventario_Lotes'], {
                raw: true,
                defval: null
            });
            
            hojas.compras = XLSX.utils.sheet_to_json(workbook.Sheets['Libro_Compras'], {
                raw: true,
                defval: null
            });
            
            hojas.salidas = XLSX.utils.sheet_to_json(workbook.Sheets['Libro_Salidas'], {
                raw: true,
                defval: null
            });
            
            hojas.diario = XLSX.utils.sheet_to_json(workbook.Sheets['Libro_Diario'], {
                raw: true,
                defval: null
            });
            
            hojas.mayor = XLSX.utils.sheet_to_json(workbook.Sheets['Libro_Mayor'], {
                raw: true,
                defval: null
            });
            
            // LIMPIAR nombres de columnas
            hojas.catalogo = hojas.catalogo.map(limpiarObjeto);
            hojas.inventario = hojas.inventario.map(limpiarObjeto);
            hojas.compras = hojas.compras.map(limpiarObjeto);
            hojas.salidas = hojas.salidas.map(limpiarObjeto);
            hojas.diario = hojas.diario.map(limpiarObjeto);
            hojas.mayor = hojas.mayor.map(limpiarObjeto);
            
            console.log('🔍 Debug - Primer lote ANTES de procesar fechas:', hojas.inventario[0]);
            
            // PROCESAR fechas manualmente
            hojas.inventario = hojas.inventario.map(lote => ({
                ...lote,
                Fecha_Fab: procesarFecha(lote.Fecha_Fab),
                Fecha_Venc: procesarFecha(lote.Fecha_Venc)
            }));
            
            hojas.compras = hojas.compras.map(compra => ({
                ...compra,
                Fecha: procesarFecha(compra.Fecha)
            }));
            
            hojas.salidas = hojas.salidas.map(salida => ({
                ...salida,
                Fecha: procesarFecha(salida.Fecha)
            }));
            
            hojas.diario = hojas.diario.map(asiento => ({
                ...asiento,
                Fecha: procesarFecha(asiento.Fecha)
            }));
            // ============================================
            // Normalizar claves y convertir fechas después de leer las hojas
            // ============================================

            // 1️⃣ Normalizar claves de cada fila
            hojas.catalogo   = hojas.catalogo.map(normalizarClavesFila);
            hojas.inventario = hojas.inventario.map(normalizarClavesFila);
            hojas.compras    = hojas.compras.map(normalizarClavesFila);
            hojas.salidas    = hojas.salidas.map(normalizarClavesFila);
            hojas.diario     = hojas.diario.map(normalizarClavesFila);
            hojas.mayor      = hojas.mayor.map(normalizarClavesFila);

            // 2️⃣ Normalizar / convertir fechas
            hojas.inventario = hojas.inventario.map(l => ({
                ...l,
                Fecha_Fab:  procesarFecha(l.Fecha_Fab),
                Fecha_Venc: procesarFecha(l.Fecha_Venc)
            }));

            hojas.compras = hojas.compras.map(r => ({
                ...r,
                Fecha: procesarFecha(r.Fecha)
            }));

            hojas.salidas = hojas.salidas.map(r => ({
                ...r,
                Fecha: procesarFecha(r.Fecha)
            }));

            hojas.diario = hojas.diario.map(r => ({
                ...r,
                Fecha: procesarFecha(r.Fecha)
            }));

            // Debug para verificar fechas cargadas correctamente
            console.log('🧹 Fechas normalizadas en Inventario:',
                hojas.inventario
                    .filter(x => x.Fecha_Fab || x.Fecha_Venc)
                    .map(x => ({
                        ID_Lote: x.ID_Lote,
                        Fab: x.Fecha_Fab,
                        Venc: x.Fecha_Venc
                    }))
            );

            console.log('✅ Datos cargados y procesados:');
            console.log('  - Catálogo:', hojas.catalogo.length, 'medicamentos');
            console.log('  - Inventario:', hojas.inventario.length, 'lotes');
            console.log('  - Compras:', hojas.compras.length, 'registros');
            console.log('  - Salidas:', hojas.salidas.length, 'registros');
            
            // Debug: Ver primer lote DESPUÉS de procesar
            console.log('✅ Primer lote DESPUÉS de procesar fechas:', hojas.inventario[0]);
            
            // Debug: Ver lotes con fechas null
            const lotesConProblema = hojas.inventario.filter(l => !l.Fecha_Venc).length;
            if (lotesConProblema > 0) {
                console.warn(`⚠️ ${lotesConProblema} lotes sin fecha de vencimiento`);
            }
            
            // ⭐ RECALCULAR TODO
            recalcAll();
            actualizarLibroMayor();
            
            // Ocultar sección de carga y mostrar dashboard
            document.getElementById('uploadSection').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            
            // Inicializar dashboard
            mostrarDashboard();
            verificarAlertas();
            
            alert('✅ Excel cargado correctamente\n' + 
                  hojas.catalogo.length + ' medicamentos\n' +
                  hojas.inventario.length + ' lotes' +
                  (lotesConProblema > 0 ? `\n\n⚠️ ${lotesConProblema} lotes sin fecha` : ''));
            
        } catch (error) {
            console.error('❌ Error al cargar Excel:', error);
            alert('❌ Error al cargar el archivo.\n\n' + 
                  'Verifica que:\n' +
                  '- Sea un archivo Excel (.xlsx)\n' +
                  '- Tenga todas las hojas requeridas\n' +
                  '- No esté corrupto\n\n' +
                  'Error: ' + error.message);
        }
    };
    
    reader.readAsArrayBuffer(file);
}
// ============================================
// FUNCIONES AUXILIARES
// ============================================

function generarIDLote() {
    if (hojas.inventario.length === 0) return 'L001';
    const ultimoID = hojas.inventario[hojas.inventario.length - 1].ID_Lote;
    const numero = parseInt(ultimoID.substring(1)) + 1;
    return 'L' + numero.toString().padStart(3, '0');
}

function obtenerUltimoAsiento() {
    if (hojas.diario.length === 0) return 0;
    return Math.max(...hojas.diario.map(a => a.Num_Asiento || 0));
}

function buscarMedicamento(codigo) {
    return hojas.catalogo.find(m => m.Código === codigo);
}

function formatearFecha(v) {
  if (!v) return '—';
  // ya vienen como dd/mm/yyyy; si viniera "d/m/yyyy", pad
  const m = String(v).match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!m) return _cleanText(v); // no romper
  const dd = m[1].padStart(2,'0');
  const mm = m[2].padStart(2,'0');
  let yy = m[3];
  if (yy.length === 2) yy = (yy > '50' ? '19':'20') + yy;
  return `${dd}/${mm}/${yy}`;
}


// ============================================
// GUARDAR EXCEL ACTUALIZADO
// ============================================
function guardarExcel() {
    try {
        console.log('💾 Guardando cambios...');
        
        // Convertir JSON de vuelta a hojas de Excel
        const ws1 = XLSX.utils.json_to_sheet(hojas.catalogo);
        const ws2 = XLSX.utils.json_to_sheet(hojas.inventario);
        const ws3 = XLSX.utils.json_to_sheet(hojas.compras);
        const ws4 = XLSX.utils.json_to_sheet(hojas.salidas);
        const ws5 = XLSX.utils.json_to_sheet(hojas.diario);
        const ws6 = XLSX.utils.json_to_sheet(hojas.mayor);
        
        // Crear nuevo workbook
        const nuevoWorkbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(nuevoWorkbook, ws1, 'Catálogo');
        XLSX.utils.book_append_sheet(nuevoWorkbook, ws2, 'Inventario_Lotes');
        XLSX.utils.book_append_sheet(nuevoWorkbook, ws3, 'Libro_Compras');
        XLSX.utils.book_append_sheet(nuevoWorkbook, ws4, 'Libro_Salidas');
        XLSX.utils.book_append_sheet(nuevoWorkbook, ws5, 'Libro_Diario');
        XLSX.utils.book_append_sheet(nuevoWorkbook, ws6, 'Libro_Mayor');
        
        // Generar archivo con fecha
        const fecha = new Date().toISOString().slice(0,10);
        const nombreArchivo = `inventario_minsal_${fecha}.xlsx`;
        
        XLSX.writeFile(nuevoWorkbook, nombreArchivo);
        
        console.log('✅ Excel guardado:', nombreArchivo);
        alert('✅ Excel guardado correctamente como:\n' + nombreArchivo);
        
    } catch (error) {
        console.error('❌ Error al guardar:', error);
        alert('❌ Error al guardar el archivo:\n' + error.message);
    }

    //Se llama a la función del motor contable 
    recalcAll();//recalcula todo antes de guardar 
    mostrarDashboard(); //muestra el dashboard actualizado
}


// ============================================
// MÓDULO DE RECÁLCULOS AUTOMÁTICOS
// ============================================

// 1️⃣ Recalcular Stock_Actual del Catálogo
function recalcCatalogo() {
    const stockPorMedicamento = {};

    // Sumar existencias por Código_Med en Inventario_Lotes
    hojas.inventario.forEach(lote => {
        const codigo = lote.Código_Med;
        const cantidad = parseFloat(lote.Cant_Actual || 0);
        if (!stockPorMedicamento[codigo]) stockPorMedicamento[codigo] = 0;
        stockPorMedicamento[codigo] += cantidad;
    });

    // Actualizar Stock_Actual en Catálogo
    hojas.catalogo = hojas.catalogo.map(med => ({
        ...med,
        Stock_Actual: stockPorMedicamento[med.Código] || 0
    }));

    console.log("✅ Stock recalculado correctamente.");
}

// 2️⃣ Recalcular Estado de cada lote
function recalcEstadoLote() {
    const hoy = new Date();

    hojas.inventario = hojas.inventario.map(lote => {
        const cant = parseFloat(lote.Cant_Actual || 0);
        let estado = "✅ Activo";

        // Si está agotado
        if (cant <= 0) estado = "❌ Agotado";

        // Validar vencimiento
        if (lote.Fecha_Venc) {
            try {
                const [d, m, a] = lote.Fecha_Venc.split("/");
                const fechaVenc = new Date(`${a}-${m}-${d}`);
                const diff = (fechaVenc - hoy) / (1000 * 60 * 60 * 24);

                if (diff <= 0) estado = "⛔ Vencido";
                else if (diff <= 30 && cant > 0) estado = "⚠️ Por Vencer";
            } catch {
                console.warn("⚠️ Fecha inválida en lote:", lote.Num_Lote);
            }
        }

        return { ...lote, Estado: estado };
    });

    console.log("✅ Estados de lotes actualizados.");
}

// 3️⃣ Función general
function recalcAll() {
    recalcEstadoLote();
    recalcCatalogo();
    console.log("✅ Recalculo completo realizado.");
}

// 4️⃣ Actualizar Libro Mayor
function actualizarLibroMayor() {
    console.log('📘 Actualizando Libro Mayor automáticamente...');

    // 1️⃣ Agrupar movimientos del Libro Diario por cuenta
    const cuentas = {};

    hojas.diario.forEach(asiento => {
        const cuenta = asiento.Cuenta || 'Sin especificar';
        if (!cuentas[cuenta]) {
            cuentas[cuenta] = {
                totalDebe: 0,
                totalHaber: 0,
                movimientos: []
            };
        }

        cuentas[cuenta].movimientos.push(asiento);
        cuentas[cuenta].totalDebe += parseFloat(asiento.Debe || 0);
        cuentas[cuenta].totalHaber += parseFloat(asiento.Haber || 0);
    });

    // 2️⃣ Limpiar Libro Mayor anterior
    hojas.mayor = [];

    // 3️⃣ Registrar nuevas cuentas con sus saldos
    Object.keys(cuentas).forEach(nombreCuenta => {
        const cuenta = cuentas[nombreCuenta];
        const saldoFinal = cuenta.totalDebe - cuenta.totalHaber;

        hojas.mayor.push({
            Cuenta: nombreCuenta,
            Total_Debe: cuenta.totalDebe.toFixed(2),
            Total_Haber: cuenta.totalHaber.toFixed(2),
            Saldo_Final: saldoFinal.toFixed(2),
            Estado: saldoFinal === 0 ? '✔️ Balanceado' : 
                    saldoFinal > 0 ? '📈 Deudor' : '📉 Acreedor'
        });
    });

    console.log('✅ Libro Mayor actualizado:', hojas.mayor.length, 'cuentas procesadas');
}