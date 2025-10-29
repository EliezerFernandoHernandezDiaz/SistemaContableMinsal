// ============================================
// MÓDULO: REPORTES CONTABLES PROFESIONALES
// ============================================
// Archivo: reportes-contables.js
// Descripción: Balance de Comprobación, Balance General y Estado de Resultados
// Autor: Sistema Contable MINSAL
// ============================================

// ============================================
// 1️⃣ BALANCE DE COMPROBACIÓN
// ============================================
function verBalanceComprobacion() {
    console.log('📊 Generando Balance de Comprobación...');
    
    if (!hojas.diario || hojas.diario.length === 0) {
        document.getElementById('contenidoDinamico').innerHTML = `
            <div class="reporte-detalle">
                <h2>📊 Balance de Comprobación</h2>
                <p style="color:orange;">⚠️ No hay movimientos contables registrados.</p>
                <button onclick="verReportesContables()">← Volver</button>
            </div>
        `;
        return;
    }
    
    // Agrupar por cuenta
    const cuentas = {};
    
    hojas.diario.forEach(asiento => {
        const cuenta = asiento.Cuenta?.trim() || 'Sin especificar';
        
        if (!cuentas[cuenta]) {
            cuentas[cuenta] = {
                debe: 0,
                haber: 0
            };
        }
        
        cuentas[cuenta].debe += parseFloat(asiento.Debe) || 0;
        cuentas[cuenta].haber += parseFloat(asiento.Haber) || 0;
    });
    
    // Calcular saldos
    const datosBalance = Object.keys(cuentas).sort().map(nombreCuenta => {
        const debe = cuentas[nombreCuenta].debe;
        const haber = cuentas[nombreCuenta].haber;
        const diferencia = debe - haber;
        
        return {
            cuenta: nombreCuenta,
            debe: debe,
            haber: haber,
            saldoDeudor: diferencia > 0 ? diferencia : 0,
            saldoAcreedor: diferencia < 0 ? Math.abs(diferencia) : 0
        };
    });
    
    // Calcular totales
    const totalDebe = datosBalance.reduce((sum, c) => sum + c.debe, 0);
    const totalHaber = datosBalance.reduce((sum, c) => sum + c.haber, 0);
    const totalSaldoDeudor = datosBalance.reduce((sum, c) => sum + c.saldoDeudor, 0);
    const totalSaldoAcreedor = datosBalance.reduce((sum, c) => sum + c.saldoAcreedor, 0);
    
    // Verificar balance
    const balanceadoDH = Math.abs(totalDebe - totalHaber) < 0.01;
    const balanceadoSaldos = Math.abs(totalSaldoDeudor - totalSaldoAcreedor) < 0.01;
    const estaBalanceado = balanceadoDH && balanceadoSaldos;
    
    // Generar HTML
    let html = `
        <div class="reporte-contable">
            <div class="encabezado-reporte">
                <h2>📊 BALANCE DE COMPROBACIÓN</h2>
                <p><strong>Ministerio de Salud de El Salvador</strong></p>
                <p>Al ${new Date().toLocaleDateString('es-SV', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
            
            <!-- Indicador de Balance -->
            <div style="background:${estaBalanceado ? '#d4edda' : '#f8d7da'}; 
                        border:2px solid ${estaBalanceado ? '#28a745' : '#dc3545'}; 
                        border-radius:10px; 
                        padding:20px; 
                        margin:20px 0; 
                        text-align:center;">
                <h3 style="margin:0; color:${estaBalanceado ? '#155724' : '#721c24'};">
                    ${estaBalanceado ? '✅ CONTABILIDAD BALANCEADA' : '⚠️ CONTABILIDAD DESBALANCEADA'}
                </h3>
                ${!estaBalanceado ? `
                    <p style="margin:10px 0 0 0; color:#721c24;">
                        Se detectaron inconsistencias. Revisar asientos contables.
                    </p>
                ` : ''}
            </div>
            
            <table class="tabla-contable">
                <thead>
                    <tr>
                        <th style="text-align:left; width:35%;">CUENTA</th>
                        <th style="text-align:right; width:15%;">DEBE</th>
                        <th style="text-align:right; width:15%;">HABER</th>
                        <th style="text-align:right; width:17.5%;">SALDO DEUDOR</th>
                        <th style="text-align:right; width:17.5%;">SALDO ACREEDOR</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Renderizar cada cuenta
    datosBalance.forEach(cuenta => {
        html += `
            <tr>
                <td style="text-align:left;"><strong>${cuenta.cuenta}</strong></td>
                <td style="text-align:right;">${formatearDinero(cuenta.debe)}</td>
                <td style="text-align:right;">${formatearDinero(cuenta.haber)}</td>
                <td style="text-align:right;">${cuenta.saldoDeudor > 0 ? formatearDinero(cuenta.saldoDeudor) : '—'}</td>
                <td style="text-align:right;">${cuenta.saldoAcreedor > 0 ? formatearDinero(cuenta.saldoAcreedor) : '—'}</td>
            </tr>
        `;
    });
    
    // Totales
    html += `
                </tbody>
                <tfoot>
                    <tr style="background:#667eea; color:white; font-weight:bold; font-size:1.1em;">
                        <td style="text-align:left;">TOTALES</td>
                        <td style="text-align:right;">${formatearDinero(totalDebe)}</td>
                        <td style="text-align:right;">${formatearDinero(totalHaber)}</td>
                        <td style="text-align:right;">${formatearDinero(totalSaldoDeudor)}</td>
                        <td style="text-align:right;">${formatearDinero(totalSaldoAcreedor)}</td>
                    </tr>
                </tfoot>
            </table>
            
            <!-- Notas explicativas -->
            <div style="background:#e3f2fd; padding:20px; border-radius:8px; margin-top:30px;">
                <h4>📌 Interpretación del Balance de Comprobación:</h4>
                <ul>
                    <li><strong>Debe = Haber:</strong> ${balanceadoDH ? '✅ Correcto' : '❌ Descuadrado'} 
                        (${formatearDinero(totalDebe)} = ${formatearDinero(totalHaber)})</li>
                    <li><strong>Saldo Deudor = Saldo Acreedor:</strong> ${balanceadoSaldos ? '✅ Correcto' : '❌ Descuadrado'} 
                        (${formatearDinero(totalSaldoDeudor)} = ${formatearDinero(totalSaldoAcreedor)})</li>
                    <li><strong>Total de cuentas:</strong> ${datosBalance.length}</li>
                </ul>
                <p style="margin-top:15px;"><strong>💡 Nota:</strong> El Balance de Comprobación verifica que 
                los registros contables estén matemáticamente correctos antes de generar estados financieros.</p>
            </div>
            
            <div style="text-align:center; margin-top:30px;">
                <button onclick="verReportesContables()">← Volver a Reportes Contables</button>
                <button class="btn-success" onclick="exportarBalanceComprobacion()">📥 Exportar Excel</button>
                <button class="btn-success" onclick="window.print()">🖨️ Imprimir</button>
            </div>
        </div>
    `;
    
    document.getElementById('contenidoDinamico').innerHTML = html;
}

// ============================================
// 2️⃣ BALANCE GENERAL (Estado de Situación Financiera)
// ============================================
function verBalanceGeneral() {
    console.log('📊 Generando Balance General...');
    
    if (!hojas.diario || hojas.diario.length === 0) {
        document.getElementById('contenidoDinamico').innerHTML = `
            <div class="reporte-detalle">
                <h2>📊 Balance General</h2>
                <p style="color:orange;">⚠️ No hay movimientos contables registrados.</p>
                <button onclick="verReportesContables()">← Volver</button>
            </div>
        `;
        return;
    }
    
    // Calcular saldos por cuenta
    const saldos = {};
    
    hojas.diario.forEach(asiento => {
        const cuenta = asiento.Cuenta?.trim() || 'Sin especificar';
        if (!saldos[cuenta]) saldos[cuenta] = 0;
        saldos[cuenta] += (parseFloat(asiento.Debe) || 0) - (parseFloat(asiento.Haber) || 0);
    });
    
    // Clasificar cuentas (puedes personalizar según tu catálogo de cuentas)
    const activos = {
        'Inventario de Medicamentos': saldos['Inventario de Medicamentos'] || 0,
        'IVA Crédito Fiscal': saldos['IVA Crédito Fiscal'] || 0,
        'Bancos': saldos['Bancos'] || 0,
        'Cuentas por Cobrar': saldos['Cuentas por Cobrar'] || 0
    };
    
    const pasivos = {
        'Cuentas por Pagar': Math.abs(saldos['Cuentas por Pagar'] || 0),
        'IVA Débito Fiscal': Math.abs(saldos['IVA Débito Fiscal'] || 0),
        'Proveedores': Math.abs(saldos['Proveedores'] || 0)
    };
    
    const costos = {
        'Costo de Medicamentos Despachados': saldos['Costo de Medicamentos Despachados'] || 0,
        'Costo de medicamentos despachados': saldos['Costo de medicamentos despachados'] || 0
    };
    
    // Calcular totales
    const totalActivos = Object.values(activos).reduce((sum, val) => sum + (val > 0 ? val : 0), 0);
    const totalPasivos = Object.values(pasivos).reduce((sum, val) => sum + (val > 0 ? val : 0), 0);
    const totalCostos = Object.values(costos).reduce((sum, val) => sum + val, 0);
    const resultadoEjercicio = -totalCostos; // Negativo porque son costos
    const totalPatrimonio = resultadoEjercicio;
    const totalPasivosPatrimonio = totalPasivos + totalPatrimonio;
    
    const estaBalanceado = Math.abs(totalActivos - totalPasivosPatrimonio) < 1;
    
    // Generar HTML
    let html = `
        <div class="reporte-contable">
            <div class="encabezado-reporte">
                <h2>📊 BALANCE GENERAL</h2>
                <h3>Estado de Situación Financiera</h3>
                <p><strong>Ministerio de Salud de El Salvador</strong></p>
                <p>Al ${new Date().toLocaleDateString('es-SV', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
            
            <!-- Tabla de Balance General -->
            <table class="tabla-contable" style="margin-top:30px;">
                <thead>
                    <tr style="background:#667eea; color:white;">
                        <th colspan="2" style="text-align:center; padding:15px; font-size:1.2em;">
                            BALANCE GENERAL
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <!-- ACTIVOS -->
                    <tr style="background:#e3f2fd;">
                        <td colspan="2" style="font-weight:bold; padding:12px; font-size:1.1em;">
                            ACTIVOS
                        </td>
                    </tr>
                    <tr style="background:#f8f9fa;">
                        <td style="padding-left:30px; font-weight:bold;">Activos Corrientes</td>
                        <td></td>
                    </tr>
    `;
    
    // Renderizar activos
    Object.keys(activos).forEach(cuenta => {
        if (activos[cuenta] > 0) {
            html += `
                <tr>
                    <td style="padding-left:50px;">${cuenta}</td>
                    <td style="text-align:right;">${formatearDinero(activos[cuenta])}</td>
                </tr>
            `;
        }
    });
    
    html += `
                    <tr style="background:#e3f2fd; font-weight:bold;">
                        <td style="padding-left:30px;">TOTAL ACTIVOS</td>
                        <td style="text-align:right;">${formatearDinero(totalActivos)}</td>
                    </tr>
                    
                    <!-- PASIVOS -->
                    <tr style="background:#fff3cd; border-top:3px solid #333;">
                        <td colspan="2" style="font-weight:bold; padding:12px; font-size:1.1em;">
                            PASIVOS
                        </td>
                    </tr>
                    <tr style="background:#f8f9fa;">
                        <td style="padding-left:30px; font-weight:bold;">Pasivos Corrientes</td>
                        <td></td>
                    </tr>
    `;
    
    // Renderizar pasivos
    Object.keys(pasivos).forEach(cuenta => {
        if (pasivos[cuenta] > 0) {
            html += `
                <tr>
                    <td style="padding-left:50px;">${cuenta}</td>
                    <td style="text-align:right;">${formatearDinero(pasivos[cuenta])}</td>
                </tr>
            `;
        }
    });
    
    html += `
                    <tr style="background:#fff3cd; font-weight:bold;">
                        <td style="padding-left:30px;">TOTAL PASIVOS</td>
                        <td style="text-align:right;">${formatearDinero(totalPasivos)}</td>
                    </tr>
                    
                    <!-- PATRIMONIO -->
                    <tr style="background:#d4edda; border-top:3px solid #333;">
                        <td colspan="2" style="font-weight:bold; padding:12px; font-size:1.1em;">
                            PATRIMONIO
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-left:50px;">Resultado del Ejercicio</td>
                        <td style="text-align:right; ${resultadoEjercicio < 0 ? 'color:red;' : 'color:green;'} font-weight:bold;">
                            ${formatearDinero(resultadoEjercicio)}
                        </td>
                    </tr>
                    <tr style="background:#d4edda; font-weight:bold;">
                        <td style="padding-left:30px;">TOTAL PATRIMONIO</td>
                        <td style="text-align:right;">${formatearDinero(totalPatrimonio)}</td>
                    </tr>
                    
                    <!-- TOTAL PASIVOS + PATRIMONIO -->
                    <tr style="background:#667eea; color:white; font-weight:bold; font-size:1.1em;">
                        <td style="padding:12px;">TOTAL PASIVOS + PATRIMONIO</td>
                        <td style="text-align:right; padding:12px;">${formatearDinero(totalPasivosPatrimonio)}</td>
                    </tr>
                </tbody>
            </table>
            
            <!-- Verificación de ecuación contable -->
            <div style="background:${estaBalanceado ? '#d4edda' : '#f8d7da'}; 
                        border:2px solid ${estaBalanceado ? '#28a745' : '#dc3545'}; 
                        padding:20px; 
                        border-radius:8px; 
                        margin-top:20px;
                        text-align:center;">
                <h4 style="margin-top:0;">📐 Ecuación Contable Fundamental</h4>
                <p style="font-size:1.2em; font-weight:bold;">
                    ACTIVOS = PASIVOS + PATRIMONIO
                </p>
                <p style="font-size:1.3em; margin:15px 0;">
                    ${formatearDinero(totalActivos)} = ${formatearDinero(totalPasivos)} + ${formatearDinero(totalPatrimonio)}
                </p>
                <p style="font-weight:bold; color:${estaBalanceado ? '#155724' : '#721c24'};">
                    ${estaBalanceado ? '✅ Ecuación Balanceada' : '⚠️ Ecuación Desbalanceada'}
                </p>
            </div>
            
            <!-- Notas -->
            <div style="background:#e3f2fd; padding:20px; border-radius:8px; margin-top:20px;">
                <h4>📌 Análisis Financiero:</h4>
                <ul>
                    <li><strong>Liquidez:</strong> ${totalActivos > totalPasivos ? 
                        '✅ Solvente' : '⚠️ Requiere atención'}</li>
                    <li><strong>Endeudamiento:</strong> ${totalPasivos > 0 ? 
                        ((totalPasivos/totalActivos)*100).toFixed(1) + '% de los activos' : 
                        'Sin deudas'}</li>
                    <li><strong>Resultado:</strong> ${resultadoEjercicio < 0 ? 
                        'Pérdida del período' : 'Utilidad del período'}</li>
                </ul>
            </div>
            
            <div style="text-align:center; margin-top:30px;">
                <button onclick="verReportesContables()">← Volver a Reportes Contables</button>
                <button class="btn-success" onclick="exportarBalanceGeneral()">📥 Exportar Excel</button>
                <button class="btn-success" onclick="window.print()">🖨️ Imprimir</button>
            </div>
        </div>
    `;
    
    document.getElementById('contenidoDinamico').innerHTML = html;
}

// ============================================
// 3️⃣ ESTADO DE RESULTADOS
// ============================================
function verEstadoResultados() {
    console.log('📊 Generando Estado de Resultados...');
    
    if (!hojas.diario || hojas.diario.length === 0) {
        document.getElementById('contenidoDinamico').innerHTML = `
            <div class="reporte-detable">
                <h2>📊 Estado de Resultados</h2>
                <p style="color:orange;">⚠️ No hay movimientos contables registrados.</p>
                <button onclick="verReportesContables()">← Volver</button>
            </div>
        `;
        return;
    }
    
    // Calcular saldos
    const saldos = {};
    
    hojas.diario.forEach(asiento => {
        const cuenta = asiento.Cuenta?.trim() || 'Sin especificar';
        if (!saldos[cuenta]) saldos[cuenta] = 0;
        saldos[cuenta] += (parseFloat(asiento.Debe) || 0) - (parseFloat(asiento.Haber) || 0);
    });
    
    // Clasificar ingresos y gastos
    const ingresos = {
        'Ingresos por Servicios': Math.abs(saldos['Ingresos por Servicios'] || 0),
        'Otros Ingresos': Math.abs(saldos['Otros Ingresos'] || 0)
    };
    
    const costosGastos = {
        'Costo de Medicamentos Despachados': saldos['Costo de Medicamentos Despachados'] || 0,
        'Costo de medicamentos despachados': saldos['Costo de medicamentos despachados'] || 0,
        'Gastos Administrativos': saldos['Gastos Administrativos'] || 0,
        'Gastos de Operación': saldos['Gastos de Operación'] || 0
    };
    
    // Calcular totales
    const totalIngresos = Object.values(ingresos).reduce((sum, val) => sum + val, 0);
    const totalCostosGastos = Object.values(costosGastos).reduce((sum, val) => sum + val, 0);
    const resultadoOperacional = totalIngresos - totalCostosGastos;
    const resultadoNeto = resultadoOperacional; // Simplificado
    
    // Generar HTML
    let html = `
        <div class="reporte-contable">
            <div class="encabezado-reporte">
                <h2>📊 ESTADO DE RESULTADOS</h2>
                <h3>Estado de Rendimiento Económico</h3>
                <p><strong>Ministerio de Salud de El Salvador</strong></p>
                <p>Del 01 de enero al ${new Date().toLocaleDateString('es-SV', { 
                    day: '2-digit', 
                    month: 'long', 
                    year: 'numeric' 
                })}</p>
            </div>
            
            <table class="tabla-contable" style="margin-top:30px;">
                <tbody>
                    <!-- INGRESOS -->
                    <tr style="background:#d4edda;">
                        <td colspan="2" style="font-weight:bold; padding:12px; font-size:1.1em;">
                            INGRESOS OPERACIONALES
                        </td>
                    </tr>
    `;
    
    // Renderizar ingresos
    let hayIngresos = false;
    Object.keys(ingresos).forEach(cuenta => {
        if (ingresos[cuenta] > 0) {
            hayIngresos = true;
            html += `
                <tr>
                    <td style="padding-left:50px;">${cuenta}</td>
                    <td style="text-align:right;">${formatearDinero(ingresos[cuenta])}</td>
                </tr>
            `;
        }
    });
    
    if (!hayIngresos) {
        html += `
            <tr>
                <td style="padding-left:50px; color:#999;">No hay ingresos registrados</td>
                <td style="text-align:right;">$0.00</td>
            </tr>
        `;
    }
    
    html += `
                    <tr style="background:#d4edda; font-weight:bold;">
                        <td style="padding-left:30px;">TOTAL INGRESOS</td>
                        <td style="text-align:right;">${formatearDinero(totalIngresos)}</td>
                    </tr>
                    
                    <!-- COSTOS Y GASTOS -->
                    <tr style="background:#f8d7da; border-top:3px solid #333;">
                        <td colspan="2" style="font-weight:bold; padding:12px; font-size:1.1em;">
                            COSTOS Y GASTOS
                        </td>
                    </tr>
    `;
    
    // Renderizar costos y gastos
    Object.keys(costosGastos).forEach(cuenta => {
        if (costosGastos[cuenta] > 0) {
            html += `
                <tr>
                    <td style="padding-left:50px;">${cuenta}</td>
                    <td style="text-align:right;">${formatearDinero(costosGastos[cuenta])}</td>
                </tr>
            `;
        }
    });
    
    html += `
                    <tr style="background:#f8d7da; font-weight:bold;">
                        <td style="padding-left:30px;">TOTAL COSTOS Y GASTOS</td>
                        <td style="text-align:right;">${formatearDinero(totalCostosGastos)}</td>
                    </tr>
                    
                    <!-- RESULTADO OPERACIONAL -->
                    <tr style="background:#fff3cd; border-top:2px solid #333;">
                        <td style="padding-left:30px; font-weight:bold; font-size:1.05em;">
                            RESULTADO OPERACIONAL
                        </td>
                        <td style="text-align:right; font-weight:bold; ${resultadoOperacional < 0 ? 'color:red;' : 'color:green;'}">
                            ${formatearDinero(resultadoOperacional)}
                        </td>
                    </tr>
                    
                    <!-- RESULTADO NETO -->
                    <tr style="background:#667eea; color:white; border-top:3px solid #333;">
                        <td style="padding:15px; font-weight:bold; font-size:1.2em;">
                            RESULTADO NETO DEL PERÍODO
                        </td>
                        <td style="text-align:right; padding:15px; font-weight:bold; font-size:1.2em;">
                            ${formatearDinero(resultadoNeto)}
                        </td>
                    </tr>
                </tbody>
            </table>
            
            <!-- Análisis del resultado -->
            <div style="background:${resultadoNeto >= 0 ? '#d4edda' : '#f8d7da'}; 
                        border:2px solid ${resultadoNeto >= 0 ? '#28a745' : '#dc3545'}; 
                        padding:20px; 
                        border-radius:8px; 
                        margin-top:20px;
                        text-align:center;">
                <h3 style="margin-top:0; color:${resultadoNeto >= 0 ? '#155724' : '#721c24'};">
                    ${resultadoNeto >= 0 ? '✅ UTILIDAD DEL PERÍODO' : '⚠️ PÉRDIDA DEL PERÍODO'}
                </h3>
                <p style="font-size:1.1em;">
                    ${resultadoNeto >= 0 ? 
                        'La institución generó recursos que exceden los gastos.' : 
                        'Los gastos excedieron los ingresos del período.'}
                </p>
            </div>
            
            <!-- Indicadores -->
            <div style="background:#e3f2fd; padding:20px; border-radius:8px; margin-top:20px;">
                <h4>📊 Indicadores de Desempeño:</h4>
                <ul>
                    <li><strong>Margen Operacional:</strong> ${totalIngresos > 0 ? 
                        ((resultadoOperacional/totalIngresos)*100).toFixed(2) + '%' : 
                        'N/A (sin ingresos)'}</li>
                    <li><strong>Eficiencia en Costos:</strong> ${totalIngresos > 0 ? 
                        ((totalCostosGastos/totalIngresos)*100).toFixed(2) + '% de los ingresos' : 
                        'Solo se registran egresos'}</li>
                    <li><strong>Interpretación:</strong> ${resultadoNeto < 0 ? 
                        'La institución está operando con déficit, típico de hospitales públicos.' : 
                        'La institución mantiene un superávit operacional.'}</li>
                </ul>
                <p style="margin-top:15px;"><strong>💡 Nota:</strong> En instituciones de salud pública, 
                es común operar con pérdidas ya que el objetivo es brindar servicios, no generar utilidades.</p>
            </div>
            
            <div style="text-align:center; margin-top:30px;">
                <button onclick="verReportesContables()">← Volver a Reportes Contables</button>
                <button class="btn-success" onclick="exportarEstadoResultados()">📥 Exportar Excel</button>
                <button class="btn-success" onclick="window.print()">🖨️ Imprimir</button>
            </div>
        </div>
    `;
    
    document.getElementById('contenidoDinamico').innerHTML = html;
}

// ============================================
// MENÚ DE REPORTES CONTABLES
// ============================================
function verReportesContables() {
    console.log('📊 Mostrando menú de reportes contables...');
    
    const html = `
        <div class="menu-reportes">
            <h2>📊 Reportes Contables Profesionales</h2>
            <p>Estados financieros y reportes contables del sistema</p>
            
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:25px; margin:30px 0;">
                
                <div class="tarjeta-reporte" onclick="verBalanceComprobacion()">
                    <div style="font-size:3em;">📊</div>
                    <h3>Balance de Comprobación</h3>
                    <p>Verificación de saldos deudores y acreedores</p>
                    <span style="font-size:0.85em; color:#666;">Valida que la contabilidad esté cuadrada</span>
                </div>
                
                <div class="tarjeta-reporte" onclick="verBalanceGeneral()">
                    <div style="font-size:3em;">💼</div>
                    <h3>Balance General</h3>
                    <p>Estado de Situación Financiera</p>
                    <span style="font-size:0.85em; color:#666;">Activos, Pasivos y Patrimonio</span>
                </div>
                
                <div class="tarjeta-reporte" onclick="verEstadoResultados()">
                    <div style="font-size:3em;">📈</div>
                    <h3>Estado de Resultados</h3>
                    <p>Utilidad o Pérdida del Período</p>
                    <span style="font-size:0.85em; color:#666;">Ingresos menos Gastos</span>
                </div>
                
            </div>
            
            <div style="text-align:center; margin-top:30px;">
                <button onclick="verReportes()">← Volver a Reportes Generales</button>
                <button onclick="mostrarDashboard(); document.getElementById('contenidoDinamico').innerHTML=''">🏠 Ir al Dashboard</button>
            </div>
        </div>
    `;
    
    document.getElementById('contenidoDinamico').innerHTML = html;
}

// ============================================
// FUNCIONES DE EXPORTACIÓN A EXCEL
// ============================================

function exportarBalanceComprobacion() {
    if (!hojas.diario || hojas.diario.length === 0) {
        alert('⚠️ No hay datos para exportar');
        return;
    }
    
    try {
        // Agrupar por cuenta
        const cuentas = {};
        
        hojas.diario.forEach(asiento => {
            const cuenta = asiento.Cuenta?.trim() || 'Sin especificar';
            
            if (!cuentas[cuenta]) {
                cuentas[cuenta] = { debe: 0, haber: 0 };
            }
            
            cuentas[cuenta].debe += parseFloat(asiento.Debe) || 0;
            cuentas[cuenta].haber += parseFloat(asiento.Haber) || 0;
        });
        
        // Preparar datos para Excel
        const datos = [];
        
        Object.keys(cuentas).sort().forEach(nombreCuenta => {
            const debe = cuentas[nombreCuenta].debe;
            const haber = cuentas[nombreCuenta].haber;
            const diferencia = debe - haber;
            
            datos.push({
                'CUENTA': nombreCuenta,
                'DEBE': debe,
                'HABER': haber,
                'SALDO DEUDOR': diferencia > 0 ? diferencia : 0,
                'SALDO ACREEDOR': diferencia < 0 ? Math.abs(diferencia) : 0
            });
        });
        
        // Calcular totales
        const totalDebe = datos.reduce((sum, c) => sum + c.DEBE, 0);
        const totalHaber = datos.reduce((sum, c) => sum + c.HABER, 0);
        const totalSaldoDeudor = datos.reduce((sum, c) => sum + c['SALDO DEUDOR'], 0);
        const totalSaldoAcreedor = datos.reduce((sum, c) => sum + c['SALDO ACREEDOR'], 0);
        
        datos.push({
            'CUENTA': 'TOTALES',
            'DEBE': totalDebe,
            'HABER': totalHaber,
            'SALDO DEUDOR': totalSaldoDeudor,
            'SALDO ACREEDOR': totalSaldoAcreedor
        });
        
        // Crear workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(datos);
        
        XLSX.utils.book_append_sheet(wb, ws, 'Balance de Comprobación');
        
        // Guardar archivo
        const fecha = new Date().toISOString().slice(0,10);
        XLSX.writeFile(wb, `Balance_Comprobacion_${fecha}.xlsx`);
        
        console.log('✅ Balance de Comprobación exportado');
        alert('✅ Balance de Comprobación exportado correctamente');
        
    } catch (error) {
        console.error('❌ Error al exportar:', error);
        alert('❌ Error al exportar el Balance de Comprobación');
    }
}

function exportarBalanceGeneral() {
    if (!hojas.diario || hojas.diario.length === 0) {
        alert('⚠️ No hay datos para exportar');
        return;
    }
    
    try {
        // Calcular saldos
        const saldos = {};
        
        hojas.diario.forEach(asiento => {
            const cuenta = asiento.Cuenta?.trim() || 'Sin especificar';
            if (!saldos[cuenta]) saldos[cuenta] = 0;
            saldos[cuenta] += (parseFloat(asiento.Debe) || 0) - (parseFloat(asiento.Haber) || 0);
        });
        
        // Preparar datos
        const datos = [
            { 'SECCIÓN': 'ACTIVOS', 'CUENTA': '', 'MONTO': '' },
            { 'SECCIÓN': '', 'CUENTA': 'Activos Corrientes', 'MONTO': '' },
            { 'SECCIÓN': '', 'CUENTA': 'Inventario de Medicamentos', 'MONTO': saldos['Inventario de Medicamentos'] || 0 },
            { 'SECCIÓN': '', 'CUENTA': 'IVA Crédito Fiscal', 'MONTO': saldos['IVA Crédito Fiscal'] || 0 },
            { 'SECCIÓN': '', 'CUENTA': 'TOTAL ACTIVOS', 'MONTO': (saldos['Inventario de Medicamentos'] || 0) + (saldos['IVA Crédito Fiscal'] || 0) },
            { 'SECCIÓN': '', 'CUENTA': '', 'MONTO': '' },
            { 'SECCIÓN': 'PASIVOS', 'CUENTA': '', 'MONTO': '' },
            { 'SECCIÓN': '', 'CUENTA': 'Pasivos Corrientes', 'MONTO': '' },
            { 'SECCIÓN': '', 'CUENTA': 'Cuentas por Pagar', 'MONTO': Math.abs(saldos['Cuentas por Pagar'] || 0) },
            { 'SECCIÓN': '', 'CUENTA': 'TOTAL PASIVOS', 'MONTO': Math.abs(saldos['Cuentas por Pagar'] || 0) },
            { 'SECCIÓN': '', 'CUENTA': '', 'MONTO': '' },
            { 'SECCIÓN': 'PATRIMONIO', 'CUENTA': '', 'MONTO': '' },
            { 'SECCIÓN': '', 'CUENTA': 'Resultado del Ejercicio', 'MONTO': -(saldos['Costo de Medicamentos Despachados'] || 0) - (saldos['Costo de medicamentos despachados'] || 0) },
            { 'SECCIÓN': '', 'CUENTA': 'TOTAL PASIVOS + PATRIMONIO', 'MONTO': Math.abs(saldos['Cuentas por Pagar'] || 0) - (saldos['Costo de Medicamentos Despachados'] || 0) - (saldos['Costo de medicamentos despachados'] || 0) }
        ];
        
        // Crear workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(datos);
        
        XLSX.utils.book_append_sheet(wb, ws, 'Balance General');
        
        const fecha = new Date().toISOString().slice(0,10);
        XLSX.writeFile(wb, `Balance_General_${fecha}.xlsx`);
        
        console.log('✅ Balance General exportado');
        alert('✅ Balance General exportado correctamente');
        
    } catch (error) {
        console.error('❌ Error al exportar:', error);
        alert('❌ Error al exportar el Balance General');
    }
}

function exportarEstadoResultados() {
    if (!hojas.diario || hojas.diario.length === 0) {
        alert('⚠️ No hay datos para exportar');
        return;
    }
    
    try {
        // Calcular saldos
        const saldos = {};
        
        hojas.diario.forEach(asiento => {
            const cuenta = asiento.Cuenta?.trim() || 'Sin especificar';
            if (!saldos[cuenta]) saldos[cuenta] = 0;
            saldos[cuenta] += (parseFloat(asiento.Debe) || 0) - (parseFloat(asiento.Haber) || 0);
        });
        
        const totalIngresos = Math.abs(saldos['Ingresos por Servicios'] || 0);
        const totalCostos = (saldos['Costo de Medicamentos Despachados'] || 0) + (saldos['Costo de medicamentos despachados'] || 0);
        const resultadoNeto = totalIngresos - totalCostos;
        
        // Preparar datos
        const datos = [
            { 'SECCIÓN': 'INGRESOS OPERACIONALES', 'CUENTA': '', 'MONTO': '' },
            { 'SECCIÓN': '', 'CUENTA': 'Ingresos por Servicios', 'MONTO': totalIngresos },
            { 'SECCIÓN': '', 'CUENTA': 'TOTAL INGRESOS', 'MONTO': totalIngresos },
            { 'SECCIÓN': '', 'CUENTA': '', 'MONTO': '' },
            { 'SECCIÓN': 'COSTOS Y GASTOS', 'CUENTA': '', 'MONTO': '' },
            { 'SECCIÓN': '', 'CUENTA': 'Costo de Medicamentos Despachados', 'MONTO': totalCostos },
            { 'SECCIÓN': '', 'CUENTA': 'TOTAL COSTOS Y GASTOS', 'MONTO': totalCostos },
            { 'SECCIÓN': '', 'CUENTA': '', 'MONTO': '' },
            { 'SECCIÓN': 'RESULTADO', 'CUENTA': '', 'MONTO': '' },
            { 'SECCIÓN': '', 'CUENTA': 'RESULTADO NETO DEL PERÍODO', 'MONTO': resultadoNeto }
        ];
        
        // Crear workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(datos);
        
        XLSX.utils.book_append_sheet(wb, ws, 'Estado de Resultados');
        
        const fecha = new Date().toISOString().slice(0,10);
        XLSX.writeFile(wb, `Estado_Resultados_${fecha}.xlsx`);
        
        console.log('✅ Estado de Resultados exportado');
        alert('✅ Estado de Resultados exportado correctamente');
        
    } catch (error) {
        console.error('❌ Error al exportar:', error);
        alert('❌ Error al exportar el Estado de Resultados');
    }
}

// ============================================
// ESTILOS CSS PARA LOS REPORTES CONTABLES
// ============================================
// Agregar al final de tu archivo CSS (styles.css):
/*
.reporte-contable {
    background: white;
    padding: 40px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    max-width: 1200px;
    margin: 20px auto;
}

.encabezado-reporte {
    text-align: center;
    border-bottom: 3px solid #667eea;
    padding-bottom: 20px;
    margin-bottom: 30px;
}

.encabezado-reporte h2 {
    color: #667eea;
    margin: 0;
    font-size: 2em;
}

.encabezado-reporte h3 {
    color: #666;
    margin: 10px 0;
    font-size: 1.3em;
    font-weight: normal;
}

.encabezado-reporte p {
    margin: 5px 0;
    color: #666;
}

.tabla-contable {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    font-size: 0.95em;
}

.tabla-contable thead th {
    background: #667eea;
    color: white;
    padding: 12px;
    text-align: left;
    font-weight: bold;
    border: 1px solid #5568d3;
}

.tabla-contable tbody tr {
    border-bottom: 1px solid #ddd;
}

.tabla-contable tbody tr:hover {
    background: #f8f9fa;
}

.tabla-contable tbody td {
    padding: 10px 12px;
    border: 1px solid #e0e0e0;
}

.tabla-contable tfoot tr {
    background: #667eea;
    color: white;
    font-weight: bold;
}

.tabla-contable tfoot td {
    padding: 12px;
    border: 1px solid #5568d3;
}

@media print {
    .reporte-contable {
        box-shadow: none;
        padding: 20px;
    }
    
    button {
        display: none !important;
    }
    
    .tabla-contable {
        font-size: 0.85em;
    }
}
*/