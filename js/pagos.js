// ============================================
// MÓDULO: PAGOS A PROVEEDORES Y MANEJO DE BANCOS
// Archivo: pagos.js
// ============================================

// Variable global para controlar el saldo bancario
let saldoBanco = 0;

// ============================================
// FUNCIÓN DE DEBUG: Ver qué está pasando
// ============================================
function debugCuentasPorPagar() {
    console.log('🔍 DEBUG: Analizando Cuentas por Pagar...');
    console.log('=====================================');
    
    let totalCompras = 0;
    
    console.log('📦 COMPRAS REGISTRADAS:');
    hojas.compras.forEach((compra, index) => {
        const subtotal = (compra.Cantidad || 0) * (compra.Precio_Unit || 0);
        const iva = subtotal * 0.13;
        const totalConIVA = subtotal + iva;
        
        console.log(`${index + 1}. ${compra.Proveedor}`);
        console.log(`   Medicamento: ${compra.Nombre_Med}`);
        console.log(`   Cantidad: ${compra.Cantidad}`);
        console.log(`   Precio Unit: $${compra.Precio_Unit}`);
        console.log(`   Subtotal: $${subtotal.toFixed(2)}`);
        console.log(`   IVA 13%: $${iva.toFixed(2)}`);
        console.log(`   Total c/IVA: $${totalConIVA.toFixed(2)}`);
        console.log(`   compra.Total (del Excel): $${compra.Total}`);
        console.log('   ---');
        
        totalCompras += totalConIVA;
    });
    
    console.log('=====================================');
    console.log(`💰 TOTAL COMPRAS CALCULADO: $${totalCompras.toFixed(2)}`);
    console.log('=====================================');
    
    // Verificar pagos
    let totalPagos = 0;
    console.log('💳 PAGOS REGISTRADOS:');
    hojas.diario.forEach(asiento => {
        if (asiento.Cuenta === 'Cuentas por Pagar' && asiento.Debe > 0) {
            console.log(`   ${asiento.Fecha} - ${asiento.Descripción}: $${asiento.Debe.toFixed(2)}`);
            totalPagos += asiento.Debe;
        }
    });
    console.log(`💰 TOTAL PAGOS: $${totalPagos.toFixed(2)}`);
    console.log('=====================================');
    
    const deudaPendiente = totalCompras - totalPagos;
    console.log(`📊 DEUDA PENDIENTE: $${deudaPendiente.toFixed(2)}`);
    console.log('=====================================');
}

// ============================================
// FUNCIÓN: INICIALIZAR PRESUPUESTO DEL GOBIERNO
// ============================================
function inicializarPresupuesto() {
    console.log('💰 Inicializando presupuesto gubernamental...');
    
    const html = `
        <div class="reporte-detalle">
            <h2>🏛️ Registro de Presupuesto Gubernamental</h2>
            <p>Registra las transferencias que el MINSAL recibe del gobierno para operar</p>
            
            <div style="background:#e3f2fd; padding:20px; border-radius:8px; margin:20px 0;">
                <h3>💰 Saldo Actual en Bancos: ${formatearDinero(saldoBanco)}</h3>
            </div>
            
            <form id="formPresupuesto" style="background:white; padding:30px; border-radius:10px; box-shadow:0 2px 10px rgba(0,0,0,0.1);">
                <h3>Registrar Nueva Transferencia</h3>
                
                <div style="margin-bottom:20px;">
                    <label style="display:block; font-weight:bold; margin-bottom:5px;">Fecha de Transferencia:</label>
                    <input type="date" id="fechaTransferencia" required 
                           style="width:100%; padding:10px; border:1px solid #ddd; border-radius:5px;">
                </div>
                
                <div style="margin-bottom:20px;">
                    <label style="display:block; font-weight:bold; margin-bottom:5px;">N° Comprobante/Oficio:</label>
                    <input type="text" id="numeroComprobante" placeholder="Ej: OFICIO-2025-001" required
                           style="width:100%; padding:10px; border:1px solid #ddd; border-radius:5px;">
                </div>
                
                <div style="margin-bottom:20px;">
                    <label style="display:block; font-weight:bold; margin-bottom:5px;">Concepto:</label>
                    <input type="text" id="conceptoTransferencia" 
                           placeholder="Ej: Presupuesto ordinario Q1 2025" required
                           style="width:100%; padding:10px; border:1px solid #ddd; border-radius:5px;">
                </div>
                
                <div style="margin-bottom:20px;">
                    <label style="display:block; font-weight:bold; margin-bottom:5px;">Monto (USD):</label>
                    <input type="number" id="montoTransferencia" step="0.01" min="0" 
                           placeholder="50000.00" required
                           style="width:100%; padding:10px; border:1px solid #ddd; border-radius:5px; font-size:1.2em;">
                </div>
                
                <div style="text-align:center; margin-top:30px;">
                    <button type="button" onclick="document.getElementById('contenidoDinamico').innerHTML=''">
                        Cancelar
                    </button>
                    <button type="submit" class="btn-success" style="margin-left:10px;">
                        💰 Registrar Transferencia
                    </button>
                </div>
            </form>
            
            <div style="background:#fff3cd; padding:20px; border-radius:8px; margin-top:20px;">
                <h4>💡 ¿Qué sucede al registrar?</h4>
                <ul>
                    <li>✅ Aumenta el saldo en Bancos</li>
                    <li>✅ Se registra en Transferencias del Gobierno (ingreso)</li>
                    <li>✅ Se genera asiento contable automático</li>
                    <li>✅ Ya puedes pagar a proveedores</li>
                </ul>
            </div>
        </div>
    `;
    
    document.getElementById('contenidoDinamico').innerHTML = html;
    
    // Agregar evento al formulario
    document.getElementById('formPresupuesto').addEventListener('submit', function(e) {
        e.preventDefault();
        registrarTransferenciaGobierno();
    });
}

