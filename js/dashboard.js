// ============================================
// FUNCIÓN CENTRAL: CALCULAR STOCK REAL DE UN LOTE
// ============================================
// Esta función calcula el stock disponible restando las salidas de las compras
function calcularStockRealLote(numLote, codigoMed) {
    // 1. Buscar la compra original (cantidad inicial)
    const compra = hojas.compras.find(c => 
        c.Num_Lote === numLote && c.Código_Med === codigoMed
    );
    
    if (!compra) {
        console.warn(`⚠️ No se encontró compra para lote ${numLote}`);
        return 0;
    }
    
    const cantidadComprada = compra.Cantidad || 0;
    
    // 2. Calcular total de salidas de ese lote específico
    const totalSalidas = hojas.salidas
        .filter(s => s.Num_Lote === numLote && s.Código_Med === codigoMed)
        .reduce((sum, s) => sum + (s.Cantidad_Despachada || 0), 0);
    
    // 3. Stock real = Comprado - Despachado
    const stockReal = cantidadComprada - totalSalidas;
    
    return Math.max(0, stockReal); // No puede ser negativo
}


///Función auxiliar para manejar los valores con separación de miles y decimales
function formatearNumero(numero) {
    if (numero === null || numero === undefined || numero === '' || isNaN(numero)) {
        return '0';
    }
    return Number(numero).toLocaleString('en-US'); // Usa comas para miles
}


