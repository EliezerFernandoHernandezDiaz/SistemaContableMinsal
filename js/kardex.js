function verKardex() {
    console.log('📦 Mostrando selector de Kardex...');
    
    let html = `
        <div class="reporte-detalle">
            <h2>📦 Kardex de Inventario - Método PEPS</h2>
            <p>Control detallado de entradas y salidas por medicamento</p>
            
            <div style="background:#e3f2fd; padding:20px; border-radius:8px; margin:20px 0;">
               
                <p><strong>Método utilizado:</strong> PEPS (Primero en Entrar, Primero en Salir) - Ideal para medicamentos por control de vencimientos.</p>
            </div>
            
            <h3>Selecciona un medicamento para ver su Kardex:</h3>
            
            <div style="margin:20px 0;">
                <label style="font-weight:bold;">Medicamento:</label>
                <select id="selectMedicamentoKardex" onchange="generarKardexMedicamento()" 
                        style="width:100%; padding:10px; margin-top:10px; font-size:1em;">
                    <option value="">-- Selecciona un medicamento --</option>
    `;
    
    // Listar todos los medicamentos del catálogo
    hojas.catalogo.forEach(med => {
        html += `<option value="${med.Código}">${med.Código} - ${med.Nombre}</option>`;
    });
    
    html += `
                </select>
            </div>
            
            <div id="contenidoKardex" style="margin-top:30px;">
                <p style="text-align:center; color:#999; font-style:italic;">
                    Selecciona un medicamento para ver su Kardex detallado
                </p>
            </div>
            
            <div style="text-align:center; margin-top:30px;">
                <button onclick="verReportes()">← Volver a Reportes</button>
            </div>
        </div>
    `;
    
    document.getElementById('contenidoDinamico').innerHTML = html;
}

