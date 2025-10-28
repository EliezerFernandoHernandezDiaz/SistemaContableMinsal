// ============================================
// MÓDULO DE REPORTES
// ============================================

function verReportes() {
    console.log('📊 Mostrando menú de reportes...');
    
    const html = `
        <div class="menu-reportes">
            <h2>📊 Reportes del Sistema</h2>
            <p>Selecciona el tipo de reporte que deseas generar:</p>
            
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap:20px; margin:30px 0;">
                
                <div class="tarjeta-reporte" onclick="reporteMedicamentosCriticos()">
                    <div style="font-size:3em;">🔴</div>
                    <h3>Medicamentos Críticos</h3>
                    <p>Solo medicamentos Clase A (alto valor)</p>
                </div>
                
                <div class="tarjeta-reporte" onclick="reporteProximosVencer()">
                    <div style="font-size:3em;">⚠️</div>
                    <h3>Próximos a Vencer</h3>
                    <p>Lotes que vencen en 30, 60, 90 días</p>
                </div>
                
                <div class="tarjeta-reporte" onclick="reporteValoracionABC()">
                    <div style="font-size:3em;">📈</div>
                    <h3>Valoración ABC</h3>
                    <p>Resumen por clasificación</p>
                </div>
                
                <div class="tarjeta-reporte" onclick="reporteMovimientos()">
                    <div style="font-size:3em;">📋</div>
                    <h3>Movimientos del Mes</h3>
                    <p>Compras y salidas recientes</p>
                </div>
                
            </div>
            
            <div style="text-align:center; margin-top:30px;">
                <button onclick="document.getElementById('contenidoDinamico').innerHTML=''">← Volver al Dashboard</button>
            </div>
        </div>
        
        <style>
            .tarjeta-reporte {
                background: white;
                padding: 30px;
                border-radius: 10px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s;
                border: 2px solid #ddd;
            }
            .tarjeta-reporte:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 25px rgba(0,0,0,0.15);
                border-color: #667eea;
            }
            .tarjeta-reporte h3 {
                margin: 15px 0 10px 0;
                color: #333;
            }
            .tarjeta-reporte p {
                color: #666;
                font-size: 0.9em;
            }
        </style>
    `;
    
    document.getElementById('contenidoDinamico').innerHTML = html;
}