// ============================================
// FUNCIÓN AUXILIAR: FORMATEAR DINERO
// ============================================
function formatearDinero(monto) {
    if (monto === null || monto === undefined || monto === '' || isNaN(monto)) {
        return '$0.00';
    }
    return '$' + Number(monto).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

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
            <p class="valor">${formatearDinero(valorTotal)}</p>
        </div>
        <div class="metrica">
            <h4>Total Medicamentos</h4>
            <p class="valor">${formatearNumero(totalMedicamentos)}</p>
        </div>
        <div class="metrica">
            <h4>Total Lotes Activos</h4>
           <p class="valor">${formatearNumero(totalLotes)}</p>
        </div>
        <div class="metrica">
            <h4>Compras Registradas</h4>
           <p class="valor">${formatearNumero(totalCompras)}</p>
        </div>
    `;
    
    document.getElementById('metricas').innerHTML = html;
    
    console.log('✅ Dashboard generado');
    console.log('  - Valor total: $' + valorTotal.toFixed(2));
}


// ============================================
// FUNCIÓN MEJORADA: CALCULAR VALOR DEL INVENTARIO
// ============================================

function calcularValorInventario() {
    let valorTotal = 0;
    
    // Recorrer cada lote del inventario
    hojas.inventario.forEach(lote => {
        // Calcular stock real (compras - salidas)
        const stockReal = calcularStockRealLote(lote.Num_Lote, lote.Código_Med);
        
        // Calcular valor de ese lote
        const costo = lote.Costo_Unit || 0;
        const valorLote = stockReal * costo;
        
        valorTotal += valorLote;
        
        // Debug opcional
        // console.log(`${lote.Nombre_Med} (${lote.Num_Lote}): Stock=${stockReal}, Valor=${valorLote.toFixed(2)}`);
    });
    
    return valorTotal;
}

// ============================================
// FUNCIÓN MEJORADA: ALERTAS
// ============================================

function verificarAlertas() {
    console.log('🔍 Verificando alertas...');
    
    const alertas = [];
    
    // 1. ALERTAS DE STOCK BAJO
    hojas.catalogo.forEach(med => {
        // Calcular stock total real del medicamento
        let stockTotal = 0;
        hojas.inventario
            .filter(lote => lote.Código_Med === med.Código)
            .forEach(lote => {
                stockTotal += calcularStockRealLote(lote.Num_Lote, lote.Código_Med);
            });
        
        if (stockTotal < med.Stock_Min) {
            alertas.push({
                tipo: 'critico',
                mensaje: `🔴 ${med.Nombre} - Stock crítico: ${stockTotal} unidades (Mínimo: ${med.Stock_Min})`
            });
        }
    });
    
    // 2. ALERTAS DE PRÓXIMOS A VENCER (solo lotes con stock real)
    const hoy = new Date();
    hojas.inventario.forEach(lote => {
        if (!lote.Fecha_Venc) return;
        
        const stockReal = calcularStockRealLote(lote.Num_Lote, lote.Código_Med);
        if (stockReal === 0) return; // Ignorar lotes agotados
        
        const fechaVenc = parsearFecha(lote.Fecha_Venc);
        if (!fechaVenc) return;
        
        const diasRestantes = Math.floor((fechaVenc - hoy) / (1000 * 60 * 60 * 24));
        
        if (diasRestantes <= 30 && diasRestantes > 0) {
            alertas.push({
                tipo: 'advertencia',
                mensaje: `🟡 ${lote.Nombre_Med} - Lote ${lote.Num_Lote} vence en ${diasRestantes} días (Stock: ${stockReal})`
            });
        }
        
        if (diasRestantes <= 0) {
            alertas.push({
                tipo: 'critico',
                mensaje: `🔴 ${lote.Nombre_Med} - Lote ${lote.Num_Lote} YA VENCIÓ (Stock: ${stockReal})`
            });
        }
    });
    
    console.log('  - Alertas encontradas:', alertas.length);
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
// FUNCIÓN MEJORADA: VER CATÁLOGO
// ============================================
// Reemplazar en dashboard.js
function verCatalogo() {
    console.log("📋 Mostrando catálogo...");

    let html = `
        <h2>📋 Catálogo de Medicamentos</h2>
        <p style="color:#667eea; font-weight:bold;">✨ Stocks calculados automáticamente por lote</p>
        <table>
            <thead>
                <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Presentación</th>
                    <th>Concentración</th>
                    <th>Precio Unit.</th>
                    <th>Clase ABC</th>
                    <th>Stock Min</th>
                    <th>Stock Max</th>
                    <th>Stock Real</th>
                </tr>
            </thead>
            <tbody>
    `;

    hojas.catalogo.forEach((med) => {
        const presentacion = med.Presentacion ?? med["Presentación"] ?? "—";
        const concentracion = med.Concentracion ?? med["Concentración"] ?? "—";

        // Calcular stock real sumando todos los lotes de este medicamento
        let stockReal = 0;
        hojas.inventario
            .filter(lote => lote.Código_Med === med.Código)
            .forEach(lote => {
                stockReal += calcularStockRealLote(lote.Num_Lote, lote.Código_Med);
            });

        const claseABC = med.Clase_ABC ? med.Clase_ABC.toUpperCase() : "—";
        const badgeClase = `<span class="badge badge-${claseABC.toLowerCase()}">${claseABC}</span>`;

        const esStockBajo = stockReal < (med.Stock_Min || 0);
        const colorStock = esStockBajo ? 'style="color:red; font-weight:bold;"' : 'style="color:#28a745; font-weight:bold;"';

        html += `
            <tr>
                <td>${med.Código}</td>
                <td><strong>${med.Nombre || "—"}</strong></td>
                <td>${presentacion}</td>
                <td>${concentracion}</td>
                <td>$${(med.Precio_Unit || 0).toFixed(2)}</td>
                <td>${badgeClase}</td>
                <td>${formatearNumero(med.Stock_Min || 0)}</td>
                <td>${formatearNumero(med.Stock_Max || 0)}</td>
                <td ${colorStock}>${formatearNumero(stockReal)}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    document.getElementById("contenidoDinamico").innerHTML = html;
}