// ============================================
// FUNCIÓN: REGISTRAR TRANSFERENCIA DEL GOBIERNO
// ============================================
function registrarTransferenciaGobierno() {
    const fecha = document.getElementById('fechaTransferencia').value;
    const comprobante = document.getElementById('numeroComprobante').value;
    const concepto = document.getElementById('conceptoTransferencia').value;
    const monto = parseFloat(document.getElementById('montoTransferencia').value);
    
    if (!fecha || !comprobante || !concepto || !monto || monto <= 0) {
        alert('⚠️ Por favor completa todos los campos correctamente');
        return;
    }
    
    // Aumentar saldo bancario
    saldoBanco += monto;
    
    // Generar número de asiento
    const numAsiento = (hojas.diario.length + 1);
    
    // Registrar en Libro Diario
    // Asiento 1: DEBE Bancos
    hojas.diario.push({
        Fecha: fecha,
        Num_Asiento: numAsiento,
        Descripción: `${concepto} - ${comprobante}`,
        Cuenta: 'Bancos',
        Debe: monto,
        Haber: 0
    });
    
    // Asiento 2: HABER Transferencias del Gobierno
    hojas.diario.push({
        Fecha: fecha,
        Num_Asiento: numAsiento,
        Descripción: `${concepto} - ${comprobante}`,
        Cuenta: 'Transferencias del Gobierno',
        Debe: 0,
        Haber: monto
    });
    
    console.log('✅ Transferencia registrada:', {fecha, comprobante, monto, saldoBanco});
    
    alert(`✅ Transferencia registrada correctamente\n\nMonto: ${formatearDinero(monto)}\nNuevo saldo en bancos: ${formatearDinero(saldoBanco)}`);
    
    // Volver al dashboard
    document.getElementById('contenidoDinamico').innerHTML = '';
    mostrarDashboard();
}

