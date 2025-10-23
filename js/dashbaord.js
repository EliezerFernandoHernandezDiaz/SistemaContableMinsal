// ============================================
// MOSTRAR DASHBOARD
// ============================================
function mostrarDashboard() {
    console.log('📊 Generando dashboard...');
    
    // Calcular métricas
    const totalMedicamentos = hojas.catalogo.length;
    const totalLotes = hojas.inventario.length;
    const totalCompras = hojas.compras.length;
    const totalSalidas = hojas.salidas.length;
    const valorTotal = calcularValorInventario();
    
    // Generar HTML de métricas
    const html = `
        <div class="metrica">
            <h4>Valor Total Inventario</h4>
            <p class="valor">$${valorTotal.toLocaleString('es-SV', {minimumFractionDigits: 2})}</p>
        </div>
        <div class="metrica">
            <h4>Total Medicamentos</h4>
            <p class="valor">${totalMedicamentos}</p>
        </div>
        <div class="metrica">
            <h4>Total Lotes Activos</h4>
            <p class="valor">${totalLotes}</p>
        </div>
        <div class="metrica">
            <h4>Compras Registradas</h4>
            <p class="valor">${totalCompras}</p>
        </div>
    `;
    
    document.getElementById('metricas').innerHTML = html;
    
    console.log('✅ Dashboard generado');
    console.log('  - Valor total: $' + valorTotal.toFixed(2));
}

// ============================================
// CALCULAR VALOR DEL INVENTARIO
// ============================================
function calcularValorInventario() {
    return hojas.inventario.reduce((total, lote) => {
        const cantidad = lote.Cant_Actual || 0;
        const costo = lote.Costo_Unit || 0;
        return total + (cantidad * costo);
    }, 0);
}

// ============================================
// VERIFICAR ALERTAS
// ============================================
function verificarAlertas() {
    console.log('🔍 Verificando alertas...');
    
    const alertas = [];
    
    // 1. ALERTAS DE STOCK BAJO
    hojas.catalogo.forEach(med => {
        // Calcular stock total del medicamento
        const stockTotal = hojas.inventario
            .filter(lote => lote.Código_Med === med.Código)
            .reduce((sum, lote) => sum + (lote.Cant_Actual || 0), 0);
        
        // Comparar con stock mínimo
        if (stockTotal < med.Stock_Min) {
            alertas.push({
                tipo: 'critico',
                mensaje: `🔴 ${med.Nombre} - Stock crítico: ${stockTotal} unidades (Mínimo: ${med.Stock_Min})`
            });
        }
    });
    
    // 2. ALERTAS DE PRÓXIMOS A VENCER
    const hoy = new Date();
    hojas.inventario.forEach(lote => {
        if (!lote.Fecha_Venc || lote.Cant_Actual === 0) return;
        
        const fechaVenc = new Date(lote.Fecha_Venc);
        const diasRestantes = Math.floor((fechaVenc - hoy) / (1000 * 60 * 60 * 24));
        
        // Alertar si vence en 30 días o menos
        if (diasRestantes <= 30 && diasRestantes > 0) {
            alertas.push({
                tipo: 'advertencia',
                mensaje: `🟡 ${lote.Nombre_Med} - Lote ${lote.Num_Lote} vence en ${diasRestantes} días (${formatearFecha(lote.Fecha_Venc)})`
            });
        }
        
        // Alertar si ya venció
        if (diasRestantes <= 0) {
            alertas.push({
                tipo: 'critico',
                mensaje: `🔴 ${lote.Nombre_Med} - Lote ${lote.Num_Lote} YA VENCIÓ (${formatearFecha(lote.Fecha_Venc)})`
            });
        }
    });
    
    console.log('  - Alertas encontradas:', alertas.length);
    
    // Mostrar alertas en HTML
    mostrarAlertasHTML(alertas);
}

// ============================================
// MOSTRAR ALERTAS EN HTML
// ============================================
function mostrarAlertasHTML(alertas) {
    let html = '';
    
    if (alertas.length === 0) {
        html = '<div class="alerta-ok">✅ No hay alertas críticas. Todo bajo control.</div>';
    } else {
        // Ordenar: críticos primero, luego advertencias
        alertas.sort((a, b) => {
            if (a.tipo === 'critico' && b.tipo !== 'critico') return -1;
            if (a.tipo !== 'critico' && b.tipo === 'critico') return 1;
            return 0;
        });
        
        alertas.forEach(alerta => {
            const clase = alerta.tipo === 'critico' ? 'alerta-roja' : 'alerta-amarilla';
            html += `<div class="${clase}">${alerta.mensaje}</div>`;
        });
    }
    
    document.getElementById('listaAlertas').innerHTML = html;
}