// ============================================
// FUNCIÓN MEJORADA: VER INVENTARIO
// ============================================
// Reemplazar en dashboard.js
function verInventario() {
    console.log("📦 Mostrando inventario por lotes...");

    let html = `
        <h2>📦 Inventario por Lotes (Actualizado Automáticamente)</h2>
        <p style="color:#667eea; font-weight:bold;">✨ Los stocks se calculan automáticamente: Compras - Salidas</p>
        <table>
            <thead>
                <tr>
                    <th>ID Lote</th>
                    <th>Código</th>
                    <th>Medicamento</th>
                    <th>N° Lote</th>
                    <th>Cant. Comprada</th>
                    <th>Cant. Despachada</th>
                    <th>Stock Real</th>
                    <th>Fecha Venc.</th>
                    <th>Costo Unit.</th>
                    <th>Valor Total</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
    `;

    hojas.inventario.forEach((lote) => {
        // Calcular stock real
        const stockReal = calcularStockRealLote(lote.Num_Lote, lote.Código_Med);
        
        // Calcular salidas de este lote
        const totalSalidas = hojas.salidas
            .filter(s => s.Num_Lote === lote.Num_Lote && s.Código_Med === lote.Código_Med)
            .reduce((sum, s) => sum + (s.Cantidad_Despachada || 0), 0);
        
        // Valor total del lote
        const valorLote = stockReal * (lote.Costo_Unit || 0);
        
        // Formatear fechas
        const fechaVencDisplay = formatearFechaDisplay(lote.Fecha_Venc);
        const fechaVencimientoReal = parsearFecha(lote.Fecha_Venc);
        const hoy = new Date();
        
        // Determinar estado
        let estado = "";
        let badgeClass = "";

        if (stockReal === 0) {
            estado = "Agotado";
            badgeClass = "badge-agotado";
        } else if (fechaVencimientoReal && fechaVencimientoReal < hoy) {
            estado = "Vencido";
            badgeClass = "badge-vencido";
        } else if (fechaVencimientoReal) {
            const dias = Math.floor((fechaVencimientoReal - hoy) / (1000 * 60 * 60 * 24));
            if (dias <= 30) {
                estado = "Por Vencer";
                badgeClass = "badge-vencer";
            } else {
                estado = "Activo";
                badgeClass = "badge-activo";
            }
        } else {
            estado = "Activo";
            badgeClass = "badge-activo";
        }

        html += `
            <tr>
                <td>${lote.ID_Lote || "—"}</td>
                <td>${lote.Código_Med || "—"}</td>
                <td><strong>${lote.Nombre_Med || "—"}</strong></td>
                <td>${lote.Num_Lote || "—"}</td>
                <td>${formatearNumero(lote.Cant_Inicial || 0)}</td>
                <td style="color:#dc3545; font-weight:bold;">${formatearNumero(totalSalidas)}</td>
                <td style="color:#28a745; font-weight:bold; font-size:1.1em;">${formatearNumero(stockReal)}</td>
                <td>${fechaVencDisplay}</td>
                <td>${formatearDinero(lote.Costo_Unit || 0)}</td>
                <td style="font-weight:bold;">${formatearDinero(valorLote)}</td>
                <td><span class="badge ${badgeClass}">${estado}</span></td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
        <div style="background:#e3f2fd; padding:15px; margin-top:20px; border-radius:8px;">
            <strong>💡 Nota:</strong> El stock real se calcula automáticamente.
        </div>
    `;

    document.getElementById("contenidoDinamico").innerHTML = html;
}
// ============================================
// FUNCIÓN AUXILIAR: FORMATEAR Y NORMALIZAR FECHAS
// ============================================
// ============================================
// FUNCIÓN AUXILIAR: CONVERTIR FECHA A OBJETO DATE
// ============================================
function parsearFecha(valor) {
    if (!valor || valor === "—" || valor === "") return null;
    
    const texto = String(valor).trim();
    
    // Si viene como dd/mm/yyyy (lo más común de tu Excel)
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(texto)) {
        const [dia, mes, anio] = texto.split('/');
        return new Date(anio, mes - 1, dia);
    }
    
    // Si viene como ISO (yyyy-mm-dd)
    if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
        return new Date(texto);
    }
    
    // Si es número serial de Excel
    if (!isNaN(texto)) {
        const base = new Date(1899, 11, 30);
        return new Date(base.getTime() + Number(texto) * 86400000);
    }
    
    return null;
}