// ============================================
// FUNCIÓN: VER PAGOS A PROVEEDORES
// ============================================
function verPagosProveedores() {
    console.log('💳 Mostrando módulo de pagos...');
    
    // Calcular deuda por proveedor CORRECTAMENTE
    const deudaPorProveedor = {};
    
    // PASO 1: Sumar compras por proveedor (calculando bien el total)
    hojas.compras.forEach(compra => {
        const proveedor = compra.Proveedor;
        
        // ✅ CALCULAR TOTAL CORRECTAMENTE
        const subtotal = (compra.Cantidad || 0) * (compra.Precio_Unit || 0);
        const iva = subtotal * 0.13;
        const totalConIVA = subtotal + iva;
        
        if (!deudaPorProveedor[proveedor]) {
            deudaPorProveedor[proveedor] = {
                nombre: proveedor,
                facturas: [],
                totalComprado: 0,
                totalPagado: 0,
                deudaPendiente: 0
            };
        }
        
        deudaPorProveedor[proveedor].facturas.push({
            numFactura: compra.Num_Factura,
            fecha: compra.Fecha,
            medicamento: compra.Nombre_Med,
            monto: totalConIVA
        });
        
        deudaPorProveedor[proveedor].totalComprado += totalConIVA;
    });
    
    // PASO 2: Restar pagos realizados
    hojas.diario.forEach(asiento => {
        if (asiento.Cuenta === 'Cuentas por Pagar' && asiento.Debe > 0) {
            const descripcion = asiento.Descripción || '';
            
            // Buscar proveedor en la descripción
            for (const nombreProveedor in deudaPorProveedor) {
                if (descripcion.includes(nombreProveedor)) {
                    deudaPorProveedor[nombreProveedor].totalPagado += asiento.Debe;
                    break;
                }
            }
        }
    });
    
    // PASO 3: Calcular deuda pendiente y eliminar proveedores pagados
    for (const proveedor in deudaPorProveedor) {
        const datos = deudaPorProveedor[proveedor];
        datos.deudaPendiente = datos.totalComprado - datos.totalPagado;
        
        // Si ya pagó todo, eliminar
        if (datos.deudaPendiente <= 0.01) {
            delete deudaPorProveedor[proveedor];
        }
    }
    
    // Calcular total de cuentas por pagar
    const totalCuentasPorPagar = Object.values(deudaPorProveedor)
        .reduce((sum, p) => sum + p.deudaPendiente, 0);
    
    console.log('📊 Total Cuentas por Pagar:', totalCuentasPorPagar);
    
    let html = `
        <div class="reporte-detalle">
            <h2>💳 Pago a Proveedores</h2>
            <p>Gestiona los pagos de las compras realizadas a crédito</p>
            
            <!-- Debug info -->
            <div style="background:#e3f2fd; padding:10px; margin:10px 0; font-size:0.85em; border-radius:5px;">
                <strong>🔍 Debug:</strong> Total calculado: ${formatearDinero(totalCuentasPorPagar)} | 
                Saldo Banco: ${formatearDinero(saldoBanco)}
            </div>
            
            <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:20px; margin:20px 0;">
                <div style="background:#e3f2fd; padding:20px; border-radius:8px; text-align:center;">
                    <h4>💰 Saldo Disponible en Bancos</h4>
                    <p style="font-size:2em; font-weight:bold; color:${saldoBanco > 0 ? '#1976d2' : '#d32f2f'}; margin:10px 0;">
                        ${formatearDinero(saldoBanco)}
                    </p>
                </div>
                <div style="background:#ffebee; padding:20px; border-radius:8px; text-align:center;">
                    <h4>📋 Total Cuentas por Pagar</h4>
                    <p style="font-size:2em; font-weight:bold; color:#d32f2f; margin:10px 0;">
                        ${formatearDinero(totalCuentasPorPagar)}
                    </p>
                </div>
            </div>
            
            ${saldoBanco === 0 ? `
                <div style="background:#fff3cd; padding:20px; border-radius:8px; margin:20px 0; border-left:5px solid #ffc107;">
                    <h4>⚠️ No hay fondos disponibles</h4>
                    <p>Antes de pagar a proveedores, debes registrar una transferencia del gobierno.</p>
                    <button onclick="inicializarPresupuesto()" class="btn-success">
                        💰 Registrar Transferencia del Gobierno
                    </button>
                </div>
            ` : ''}
            
            <h3>Proveedores con Deudas Pendientes:</h3>
            
            <div id="listaProveedores">
    `;
    
    if (Object.keys(deudaPorProveedor).length === 0) {
        html += `
            <div style="background:#d4edda; padding:30px; border-radius:8px; text-align:center;">
                <h3>✅ No hay deudas pendientes</h3>
                <p>Todos los proveedores han sido pagados</p>
            </div>
        `;
    } else {
        Object.values(deudaPorProveedor).forEach(proveedor => {
            const puedePagar = saldoBanco >= proveedor.deudaPendiente;
            const botonDeshabilitado = !puedePagar;
            
            html += `
                <div class="tarjeta-proveedor" style="background:white; border:2px solid ${puedePagar ? '#4caf50' : '#ffcdd2'}; border-radius:10px; padding:20px; margin-bottom:20px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <h4 style="margin:0; color:#667eea;">🏢 ${proveedor.nombre}</h4>
                            <p style="margin:5px 0; color:#666;">
                                ${proveedor.facturas.length} factura(s) pendiente(s)
                            </p>
                            ${proveedor.totalPagado > 0 ? `
                                <p style="margin:5px 0; color:#4caf50; font-size:0.9em;">
                                    ✅ Ya pagado: ${formatearDinero(proveedor.totalPagado)}
                                </p>
                            ` : ''}
                        </div>
                        <div style="text-align:right;">
                            <p style="font-size:1.5em; font-weight:bold; color:#d32f2f; margin:0;">
                                ${formatearDinero(proveedor.deudaPendiente)}
                            </p>
                            <button onclick="pagarProveedor('${proveedor.nombre.replace(/'/g, "\\'")}', ${proveedor.deudaPendiente})" 
                                    ${botonDeshabilitado ? 'disabled' : ''}
                                    style="margin-top:10px; padding:10px 20px; border:none; border-radius:5px; font-size:1em; cursor:${botonDeshabilitado ? 'not-allowed' : 'pointer'}; 
                                           background:${botonDeshabilitado ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}; 
                                           color:white; font-weight:bold;">
                                ${puedePagar ? '💰 Pagar' : '❌ Fondos Insuficientes'}
                            </button>
                        </div>
                    </div>
                    
                    <details style="margin-top:15px;">
                        <summary style="cursor:pointer; font-weight:bold; color:#667eea;">
                            Ver facturas detalladas
                        </summary>
                        <table style="width:100%; margin-top:10px; font-size:0.9em; border-collapse:collapse;">
                            <thead>
                                <tr style="background:#f5f5f5;">
                                    <th style="padding:8px; text-align:left; border:1px solid #ddd;">Fecha</th>
                                    <th style="padding:8px; text-align:left; border:1px solid #ddd;">Factura</th>
                                    <th style="padding:8px; text-align:left; border:1px solid #ddd;">Medicamento</th>
                                    <th style="padding:8px; text-align:right; border:1px solid #ddd;">Monto</th>
                                </tr>
                            </thead>
                            <tbody>
            `;
            
            proveedor.facturas.forEach(factura => {
                html += `
                    <tr>
                        <td style="padding:8px; border:1px solid #ddd;">${factura.fecha}</td>
                        <td style="padding:8px; border:1px solid #ddd;">${factura.numFactura}</td>
                        <td style="padding:8px; border:1px solid #ddd;">${factura.medicamento}</td>
                        <td style="padding:8px; text-align:right; border:1px solid #ddd;">${formatearDinero(factura.monto)}</td>
                    </tr>
                `;
            });
            
            html += `
                            </tbody>
                            <tfoot>
                                <tr style="background:#667eea; color:white; font-weight:bold;">
                                    <td colspan="3" style="padding:8px; border:1px solid #ddd;">TOTAL ADEUDADO</td>
                                    <td style="padding:8px; text-align:right; border:1px solid #ddd;">${formatearDinero(proveedor.deudaPendiente)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </details>
                </div>
            `;
        });
    }
    
    html += `
            </div>
            
            <div style="text-align:center; margin-top:30px;">
                <button onclick="document.getElementById('contenidoDinamico').innerHTML=''; mostrarDashboard()">
                    ← Volver al Dashboard
                </button>
                <button onclick="debugCuentasPorPagar()" style="margin-left:10px; background:#ff9800; color:white; border:none; padding:10px 20px; border-radius:5px; cursor:pointer;">
                    🔍 Ver Debug en Consola
                </button>
                ${saldoBanco === 0 ? `
                    <button onclick="inicializarPresupuesto()" class="btn-success" style="margin-left:10px;">
                        💰 Registrar Transferencia
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    document.getElementById('contenidoDinamico').innerHTML = html;
}

