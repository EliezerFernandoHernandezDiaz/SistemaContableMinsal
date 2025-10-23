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
// FUNCIÓN PRINCIPAL: CARGAR EXCEL
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
            workbook = XLSX.read(data, {type: 'array'});
            
            console.log('📊 Hojas encontradas:', workbook.SheetNames);
            
            // Leer cada hoja y convertir a JSON
            hojas.catalogo = XLSX.utils.sheet_to_json(workbook.Sheets['Catálogo']);
            hojas.inventario = XLSX.utils.sheet_to_json(workbook.Sheets['Inventario_Lotes']);
            hojas.compras = XLSX.utils.sheet_to_json(workbook.Sheets['Libro_Compras']);
            hojas.salidas = XLSX.utils.sheet_to_json(workbook.Sheets['Libro_Salidas']);
            hojas.diario = XLSX.utils.sheet_to_json(workbook.Sheets['Libro_Diario']);
            hojas.mayor = XLSX.utils.sheet_to_json(workbook.Sheets['Libro_Mayor']);
            
            console.log('✅ Datos cargados:');
            console.log('  - Catálogo:', hojas.catalogo.length, 'medicamentos');
            console.log('  - Inventario:', hojas.inventario.length, 'lotes');
            console.log('  - Compras:', hojas.compras.length, 'registros');
            console.log('  - Salidas:', hojas.salidas.length, 'registros');
            
            // Ocultar sección de carga y mostrar dashboard
            document.getElementById('uploadSection').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            
            // Inicializar dashboard
            mostrarDashboard();
            verificarAlertas();
            
            alert('✅ Excel cargado correctamente\n' + 
                  hojas.catalogo.length + ' medicamentos\n' +
                  hojas.inventario.length + ' lotes');
            
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

function formatearFecha(fecha) {
    if (!fecha) return '';
    const d = new Date(fecha);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const anio = d.getFullYear();
    return `${dia}/${mes}/${anio}`;
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
}