// ============================================
// FUNCIÓN AUXILIAR: FORMATEAR FECHA PARA MOSTRAR
// ============================================
function formatearFechaDisplay(valor) {
    if (!valor || valor === "—" || valor === "") return "—";
    
    const texto = String(valor).trim();
    
    // Si ya está en formato dd/mm/yyyy, devolverla tal cual
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(texto)) {
        return texto;
    }
    
    // Si viene como ISO, convertirla
    if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
        const [a, m, d] = texto.split('-');
        return `${d}/${m}/${a}`;
    }
    
    // Si es número serial de Excel
    if (!isNaN(texto)) {
        const base = new Date(1899, 11, 30);
        const fecha = new Date(base.getTime() + Number(texto) * 86400000);
        const dia = String(fecha.getDate()).padStart(2, '0');
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const anio = fecha.getFullYear();
        return `${dia}/${mes}/${anio}`;
    }
    
    return texto;
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
            html += `<td>${asiento.Debe > 0 ? formatearDinero(asiento.Debe) : ''}</td>`;
            html += `<td>${asiento.Haber > 0 ? formatearDinero(asiento.Haber) : ''}</td>`;
            html += '</tr>';
        });
        
        html += '</tbody></table>';
    }
    
    document.getElementById('contenidoDinamico').innerHTML = html;
}

/// ============================================
// MÓDULO: LIBRO MAYOR (INTERACTIVO + CONTABLE)
// ============================================