// ============================================
// FUNCIÓN: PAGAR A UN PROVEEDOR
// ============================================
function pagarProveedor(nombreProveedor, montoDeuda) {
    console.log('💳 Procesando pago a:', nombreProveedor);
    
    // Validar saldo
    if (saldoBanco < montoDeuda) {
        alert(`❌ Saldo insuficiente\n\nSaldo disponible: ${formatearDinero(saldoBanco)}\nMonto requerido: ${formatearDinero(montoDeuda)}`);
        return;
    }
    
    // Confirmar pago
    const confirmar = confirm(
        `¿Confirmar pago a ${nombreProveedor}?\n\n` +
        `Monto a pagar: ${formatearDinero(montoDeuda)}\n` +
        `Saldo actual: ${formatearDinero(saldoBanco)}\n` +
        `Saldo después del pago: ${formatearDinero(saldoBanco - montoDeuda)}`
    );
    
    if (!confirmar) return;
    
    // Obtener fecha actual
    const fechaHoy = new Date().toISOString().split('T')[0];
    
    // Generar número de asiento
    const numAsiento = (hojas.diario.length / 2) + 1;
    
    // Registrar en Libro Diario
    // Asiento 1: DEBE Cuentas por Pagar
    hojas.diario.push({
        Fecha: fechaHoy,
        Num_Asiento: numAsiento,
        Descripción: `Pago a ${nombreProveedor}`,
        Cuenta: 'Cuentas por Pagar',
        Debe: montoDeuda,
        Haber: 0
    });
    
    // Asiento 2: HABER Bancos
    hojas.diario.push({
        Fecha: fechaHoy,
        Num_Asiento: numAsiento,
        Descripción: `Pago a ${nombreProveedor}`,
        Cuenta: 'Bancos',
        Debe: 0,
        Haber: montoDeuda
    });
    
    // Disminuir saldo bancario
    saldoBanco -= montoDeuda;
    
    console.log('✅ Pago registrado:', {
        proveedor: nombreProveedor,
        monto: montoDeuda,
        nuevoSaldo: saldoBanco
    });
    
    alert(
        `✅ Pago registrado exitosamente\n\n` +
        `Proveedor: ${nombreProveedor}\n` +
        `Monto pagado: ${formatearDinero(montoDeuda)}\n` +
        `Nuevo saldo en bancos: ${formatearDinero(saldoBanco)}`
    );
    
    // Recargar vista
    verPagosProveedores();
}

