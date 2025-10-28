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

/// ============================================
// VER CATÁLOGO COMPLETO (versión robusta)
// ============================================
function verCatalogo() {
  console.log("📋 Mostrando catálogo...");

  let html = `
    <h2>📋 Catálogo de Medicamentos</h2>
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
          <th>Stock Actual</th>
        </tr>
      </thead>
      <tbody>
  `;

  hojas.catalogo.forEach((med) => {
    // --- Resolver alias de campos con o sin tilde ---
    const presentacion =
      med.Presentacion ??
      med["Presentación"] ??
      med["Presentaci\u00F3n"] ??
      med["PresentaciÃ³n"] ??
      "—";

    const concentracion =
      med.Concentracion ??
      med["Concentración"] ??
      med["Concentraci\u00F3n"] ??
      med["ConcentraciÃ³n"] ??
      "—";

    // --- Calcular stock actual ---
    const stockActual = hojas.inventario
      .filter((lote) => lote.Código_Med === med.Código)
      .reduce((sum, lote) => sum + (lote.Cant_Actual || 0), 0);

    // --- Badge de clase ABC ---
    const claseABC = med.Clase_ABC ? med.Clase_ABC.toUpperCase() : "—";
    const badgeClase = `<span class="badge badge-${claseABC.toLowerCase()}">${claseABC}</span>`;

    // --- Color si stock bajo ---
    const esStockBajo = stockActual < (med.Stock_Min || 0);
    const colorStock = esStockBajo
      ? 'style="color:red; font-weight:bold;"'
      : "";

    html += `
      <tr>
        <td>${med.Código}</td>
        <td><strong>${med.Nombre || "—"}</strong></td>
        <td>${presentacion}</td>
        <td>${concentracion}</td>
        <td>$${(med.Precio_Unit || 0).toFixed(2)}</td>
        <td>${badgeClase}</td>
        <td>${med.Stock_Min || 0}</td>
        <td>${med.Stock_Max || 0}</td>
        <td ${colorStock}>${stockActual}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  document.getElementById("contenidoDinamico").innerHTML = html;
}

function verInventario() {
    console.log("📦 Mostrando inventario por lotes...");

    let html = `
        <h2>📦 Inventario por Lotes</h2>
        <table>
            <thead>
                <tr>
                    <th>ID Lote</th>
                    <th>Código</th>
                    <th>Medicamento</th>
                    <th>N° Lote</th>
                    <th>Cant. Inicial</th>
                    <th>Cant. Actual</th>
                    <th>Fecha Fab.</th>
                    <th>Fecha Venc.</th>
                    <th>Costo Unit.</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
    `;

    hojas.inventario.forEach((lote) => {
        // --- Formatear fechas para mostrar ---
        const fechaFabDisplay = formatearFechaDisplay(lote.Fecha_Fab);
        const fechaVencDisplay = formatearFechaDisplay(lote.Fecha_Venc);
        
        // --- Convertir fecha de vencimiento a Date para cálculos ---
        const fechaVencimientoReal = parsearFecha(lote.Fecha_Venc);
        const hoy = new Date();
        
        // --- Determinar estado del lote ---
        let estado = "";
        let badgeClass = "";

        if (lote.Cant_Actual === 0) {
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

        // --- Renderizar la fila ---
        html += `
            <tr>
                <td>${lote.ID_Lote || "—"}</td>
                <td>${lote.Código_Med || "—"}</td>
                <td><strong>${lote.Nombre_Med || "—"}</strong></td>
                <td>${lote.Num_Lote || "—"}</td>
                <td>${lote.Cant_Inicial || 0}</td>
                <td><strong>${lote.Cant_Actual || 0}</strong></td>
                <td>${fechaFabDisplay}</td>
                <td>${fechaVencDisplay}</td>
                <td>$${(lote.Costo_Unit || 0).toFixed(2)}</td>
                <td><span class="badge ${badgeClass}">${estado}</span></td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    document.getElementById("contenidoDinamico").innerHTML = html;
    console.log("✅ Inventario mostrado correctamente");
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
            <div>💰 Total Debe:<br><span style='color:#28a745;'>$${totalDebe.toFixed(2)}</span></div>
            <div>💵 Total Haber:<br><span style='color:#dc3545;'>$${totalHaber.toFixed(2)}</span></div>
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
                    <td style="text-align:right;">${mov.Debe > 0 ? '$' + mov.Debe.toFixed(2) : ''}</td>
                    <td style="text-align:right;">${mov.Haber > 0 ? '$' + mov.Haber.toFixed(2) : ''}</td>
                    <td style="text-align:right; font-weight:bold;">$${saldoAcumulado.toFixed(2)}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                    <tfoot>
                        <tr style="background:#667eea; color:white; font-weight:bold;">
                            <td colspan="3">TOTALES</td>
                            <td style="text-align:right;">$${cuenta.totalDebe.toFixed(2)}</td>
                            <td style="text-align:right;">$${cuenta.totalHaber.toFixed(2)}</td>
                            <td style="text-align:right;">$${saldoFinal.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
    });

    // Botones de acción
    html += `
        <div style="margin-top:30px; text-align:center;">
            <button class="btn-secondary" onclick="mostrarDashboard()">⬅️ Volver</button>
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