function verLibroMayor() {
    console.log('📗 Mostrando Libro Mayor...');

    if (!hojas || !hojas.diario || hojas.diario.length === 0) {
        alert("⚠️ No hay registros cargados en el Libro Diario.");
        return;
    }

    // Agrupar asientos del Libro Diario por cuenta contable
    const cuentas = {};

    hojas.diario.forEach(asiento => {
        const cuenta = asiento.Cuenta?.trim() || 'Sin especificar';

        if (!cuentas[cuenta]) {
            cuentas[cuenta] = {
                movimientos: [],
                totalDebe: 0,
                totalHaber: 0
            };
        }

        const debe = parseFloat(asiento.Debe) || 0;
        const haber = parseFloat(asiento.Haber) || 0;

        cuentas[cuenta].movimientos.push({
            Fecha: asiento.Fecha || '',
            Num_Asiento: asiento.Num_Asiento || '',
            Descripción: asiento.Descripción || '',
            Debe: debe,
            Haber: haber
        });

        cuentas[cuenta].totalDebe += debe;
        cuentas[cuenta].totalHaber += haber;
    });

    // Si no hay cuentas
    if (Object.keys(cuentas).length === 0) {
        document.getElementById('contenidoDinamico').innerHTML = `
            <h2>📗 Libro Mayor</h2>
            <p>No hay movimientos registrados aún.</p>
        `;
        return;
    }

    // Calcular totales globales
    const totalDebe = Object.values(cuentas).reduce((sum, c) => sum + c.totalDebe, 0);
    const totalHaber = Object.values(cuentas).reduce((sum, c) => sum + c.totalHaber, 0);
    const balanceado = Math.abs(totalDebe - totalHaber) < 0.01;

    // Generar HTML del Libro Mayor
    let html = `
        <h2>📗 Libro Mayor</h2>
        <p>Resumen de movimientos agrupados por cuenta contable</p>

        <!-- Tarjeta resumen global -->
        <div style="
            background:#e3f2fd;
            border:2px solid #667eea;
            border-radius:12px;
            padding:20px;
            margin-bottom:25px;
            display:grid;
            grid-template-columns:repeat(3,1fr);
            text-align:center;
            font-size:1.1em;
            font-weight:bold;">
            <div>💰 Total Debe:<br><span style='color:#28a745;'>${formatearDinero(totalDebe)}</span></div>
            <div>💵 Total Haber:<br><span style='color:#dc3545;'>${formatearDinero(totalHaber)}</span></div>
            <div>${balanceado ? 
                "<span style='color:green;'>✅ Balanceado</span>" : 
                "<span style='color:red;'>⚠️ Desbalanceado</span>"}
            </div>
        </div>

        <!-- Buscador -->
        <div style="margin:15px 0;">
            <input type="text" id="buscadorCuenta" placeholder="🔍 Buscar cuenta..." 
                oninput="filtrarCuentasMayor()" 
                style="padding:8px; width:100%; border:1px solid #ccc; border-radius:5px;">
        </div>
    `;

    // Cuerpo del libro mayor
    Object.keys(cuentas).sort().forEach(nombreCuenta => {
        const cuenta = cuentas[nombreCuenta];
        const saldoFinal = cuenta.totalDebe - cuenta.totalHaber;

        html += `
            <div class="bloque-cuenta" style="margin-top:40px; border:2px solid #667eea; border-radius:10px; padding:20px; background:#f8f9fa;">
                <h3 style="color:#667eea; margin-top:0;">💼 ${nombreCuenta}</h3>

                <table class="tabla-mayor" style="width:100%; border-collapse:collapse;">
                    <thead style="background:#667eea; color:white;">
                        <tr>
                            <th>Fecha</th>
                            <th>N° Asiento</th>
                            <th>Descripción</th>
                            <th>Debe</th>
                            <th>Haber</th>
                            <th>Saldo</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        let saldoAcumulado = 0;

        cuenta.movimientos.forEach(mov => {
            saldoAcumulado += mov.Debe - mov.Haber;

            html += `
                <tr>
                    <td>${mov.Fecha}</td>
                    <td>${mov.Num_Asiento}</td>
                    <td>${mov.Descripción}</td>
                    <td style="text-align:right;">${mov.Debe > 0 ? formatearDinero(mov.Debe) : ''}</td>
                    <td style="text-align:right;">${mov.Haber > 0 ? formatearDinero(mov.Haber) : ''}</td>
                    <td style="text-align:right; font-weight:bold;">${formatearDinero(saldoAcumulado)}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                    <tfoot>
                        <tr style="background:#667eea; color:white; font-weight:bold;">
                            <td colspan="3">TOTALES</td>
                            <td style="text-align:right;">${formatearDinero(cuenta.totalDebe)}</td>
                            <td style="text-align:right;">${formatearDinero(cuenta.totalHaber)}</td>
                            <td style="text-align:right;">${formatearDinero(saldoFinal)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
    });

    // Botones de acción
    html += `
        <div style="margin-top:30px; text-align:center;">
            <button onclick="location.reload()">⬅️ Volver</button>
            <button class="btn-success" onclick="exportarMayorExcel()">💾 Exportar Libro Mayor</button>
        </div>
    `;

    document.getElementById('contenidoDinamico').innerHTML = html;
}

// ============================================
// FILTRAR CUENTAS (BUSCADOR)
// ============================================
function filtrarCuentasMayor() {
    const filtro = document.getElementById('buscadorCuenta').value.toLowerCase();
    const bloques = document.querySelectorAll('.bloque-cuenta');

    bloques.forEach(div => {
        const titulo = div.querySelector('h3').textContent.toLowerCase();
        div.style.display = titulo.includes(filtro) ? '' : 'none';
    });
}

// ============================================
// EXPORTAR LIBRO MAYOR A EXCEL
// ============================================
function exportarMayorExcel() {
    if (!hojas || !hojas.diario || hojas.diario.length === 0) {
        alert('⚠️ No hay datos para exportar.');
        return;
    }

    const wb = XLSX.utils.book_new();
    const registros = [];

    // Pasar todos los movimientos en un solo sheet
    Object.keys(hojas.diario).forEach(k => {
        registros.push(hojas.diario[k]);
    });

    const ws = XLSX.utils.json_to_sheet(registros);
    XLSX.utils.book_append_sheet(wb, ws, "Libro_Mayor");
    XLSX.writeFile(wb, "Libro_Mayor_Actualizado.xlsx");
    alert('✅ Libro Mayor exportado correctamente.');
}