// ============================================
// FUNCIÓN: GENERAR KARDEX DE UN MEDICAMENTO ESPECÍFICO
// ============================================
function generarKardexMedicamento() {
    const codigoMed = document.getElementById('selectMedicamentoKardex').value;
    
    if (!codigoMed) {
        document.getElementById('contenidoKardex').innerHTML = `
            <p style="text-align:center; color:#999; font-style:italic;">
                Selecciona un medicamento para ver su Kardex detallado
            </p>
        `;
        return;
    }
    
    console.log('📦 Generando Kardex para:', codigoMed);
    
    // Buscar información del medicamento
    const medicamento = hojas.catalogo.find(m => m.Código === codigoMed);
    
    if (!medicamento) {
        alert('⚠️ Medicamento no encontrado');
        return;
    }
    
    // Recopilar TODOS los movimientos (compras y salidas) de este medicamento
    const movimientos = [];
    
    // 1. Agregar COMPRAS
    hojas.compras.forEach(compra => {
        if (compra.Código_Med === codigoMed) {
            movimientos.push({
                fecha: compra.Fecha,
                tipo: 'COMPRA',
                detalle: `Compra - Fact. ${compra.Num_Factura}`,
                lote: compra.Num_Lote,
                entrada: compra.Cantidad || 0,
                salida: 0,
                costoUnit: compra.Precio_Unit || 0,
                proveedor: compra.Proveedor,
                ordenFecha: new Date(compra.Fecha)
            });
        }
    });
    
    // 2. Agregar SALIDAS
    hojas.salidas.forEach(salida => {
        if (salida.Código_Med === codigoMed) {
            movimientos.push({
                fecha: salida.Fecha,
                tipo: 'SALIDA',
                detalle: `Despacho ${salida.Num_Despacho} - ${salida.Hospital_Destino}`,
                lote: salida.Num_Lote,
                entrada: 0,
                salida: salida.Cantidad_Despachada || 0,
                costoUnit: salida.Costo_Unit || 0,
                responsable: salida.Responsable,
                ordenFecha: new Date(salida.Fecha)
            });
        }
    });
    
    // 3. Ordenar por fecha
    movimientos.sort((a, b) => a.ordenFecha - b.ordenFecha);
    
    // 4. Calcular saldos acumulados usando PEPS
    let saldoCantidad = 0;
    let saldoValor = 0;
    
    // Para PEPS necesitamos rastrear cada lote disponible
    const lotesDisponibles = []; // {lote, cantidad, costoUnit}
    
    movimientos.forEach(mov => {
        if (mov.tipo === 'COMPRA') {
            // ENTRADA: agregar lote a la cola PEPS
            lotesDisponibles.push({
                lote: mov.lote,
                cantidad: mov.entrada,
                costoUnit: mov.costoUnit
            });
            
            saldoCantidad += mov.entrada;
            saldoValor += (mov.entrada * mov.costoUnit);
            
        } else if (mov.tipo === 'SALIDA') {
            // SALIDA: sacar del lote más antiguo (PEPS)
            let cantidadPorSacar = mov.salida;
            let valorSalida = 0;
            
            while (cantidadPorSacar > 0 && lotesDisponibles.length > 0) {
                const loteActual = lotesDisponibles[0];
                
                if (loteActual.cantidad <= cantidadPorSacar) {
                    // Sacar todo el lote
                    valorSalida += (loteActual.cantidad * loteActual.costoUnit);
                    cantidadPorSacar -= loteActual.cantidad;
                    lotesDisponibles.shift(); // Remover lote agotado
                } else {
                    // Sacar parcialmente del lote
                    valorSalida += (cantidadPorSacar * loteActual.costoUnit);
                    loteActual.cantidad -= cantidadPorSacar;
                    cantidadPorSacar = 0;
                }
            }
            
            saldoCantidad -= mov.salida;
            saldoValor -= valorSalida;
            mov.valorSalida = valorSalida; // Guardar para mostrar
        }
        
        // Guardar saldo después de este movimiento
        mov.saldoCantidad = saldoCantidad;
        mov.saldoValor = saldoValor;
    });
    
    // 5. Calcular totales
    const totalEntradas = movimientos
        .filter(m => m.tipo === 'COMPRA')
        .reduce((sum, m) => sum + m.entrada, 0);
    
    const totalSalidas = movimientos
        .filter(m => m.tipo === 'SALIDA')
        .reduce((sum, m) => sum + m.salida, 0);
    
    const valorTotalEntradas = movimientos
        .filter(m => m.tipo === 'COMPRA')
        .reduce((sum, m) => sum + (m.entrada * m.costoUnit), 0);
    
    const valorTotalSalidas = movimientos
        .filter(m => m.tipo === 'SALIDA')
        .reduce((sum, m) => sum + (m.valorSalida || 0), 0);
    
    // 6. Generar HTML del Kardex
    let html = `
        <div style="background:white; border:2px solid #667eea; border-radius:10px; padding:20px;">
            <h3 style="color:#667eea; margin-top:0;">
                📦 Kardex: ${medicamento.Nombre} (${medicamento.Código})
            </h3>
            
            <div style="background:#f8f9fa; padding:15px; border-radius:8px; margin-bottom:20px;">
                <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:15px; text-align:center;">
                    <div>
                        <strong>Presentación:</strong><br>
                        ${medicamento.Presentacion || medicamento['Presentación'] || '-'}
                    </div>
                    <div>
                        <strong>Concentración:</strong><br>
                        ${medicamento.Concentracion || medicamento['Concentración'] || '-'}
                    </div>
                    <div>
                        <strong>Clase ABC:</strong><br>
                        <span class="badge badge-${medicamento.Clase_ABC?.toLowerCase()}">${medicamento.Clase_ABC}</span>
                    </div>
                    <div>
                        <strong>Método:</strong><br>
                        <span style="color:#667eea; font-weight:bold;">PEPS</span>
                    </div>
                </div>
            </div>
            
            <div style="overflow-x:auto;">
                <table class="tabla-kardex" style="width:100%; border-collapse:collapse; font-size:0.9em;">
                    <thead style="background:#667eea; color:white;">
                        <tr>
                            <th rowspan="2">Fecha</th>
                            <th rowspan="2">Tipo</th>
                            <th rowspan="2">Detalle</th>
                            <th rowspan="2">N° Lote</th>
                            <th colspan="3" style="border-bottom:1px solid white;">ENTRADA</th>
                            <th colspan="3" style="border-bottom:1px solid white;">SALIDA</th>
                            <th colspan="2" style="border-bottom:1px solid white;">SALDO</th>
                        </tr>
                        <tr>
                            <th>Cant.</th>
                            <th>C. Unit</th>
                            <th>Valor</th>
                            <th>Cant.</th>
                            <th>C. Unit</th>
                            <th>Valor</th>
                            <th>Cant.</th>
                            <th>Valor</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    if (movimientos.length === 0) {
        html += `
            <tr>
                <td colspan="12" style="text-align:center; padding:20px; color:#999;">
                    No hay movimientos registrados para este medicamento
                </td>
            </tr>
        `;
    } else {
        movimientos.forEach(mov => {
            const esCompra = mov.tipo === 'COMPRA';
            const colorFila = esCompra ? '#e8f5e9' : '#ffebee';
            
            html += `
                <tr style="background:${colorFila};">
                    <td style="padding:8px; border:1px solid #ddd;">${mov.fecha}</td>
                    <td style="padding:8px; border:1px solid #ddd; text-align:center;">
                        <strong style="color:${esCompra ? 'green' : 'red'};">${mov.tipo}</strong>
                    </td>
                    <td style="padding:8px; border:1px solid #ddd;">${mov.detalle}</td>
                    <td style="padding:8px; border:1px solid #ddd; text-align:center;">${mov.lote}</td>
                    
                    <!-- ENTRADA -->
                    <td style="padding:8px; border:1px solid #ddd; text-align:right;">
                        ${esCompra ? formatearNumero(mov.entrada) : '-'}
                    </td>
                    <td style="padding:8px; border:1px solid #ddd; text-align:right;">
                        ${esCompra ? formatearDinero(mov.costoUnit) : '-'}
                    </td>
                    <td style="padding:8px; border:1px solid #ddd; text-align:right;">
                        ${esCompra ? formatearDinero(mov.entrada * mov.costoUnit) : '-'}
                    </td>
                    
                    <!-- SALIDA -->
                    <td style="padding:8px; border:1px solid #ddd; text-align:right;">
                        ${!esCompra ? formatearNumero(mov.salida) : '-'}
                    </td>
                    <td style="padding:8px; border:1px solid #ddd; text-align:right;">
                        ${!esCompra ? formatearDinero(mov.costoUnit) : '-'}
                    </td>
                    <td style="padding:8px; border:1px solid #ddd; text-align:right;">
                        ${!esCompra ? formatearDinero(mov.valorSalida || 0) : '-'}
                    </td>
                    
                    <!-- SALDO -->
                    <td style="padding:8px; border:1px solid #ddd; text-align:right; font-weight:bold;">
                        ${formatearNumero(mov.saldoCantidad)}
                    </td>
                    <td style="padding:8px; border:1px solid #ddd; text-align:right; font-weight:bold;">
                        ${formatearDinero(mov.saldoValor)}
                    </td>
                </tr>
            `;
        });
    }
    
    // Fila de TOTALES
    html += `
                    </tbody>
                    <tfoot style="background:#667eea; color:white; font-weight:bold;">
                        <tr>
                            <td colspan="4" style="padding:10px; text-align:right;">TOTALES:</td>
                            <td style="padding:10px; text-align:right;">${formatearNumero(totalEntradas)}</td>
                            <td colspan="1"></td>
                            <td style="padding:10px; text-align:right;">${formatearDinero(valorTotalEntradas)}</td>
                            <td style="padding:10px; text-align:right;">${formatearNumero(totalSalidas)}</td>
                            <td colspan="1"></td>
                            <td style="padding:10px; text-align:right;">${formatearDinero(valorTotalSalidas)}</td>
                            <td style="padding:10px; text-align:right;">${formatearNumero(saldoCantidad)}</td>
                            <td style="padding:10px; text-align:right;">${formatearDinero(saldoValor)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            
            <div style="background:#fff3cd; padding:15px; border-radius:8px; margin-top:20px;">
                <h4 style="margin-top:0;">📊 Resumen del Kardex:</h4>
                <ul style="margin:10px 0;">
                    <li><strong>Total Entradas:</strong> ${formatearNumero(totalEntradas)} unidades por ${formatearDinero(valorTotalEntradas)}</li>
                    <li><strong>Total Salidas:</strong> ${formatearNumero(totalSalidas)} unidades por ${formatearDinero(valorTotalSalidas)}</li>
                    <li><strong>Saldo Actual:</strong> ${formatearNumero(saldoCantidad)} unidades valuadas en ${formatearDinero(saldoValor)}</li>
                    <li><strong>Costo Promedio:</strong> ${saldoCantidad > 0 ? formatearDinero(saldoValor / saldoCantidad) : '$0.00'} por unidad</li>
                    <li><strong>Método de Valuación:</strong> PEPS (Primero en Entrar, Primero en Salir)</li>
                </ul>
            </div>
            
            <div style="text-align:center; margin-top:20px;">
                <button class="btn-success" onclick="exportarKardexExcel('${codigoMed}', '${medicamento.Nombre}')">
                    💾 Exportar Kardex a Excel
                </button>
                <button class="btn-success" onclick="imprimirKardex()">
                    🖨️ Imprimir Kardex
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('contenidoKardex').innerHTML = html;
}

// ============================================
// FUNCIÓN: EXPORTAR KARDEX A EXCEL
// ============================================
function exportarKardexExcel(codigoMed, nombreMed) {
    console.log('💾 Exportando Kardex a Excel...');
    
    // Recopilar movimientos
    const movimientos = [];
    
    hojas.compras.forEach(compra => {
        if (compra.Código_Med === codigoMed) {
            movimientos.push({
                Fecha: compra.Fecha,
                Tipo: 'COMPRA',
                Detalle: `Compra - Fact. ${compra.Num_Factura}`,
                Lote: compra.Num_Lote,
                Entrada_Cant: compra.Cantidad,
                Entrada_CUnit: compra.Precio_Unit,
                Entrada_Valor: compra.Cantidad * compra.Precio_Unit,
                Salida_Cant: '',
                Salida_CUnit: '',
                Salida_Valor: '',
                ordenFecha: new Date(compra.Fecha)
            });
        }
    });
    
    hojas.salidas.forEach(salida => {
        if (salida.Código_Med === codigoMed) {
            movimientos.push({
                Fecha: salida.Fecha,
                Tipo: 'SALIDA',
                Detalle: `Despacho ${salida.Num_Despacho}`,
                Lote: salida.Num_Lote,
                Entrada_Cant: '',
                Entrada_CUnit: '',
                Entrada_Valor: '',
                Salida_Cant: salida.Cantidad_Despachada,
                Salida_CUnit: salida.Costo_Unit,
                Salida_Valor: salida.Cantidad_Despachada * salida.Costo_Unit,
                ordenFecha: new Date(salida.Fecha)
            });
        }
    });
    
    movimientos.sort((a, b) => a.ordenFecha - b.ordenFecha);
    
    // Crear archivo Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(movimientos.map(m => ({
        Fecha: m.Fecha,
        Tipo: m.Tipo,
        Detalle: m.Detalle,
        Lote: m.Lote,
        'Entrada Cant': m.Entrada_Cant,
        'Entrada C.Unit': m.Entrada_CUnit,
        'Entrada Valor': m.Entrada_Valor,
        'Salida Cant': m.Salida_Cant,
        'Salida C.Unit': m.Salida_CUnit,
        'Salida Valor': m.Salida_Valor
    })));
    
    XLSX.utils.book_append_sheet(wb, ws, "Kardex");
    XLSX.writeFile(wb, `Kardex_${codigoMed}_${nombreMed.replace(/\s+/g, '_')}.xlsx`);
    
    alert('✅ Kardex exportado correctamente');
}

// ============================================
// FUNCIÓN: IMPRIMIR KARDEX
// ============================================
function imprimirKardex() {
    window.print();
}