// ============================================
// VER CATÁLOGO COMPLETO
// ============================================
function verCatalogo() {
    console.log('📋 Mostrando catálogo...');
    
    let html = '<h2>📋 Catálogo de Medicamentos</h2>';
    html += '<table>';
    html += '<thead><tr>';
    html += '<th>Código</th>';
    html += '<th>Nombre</th>';
    html += '<th>Presentación</th>';
    html += '<th>Concentración</th>';
    html += '<th>Precio Unit.</th>';
    html += '<th>Clase ABC</th>';
    html += '<th>Stock Min</th>';
    html += '<th>Stock Max</th>';
    html += '<th>Stock Actual</th>';
    html += '</tr></thead><tbody>';
    
    hojas.catalogo.forEach(med => {
        // Calcular stock actual
        const stockActual = hojas.inventario
            .filter(lote => lote.Código_Med === med.Código)
            .reduce((sum, lote) => sum + (lote.Cant_Actual || 0), 0);
        
        // Badge de clase ABC
        const badgeClase = `<span class="badge badge-${med.Clase_ABC.toLowerCase()}">${med.Clase_ABC}</span>`;
        
        // Color si stock bajo
        const esStockBajo = stockActual < med.Stock_Min;
        const colorStock = esStockBajo ? 'style="color: red; font-weight: bold;"' : '';
        
        html += '<tr>';
        html += `<td>${med.Código}</td>`;
        html += `<td><strong>${med.Nombre}</strong></td>`;
        html += `<td>${med.Presentacion || ''}</td>`;
        html += `<td>${med.Concentración || ''}</td>`;
        html += `<td>$${(med.Precio_Unit || 0).toFixed(2)}</td>`;
        html += `<td>${badgeClase}</td>`;
        html += `<td>${med.Stock_Min}</td>`;
        html += `<td>${med.Stock_Max}</td>`;
        html += `<td ${colorStock}>${stockActual}</td>`;
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    
    document.getElementById('contenidoDinamico').innerHTML = html;
}

// ============================================
// VER INVENTARIO POR LOTES
// ============================================
function verInventario() {
    console.log('📦 Mostrando inventario por lotes...');
    
    let html = '<h2>📦 Inventario por Lotes</h2>';
    html += '<table>';
    html += '<thead><tr>';
    html += '<th>ID Lote</th>';
    html += '<th>Código</th>';
    html += '<th>Medicamento</th>';
    html += '<th>N° Lote</th>';
    html += '<th>Cant. Inicial</th>';
    html += '<th>Cant. Actual</th>';
    html += '<th>Fecha Fab.</th>';
    html += '<th>Fecha Venc.</th>';
    html += '<th>Costo Unit.</th>';
    html += '<th>Estado</th>';
    html += '</tr></thead><tbody>';
    
    hojas.inventario.forEach(lote => {
        // Determinar estado
        let estado = '';
        let badgeClass = '';
        
        if (lote.Cant_Actual === 0) {
            estado = 'Agotado';
            badgeClass = 'badge-agotado';
        } else {
            const hoy = new Date();
            const fechaVenc = new Date(lote.Fecha_Venc);
            const dias = Math.floor((fechaVenc - hoy) / (1000 * 60 * 60 * 24));
            
            if (dias <= 30) {
                estado = 'Por Vencer';
                badgeClass = 'badge-vencer';
            } else {
                estado = 'Activo';
                badgeClass = 'badge-activo';
            }
        }
        
        html += '<tr>';
        html += `<td>${lote.ID_Lote}</td>`;
        html += `<td>${lote.Código_Med}</td>`;
        html += `<td><strong>${lote.Nombre_Med || ''}</strong></td>`;
        html += `<td>${lote.Num_Lote}</td>`;
        html += `<td>${lote.Cant_Inicial || 0}</td>`;
        html += `<td><strong>${lote.Cant_Actual || 0}</strong></td>`;
        html += `<td>${formatearFecha(lote.Fecha_Fab)}</td>`;
        html += `<td>${formatearFecha(lote.Fecha_Venc)}</td>`;
        html += `<td>$${(lote.Costo_Unit || 0).toFixed(2)}</td>`;
        html += `<td><span class="badge ${badgeClass}">${estado}</span></td>`;
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    
    document.getElementById('contenidoDinamico').innerHTML = html;
}

// ============================================
// VER LIBRO DIARIO
// ============================================
function verLibroDiario() {
    console.log('📖 Mostrando Libro Diario...');
    
    let html = '<h2>📖 Libro Diario</h2>';
    
    if (hojas.diario.length === 0) {
        html += '<p>No hay asientos registrados aún.</p>';
    } else {
        html += '<table>';
        html += '<thead><tr>';
        html += '<th>Fecha</th>';
        html += '<th>N° Asiento</th>';
        html += '<th>Descripción</th>';
        html += '<th>Cuenta</th>';
        html += '<th>Debe</th>';
        html += '<th>Haber</th>';
        html += '</tr></thead><tbody>';
        
        hojas.diario.forEach(asiento => {
            html += '<tr>';
            html += `<td>${formatearFecha(asiento.Fecha)}</td>`;
            html += `<td>${asiento.Num_Asiento || ''}</td>`;
            html += `<td>${asiento.Descripción || ''}</td>`;
            html += `<td>${asiento.Cuenta || ''}</td>`;
            html += `<td>${asiento.Debe > 0 ? '$' + asiento.Debe.toFixed(2) : ''}</td>`;
            html += `<td>${asiento.Haber > 0 ? '$' + asiento.Haber.toFixed(2) : ''}</td>`;
            html += '</tr>';
        });
        
        html += '</tbody></table>';
    }
    
    document.getElementById('contenidoDinamico').innerHTML = html;
}

// Funciones placeholder (se programarán después)
function mostrarFormularioCompra() {
    alert('⚠️ Módulo de compras en desarrollo...\nPróximamente podrás registrar compras desde aquí.');
}

function mostrarFormularioSalida() {
    alert('⚠️ Módulo de salidas en desarrollo...\nPróximamente podrás registrar salidas con PEPS automático.');
}