// ============================================
// REPORTE: MEDICAMENTOS CRÍTICOS (CLASE A)
// ============================================
function reporteMedicamentosCriticos() {
    console.log('📊 Generando reporte de medicamentos críticos...');
    
    // Filtrar solo Clase A
    const medicamentosA = hojas.catalogo.filter(m => m.Clase_ABC === 'A');
    
    // Calcular stock y valor de cada uno
    const reporte = medicamentosA.map(med => {
        const stockTotal = hojas.inventario
            .filter(l => l.Código_Med === med.Código)
            .reduce((sum, l) => sum + (l.Cant_Actual || 0), 0);
        
        const valorTotal = hojas.inventario
            .filter(l => l.Código_Med === med.Código)
            .reduce((sum, l) => sum + ((l.Cant_Actual || 0) * (l.Costo_Unit || 0)), 0);
        
        return {
            codigo: med.Código,
            nombre: med.Nombre,
            stock: stockTotal,
            stockMin: med.Stock_Min,
            valorTotal: valorTotal,
            alertaBajoStock: stockTotal < med.Stock_Min
        };
    });
    
    // Ordenar por valor (mayor a menor)
    reporte.sort((a, b) => b.valorTotal - a.valorTotal);
    
    const valorTotalA = reporte.reduce((sum, item) => sum + item.valorTotal, 0);
    
    let html = `
        <div class="reporte-detalle">
            <h2>🔴 Reporte: Medicamentos Críticos (Clase A)</h2>
            <p>Medicamentos de alto valor que requieren mayor control</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-SV')}</p>
            
            <table>
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Nombre</th>
                        <th>Stock Actual</th>
                        <th>Stock Mínimo</th>
                        <th>Valor Total</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    reporte.forEach(item => {
        const estado = item.alertaBajoStock ? 
            '<span style="color:red; font-weight:bold;">⚠️ BAJO STOCK</span>' : 
            '<span style="color:green;">✅ OK</span>';
        
        html += `
            <tr style="${item.alertaBajoStock ? 'background:#ffe6e6;' : ''}">
                <td>${item.codigo}</td>
                <td><strong>${item.nombre}</strong></td>
               <td>${formatearNumero(item.stock)}</td>
                <td>${formatearNumero(item.stockMin)}</td>
                 <td>${formatearDinero(item.valorTotal)}</td>
                <td>${estado}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
                <tfoot>
                    <tr style="background:#f0f0f0; font-weight:bold;">
                        <td colspan="4">TOTAL CLASE A</td>
                           <td>${formatearDinero(valorTotalA)}</td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
            
            <div style="background:#e3f2fd; padding:20px; border-radius:8px; margin-top:20px;">
                <h4>💡 Recomendaciones:</h4>
                <ul>
                    ${reporte.filter(i => i.alertaBajoStock).length > 0 ? 
                        '<li>⚠️ ' + reporte.filter(i => i.alertaBajoStock).length + ' medicamento(s) requieren reabastecimiento urgente</li>' : 
                        '<li>✅ Todos los medicamentos Clase A tienen stock adecuado</li>'
                    }
                    <li>Los medicamentos Clase A representan aproximadamente el 80% del valor total del inventario</li>
                    <li>Se recomienda revisar estos medicamentos semanalmente</li>
                </ul>
            </div>
            
            <div style="text-align:center; margin-top:30px;">
                <button onclick="verReportes()">← Volver a Reportes</button>
                <button class="btn-success" onclick="imprimirReporte()">🖨️ Imprimir</button>
            </div>
        </div>
    `;
    
    document.getElementById('contenidoDinamico').innerHTML = html;
}

// ============================================
// REPORTE: PRÓXIMOS A VENCER
// ============================================
function reporteProximosVencer() {
    console.log('📊 Generando reporte de próximos a vencer...');
    
    const hoy = new Date();
    const urgente = []; // < 30 días
    const atencion = []; // 30-60 días
    const monitoreo = []; // 60-90 días
    
    hojas.inventario.forEach(lote => {
        if (lote.Cant_Actual === 0) return;
        
        const fechaVenc = new Date(lote.Fecha_Venc.split('/').reverse().join('-'));
        const diasRestantes = Math.floor((fechaVenc - hoy) / (1000 * 60 * 60 * 24));
        
        const item = {
            ...lote,
            diasRestantes: diasRestantes,
            valorRiesgo: lote.Cant_Actual * lote.Costo_Unit
        };
        
        if (diasRestantes <= 30 && diasRestantes > 0) {
            urgente.push(item);
        } else if (diasRestantes <= 60) {
            atencion.push(item);
        } else if (diasRestantes <= 90) {
            monitoreo.push(item);
        }
    });
    
    const valorUrgente = urgente.reduce((sum, l) => sum + l.valorRiesgo, 0);
    
    let html = `
        <div class="reporte-detalle">
            <h2>⚠️ Reporte: Medicamentos Próximos a Vencer</h2>
            <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-SV')}</p>
            
            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:20px; margin:20px 0;">
                <div style="background:#ffebee; padding:20px; border-radius:8px; text-align:center;">
                    <h3>🔴 URGENTE</h3>
                    <p style="font-size:2em; font-weight:bold; margin:10px 0;">${urgente.length}</p>
                    <p>≤ 30 días</p>
                  <p>Valor: ${formatearDinero(valorUrgente)}</p>
                </div>
                <div style="background:#fff3cd; padding:20px; border-radius:8px; text-align:center;">
                    <h3>🟡 ATENCIÓN</h3>
                    <p style="font-size:2em; font-weight:bold; margin:10px 0;">${atencion.length}</p>
                    <p>31-60 días</p>
                </div>
                <div style="background:#d4edda; padding:20px; border-radius:8px; text-align:center;">
                    <h3>🟢 MONITOREO</h3>
                    <p style="font-size:2em; font-weight:bold; margin:10px 0;">${monitoreo.length}</p>
                    <p>61-90 días</p>
                </div>
            </div>
            
            <h3 style="margin-top:30px;">🔴 Lotes URGENTES (≤ 30 días)</h3>
            ${urgente.length === 0 ? '<p>✅ No hay lotes en riesgo urgente</p>' : `
            <table>
                <thead>
                    <tr>
                        <th>Medicamento</th>
                        <th>Lote</th>
                        <th>Cantidad</th>
                        <th>Vencimiento</th>
                        <th>Días Restantes</th>
                        <th>Valor en Riesgo</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    ${urgente.map(lote => `
                        <tr style="background:#ffebee;">
                            <td><strong>${lote.Nombre_Med}</strong></td>
                            <td>${lote.Num_Lote}</td>
                             <td>${formatearNumero(lote.Cant_Actual)}</td>
                            <td>${lote.Fecha_Venc}</td>
                            <td><strong style="color:red;">${lote.diasRestantes} días</strong></td>
                              <td>${formatearDinero(lote.valorRiesgo)}</td>
                            <td>${lote.diasRestantes <= 10 ? 'DESPACHAR YA' : 'Usar prioritariamente'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            `}
            
            <div style="text-align:center; margin-top:30px;">
                <button onclick="verReportes()">← Volver a Reportes</button>
                <button class="btn-success" onclick="imprimirReporte()">🖨️ Imprimir</button>
            </div>
        </div>
    `;
    
    document.getElementById('contenidoDinamico').innerHTML = html;
}

// ============================================
// REPORTE: VALORACIÓN ABC
// ============================================
function reporteValoracionABC() {
    console.log('📊 Generando reporte de valoración ABC...');
    
    let valorA = 0, valorB = 0, valorC = 0;
    let cantA = 0, cantB = 0, cantC = 0;
    
    hojas.catalogo.forEach(med => {
        const valor = hojas.inventario
            .filter(l => l.Código_Med === med.Código)
            .reduce((sum, l) => sum + ((l.Cant_Actual || 0) * (l.Costo_Unit || 0)), 0);
        
        if (med.Clase_ABC === 'A') {
            valorA += valor;
            cantA++;
        } else if (med.Clase_ABC === 'B') {
            valorB += valor;
            cantB++;
        } else {
            valorC += valor;
            cantC++;
        }
    });
    
    const valorTotal = valorA + valorB + valorC;
    const porcA = ((valorA / valorTotal) * 100).toFixed(1);
    const porcB = ((valorB / valorTotal) * 100).toFixed(1);
    const porcC = ((valorC / valorTotal) * 100).toFixed(1);
    
    const html = `
        <div class="reporte-detalle">
            <h2>📈 Reporte: Valoración ABC del Inventario</h2>
            <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-SV')}</p>
            
            <table>
                <thead>
                    <tr>
                        <th>Clasificación</th>
                        <th>N° Medicamentos</th>
                        <th>% Medicamentos</th>
                        <th>Valor Total</th>
                        <th>% Valor</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style="background:#ffebee;">
                        <td><span class="badge badge-a">A</span> Alto Valor</td>
                        <td>${cantA}</td>
                        <td>${((cantA/hojas.catalogo.length)*100).toFixed(1)}%</td>
                        <td>${formatearDinero(valorA)}</td>
                        <td><strong>${porcA}%</strong></td>
                    </tr>
                    <tr style="background:#fff3cd;">
                        <td><span class="badge badge-b">B</span> Valor Medio</td>
                        <td>${cantB}</td>
                        <td>${((cantB/hojas.catalogo.length)*100).toFixed(1)}%</td>
                        <td>${formatearDinero(valorB)}</td>
                        <td><strong>${porcB}%</strong></td>
                    </tr>
                    <tr style="background:#d4edda;">
                        <td><span class="badge badge-c">C</span> Valor Bajo</td>
                        <td>${cantC}</td>
                        <td>${((cantC/hojas.catalogo.length)*100).toFixed(1)}%</td>
                        <td>${formatearDinero(valorC)}</td>
                        <td><strong>${porcC}%</strong></td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr style="background:#f0f0f0; font-weight:bold;">
                        <td>TOTAL</td>
                        <td>${hojas.catalogo.length}</td>
                        <td>100%</td>
                        <td>${formatearDinero(valorTotal)}</td>
                        <td>100%</td>
                    </tr>
                </tfoot>
            </table>
            
            <div style="background:#e3f2fd; padding:20px; border-radius:8px; margin-top:20px;">
                <h4>📊 Interpretación del Análisis ABC:</h4>
                <ul>
                     <li><strong>Clase A:</strong> ${formatearNumero(cantA)} medicamentos (${((cantA/hojas.catalogo.length)*100).toFixed(0)}%) representan ${porcA}% del valor total</li>
                    <li><strong>Clase B:</strong> ${formatearNumero(cantB)} medicamentos (${((cantB/hojas.catalogo.length)*100).toFixed(0)}%) representan ${porcB}% del valor total</li>
                    <li><strong>Clase C:</strong> ${formatearNumero(cantC)} medicamentos (${((cantC/hojas.catalogo.length)*100).toFixed(0)}%) representan ${porcC}% del valor total</li>
                </ul>
                </ul>
                <p style="margin-top:15px;"><strong>💡 Recomendación:</strong> Enfocar el 80% de los esfuerzos de control en los medicamentos Clase A.</p>
            </div>
            
            <div style="text-align:center; margin-top:30px;">
                <button onclick="verReportes()">← Volver a Reportes</button>
                <button class="btn-success" onclick="imprimirReporte()">🖨️ Imprimir</button>
            </div>
        </div>
    `;
    
    document.getElementById('contenidoDinamico').innerHTML = html;
}

// ============================================
// REPORTE: MOVIMIENTOS DEL MES
// ============================================
function reporteMovimientos() {
    const html = `
        <div class="reporte-detalle">
            <h2>📋 Reporte: Movimientos del Mes</h2>
            
            <h3>📥 Compras Registradas (${formatearNumero(hojas.compras.length)})</h3>
            ${hojas.compras.length === 0 ? '<p>No hay compras registradas</p>' : `
            <table>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Factura</th>
                        <th>Proveedor</th>
                        <th>Medicamento</th>
                        <th>Cantidad</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${hojas.compras.map(c => `
                        <tr>
                            <td>${c.Fecha}</td>
                            <td>${c.Num_Factura}</td>
                            <td>${c.Proveedor}</td>
                            <td>${c.Nombre_Med}</td>
                           <td>${formatearNumero(c.Cantidad)}</td>
                            <td>${formatearDinero(c.Total)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            `}
            
        <h3 style="margin-top:30px;">📤 Salidas Registradas (${hojas.salidas.length})</h3>
${hojas.salidas.length === 0 ? '<p>No hay salidas registradas</p>' : `
<table>
    <thead>
        <tr>
            <th>Fecha</th>
            <th>N° Despacho</th>
            <th>Hospital</th>
            <th>Medicamento</th>
            <th>Cantidad</th>
            <th>Costo Unit.</th>
            <th>Total</th>
        </tr>
    </thead>
    <tbody>
        ${hojas.salidas.map(s => `
            <tr>
                <td>${s.Fecha}</td>
                <td>${s.Num_Despacho}</td>
                <td>${s.Hospital_Destino}</td>
                <td>${s.Nombre_Med}</td>
                 <td>${formatearNumero(s.Cantidad_Despachada)}</td>
                <td>${formatearDinero(s.Costo_Unit || s.Costo_Unit_1 || 0)}</td>
                <td>${formatearDinero(s.Total || s.Total_1 || 0)}</td>
            </tr>
        `).join('')}
    </tbody>
</table>
`}
            <div style="text-align:center; margin-top:30px;">
                <button onclick="verReportes()">← Volver a Reportes</button>
            </div>
        </div>
    `;
    
    document.getElementById('contenidoDinamico').innerHTML = html;
}

// ============================================
// IMPRIMIR REPORTE
// ============================================
function imprimirReporte() {
    window.print();
}