// ============================================
// FUNCIÓN: VER ESTADO DE CUENTA BANCARIA
// ============================================
function verEstadoCuentaBancaria() {
    console.log('🏦 Generando estado de cuenta bancaria...');
    
    // Filtrar movimientos de la cuenta Bancos
    const movimientosBanco = hojas.diario.filter(
        asiento => asiento.Cuenta === 'Bancos'
    ).sort((a, b) => new Date(a.Fecha) - new Date(b.Fecha));
    
    let saldoAcumulado = 0;
    
    let html = `
        <div class="reporte-detalle">
            <h2>🏦 Estado de Cuenta Bancaria</h2>
            <p>Movimientos de la cuenta Bancos del MINSAL</p>
            
            <div style="background:#e3f2fd; padding:20px; border-radius:8px; margin:20px 0; text-align:center;">
                <h3>💰 Saldo Actual: ${formatearDinero(saldoBanco)}</h3>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>N° Asiento</th>
                        <th>Descripción</th>
                        <th>Depósitos</th>
                        <th>Retiros</th>
                        <th>Saldo</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    if (movimientosBanco.length === 0) {
        html += `
            <tr>
                <td colspan="6" style="text-align:center; padding:30px; color:#999;">
                    No hay movimientos bancarios registrados
                </td>
            </tr>
        `;
    } else {
        movimientosBanco.forEach(mov => {
            const esDeposito = mov.Debe > 0;
            saldoAcumulado += (mov.Debe - mov.Haber);
            
            html += `
                <tr style="background:${esDeposito ? '#e8f5e9' : '#ffebee'};">
                    <td>${mov.Fecha}</td>
                    <td>${mov.Num_Asiento}</td>
                    <td>${mov.Descripción}</td>
                    <td style="text-align:right; color:green; font-weight:bold;">
                        ${esDeposito ? formatearDinero(mov.Debe) : '-'}
                    </td>
                    <td style="text-align:right; color:red; font-weight:bold;">
                        ${!esDeposito ? formatearDinero(mov.Haber) : '-'}
                    </td>
                    <td style="text-align:right; font-weight:bold;">
                        ${formatearDinero(saldoAcumulado)}
                    </td>
                </tr>
            `;
        });
        
        // Totales
        const totalDepositos = movimientosBanco
            .filter(m => m.Debe > 0)
            .reduce((sum, m) => sum + m.Debe, 0);
        
        const totalRetiros = movimientosBanco
            .filter(m => m.Haber > 0)
            .reduce((sum, m) => sum + m.Haber, 0);
        
        html += `
            <tr style="background:#667eea; color:white; font-weight:bold;">
                <td colspan="3">TOTALES</td>
                <td style="text-align:right;">${formatearDinero(totalDepositos)}</td>
                <td style="text-align:right;">${formatearDinero(totalRetiros)}</td>
                <td style="text-align:right;">${formatearDinero(saldoBanco)}</td>
            </tr>
        `;
    }
    
    html += `
                </tbody>
            </table>
            
            <div style="background:#fff3cd; padding:20px; border-radius:8px; margin-top:20px;">
                <h4>📊 Resumen:</h4>
                <ul>
                    <li><strong>Saldo disponible:</strong> ${formatearDinero(saldoBanco)}</li>
                    <li><strong>Total movimientos:</strong> ${movimientosBanco.length}</li>
                </ul>
            </div>
            
            <div style="text-align:center; margin-top:30px;">
                <button onclick="document.getElementById('contenidoDinamico').innerHTML=''; mostrarDashboard()">
                    ← Volver
                </button>
                <button class="btn-success" onclick="window.print()">
                    🖨️ Imprimir Estado de Cuenta
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('contenidoDinamico').innerHTML = html;
}