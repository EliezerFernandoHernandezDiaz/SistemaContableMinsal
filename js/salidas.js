// ============================================
// FUNCIÓN AUXILIAR: FORMATEAR FECHA + HORA
// ============================================
function formatearFechaHora(fecha) {
    const f = fecha instanceof Date ? fecha : new Date(fecha);
    
    const dia = String(f.getDate()).padStart(2, '0');
    const mes = String(f.getMonth() + 1).padStart(2, '0');
    const anio = f.getFullYear();
    
    const horas = String(f.getHours()).padStart(2, '0');
    const minutos = String(f.getMinutes()).padStart(2, '0');
    const segundos = String(f.getSeconds()).padStart(2, '0');
    
    return `${dia}/${mes}/${anio} ${horas}:${minutos}:${segundos}`;
}

// ============================================
// MÓDULO DE SALIDAS (CON PEPS)
// ============================================

function mostrarFormularioSalida() {
    console.log('📤 Mostrando formulario de salidas...');
    
    const html = `
        <div class="formulario-salida">
            <h2>📤 Registrar Nuevo Despacho</h2>
            
            <form id="formSalida" onsubmit="return false;">
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Fecha de Despacho *</label>
                        <input type="date" id="fechaSalida" value="${new Date().toISOString().slice(0,10)}" required>
                    </div>
                    
                    <div class="form-group">
                        <label>N° de Despacho *</label>
                        <input type="text" id="numDespacho" placeholder="D-00125" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Hospital Destino *</label>
                    <select id="hospitalDestino" required>
                        <option value="">-- Seleccionar --</option>
                        <option value="Hospital Rosales">Hospital Rosales</option>
                        <option value="Hospital Bloom">Hospital Bloom</option>
                        <option value="Hospital San Rafael">Hospital San Rafael</option>
                        <option value="Hospital Nacional Santa Ana">Hospital Nacional Santa Ana</option>
                        <option value="Hospital Nacional Sonsonate">Hospital Nacional Sonsonate</option>
                        <option value="Hospital Nacional San Miguel">Hospital Nacional San Miguel</option>
                        <option value="Hospital de Maternidad">Hospital de Maternidad</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Medicamento *</label>
                    <select id="medicamentoSalida" onchange="mostrarInfoSalida()" required>
                        <option value="">-- Seleccionar --</option>
                        ${hojas.catalogo.map(med => 
                            `<option value="${med.Código}">${med.Código} - ${med.Nombre}</option>`
                        ).join('')}
                    </select>
                </div>
                
                <!-- Info de disponibilidad -->
                <div id="infoDisponibilidad" style="display:none; background:#e3f2fd; padding:15px; border-radius:8px; margin:15px 0;">
                    <h4 style="margin-top:0;">📊 Disponibilidad</h4>
                    <div id="detallesDisponibilidad"></div>
                </div>
                
                <div class="form-group">
                    <label>Cantidad a Despachar *</label>
                    <input type="number" id="cantidadSalida" min="1" placeholder="150" onchange="calcularPEPS()" required>
                </div>
                
                <!-- Visualización de PEPS -->
                <div id="visualizacionPEPS" style="display:none; background:#fff3cd; padding:20px; border-radius:8px; margin:20px 0;">
                    <h4 style="margin-top:0;">🔄 Método PEPS - Lotes a Utilizar</h4>
                    <p style="margin-bottom:15px;">Se despacharán automáticamente los lotes más antiguos primero:</p>
                    <div id="lotesAPEPS"></div>
                    <div style="margin-top:15px; padding-top:15px; border-top:2px solid #333;">
                        <strong>Costo Total del Despacho:</strong> 
                        <span id="costoTotalSalida" style="font-size:1.3em; color:#28a745; font-weight:bold;">$0.00</span>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Responsable del Despacho *</label>
                    <input type="text" id="responsableSalida" placeholder="Dra. María López" required>
                </div>
                
                <div style="text-align:center; margin-top:30px;">
                    <button type="button" class="btn-secondary" onclick="cancelarSalida()">❌ Cancelar</button>
                    <button type="button" class="btn-danger" onclick="registrarSalida()">✅ Registrar Despacho</button>
                </div>
                
            </form>
        </div>
    `;
    
    document.getElementById('contenidoDinamico').innerHTML = html;
}

// ============================================
// MOSTRAR INFO DE DISPONIBILIDAD
// ============================================
function mostrarInfoSalida() {
    const codigoMed = document.getElementById('medicamentoSalida').value;
    
    if (!codigoMed) {
        document.getElementById('infoDisponibilidad').style.display = 'none';
        document.getElementById('visualizacionPEPS').style.display = 'none';
        return;
    }
    
    const medicamento = buscarMedicamento(codigoMed);
    
    // Calcular stock total disponible
    const lotesDisponibles = hojas.inventario
        .filter(lote => lote.Código_Med === codigoMed && lote.Cant_Actual > 0);
    
    const stockTotal = lotesDisponibles.reduce((sum, lote) => sum + (lote.Cant_Actual || 0), 0);
    
    let html = `
        <p><strong>Medicamento:</strong> ${medicamento.Nombre}</p>
        <p><strong>Stock Total Disponible:</strong> <span style="font-size:1.2em; font-weight:bold; color:${stockTotal > medicamento.Stock_Min ? 'green' : 'red'}">${stockTotal} unidades</span></p>
        <p><strong>Stock Mínimo:</strong> ${medicamento.Stock_Min} unidades</p>
        <p><strong>Lotes Disponibles:</strong> ${lotesDisponibles.length}</p>
    `;
    
    if (stockTotal === 0) {
        html += '<p style="color:red; font-weight:bold;">❌ Sin stock disponible - No se puede despachar</p>';
    } else if (stockTotal < medicamento.Stock_Min) {
        html += '<p style="color:orange; font-weight:bold;">⚠️ Stock por debajo del mínimo - Programar reabastecimiento</p>';
    } else {
        html += '<p style="color:green;">✅ Stock disponible para despacho</p>';
    }
    
    document.getElementById('detallesDisponibilidad').innerHTML = html;
    document.getElementById('infoDisponibilidad').style.display = 'block';
}

// ============================================
// CALCULAR PEPS Y VISUALIZAR
// ============================================
function calcularPEPS() {
    const codigoMed = document.getElementById('medicamentoSalida').value;
    const cantidadSolicitada = parseInt(document.getElementById('cantidadSalida').value) || 0;
    
    if (!codigoMed || cantidadSolicitada === 0) {
        document.getElementById('visualizacionPEPS').style.display = 'none';
        return;
    }
    
    const resultado = aplicarPEPS(codigoMed, cantidadSolicitada);
    
    if (resultado.error) {
        document.getElementById('visualizacionPEPS').style.display = 'none';
        alert('❌ ' + resultado.mensaje);
        return;
    }
    
    // Mostrar los lotes que se usarán
    let html = '';
    resultado.despachos.forEach((desp, index) => {
        html += `
            <div style="background:white; padding:12px; margin:8px 0; border-left:4px solid #28a745; border-radius:5px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong>Lote ${index + 1}:</strong> ${desp.numLote}<br>
                        <span style="font-size:0.9em; color:#666;">Vence: ${desp.fechaVenc}</span>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:1.2em; font-weight:bold;">${desp.cantidad} unidades</div>
                        <div style="color:#666;">$${desp.costoUnit.toFixed(2)} c/u = $${desp.costoTotal.toFixed(2)}</div>
                    </div>
                </div>
            </div>
        `;
    });
    
    document.getElementById('lotesAPEPS').innerHTML = html;
    document.getElementById('costoTotalSalida').textContent = '$' + resultado.costoTotal.toFixed(2);
    document.getElementById('visualizacionPEPS').style.display = 'block';
}

// ============================================
// APLICAR MÉTODO PEPS (VERSIÓN ROBUSTA)
// ============================================
function aplicarPEPS(codigoMed, cantidadSolicitada) {
    console.log('🔄 Aplicando PEPS para:', codigoMed, 'Cantidad:', cantidadSolicitada);
    
    // 1. Filtrar lotes disponibles del medicamento
    const lotesDisponibles = hojas.inventario
        .filter(lote => lote.Código_Med === codigoMed && lote.Cant_Actual > 0);
    
    if (lotesDisponibles.length === 0) {
        return {
            error: true,
            mensaje: 'No hay lotes disponibles para este medicamento'
        };
    }
    
    // 2. Ordenar por fecha de vencimiento (más antiguo primero - PEPS)
    lotesDisponibles.sort((a, b) => {
        // Validar fechas
        if (!a.Fecha_Venc || !b.Fecha_Venc) {
            console.warn('Lote sin fecha de vencimiento:', a.Fecha_Venc ? b : a);
            return 0;
        }
        
        try {
            let fechaA, fechaB;
            
            // Parsear fecha A
            if (typeof a.Fecha_Venc === 'string') {
                if (a.Fecha_Venc.includes('/')) {
                    const partesA = a.Fecha_Venc.split('/');
                    fechaA = new Date(partesA[2], partesA[1] - 1, partesA[0]);
                } else {
                    fechaA = new Date(a.Fecha_Venc);
                }
            } else {
                fechaA = new Date(a.Fecha_Venc);
            }
            
            // Parsear fecha B
            if (typeof b.Fecha_Venc === 'string') {
                if (b.Fecha_Venc.includes('/')) {
                    const partesB = b.Fecha_Venc.split('/');
                    fechaB = new Date(partesB[2], partesB[1] - 1, partesB[0]);
                } else {
                    fechaB = new Date(b.Fecha_Venc);
                }
            } else {
                fechaB = new Date(b.Fecha_Venc);
            }
            
            // Validar que las fechas sean válidas
            if (isNaN(fechaA.getTime()) || isNaN(fechaB.getTime())) {
                console.warn('Fecha inválida:', { fechaA, fechaB, loteA: a, loteB: b });
                return 0;
            }
            
            return fechaA - fechaB;
            
        } catch (error) {
            console.error('Error al ordenar fechas:', error, { loteA: a, loteB: b });
            return 0;
        }
    });
    
    console.log('✅ Lotes ordenados por PEPS:', lotesDisponibles.map(l => ({
        lote: l.Num_Lote,
        vence: l.Fecha_Venc,
        cantidad: l.Cant_Actual
    })));
    
    // 3. Verificar stock suficiente
    const stockTotal = lotesDisponibles.reduce((sum, lote) => sum + (lote.Cant_Actual || 0), 0);
    
    if (stockTotal < cantidadSolicitada) {
        return {
            error: true,
            mensaje: `Stock insuficiente. Disponible: ${stockTotal}, Solicitado: ${cantidadSolicitada}`
        };
    }
    
    // 4. Despachar lote por lote (PEPS)
    let restante = cantidadSolicitada;
    const despachos = [];
    
    for (let lote of lotesDisponibles) {
        if (restante === 0) break;
        
        const aTomar = Math.min(restante, lote.Cant_Actual);
        
        despachos.push({
            idLote: lote.ID_Lote,
            numLote: lote.Num_Lote,
            cantidad: aTomar,
            costoUnit: lote.Costo_Unit || 0,
            costoTotal: aTomar * (lote.Costo_Unit || 0),
            fechaVenc: lote.Fecha_Venc || 'Sin fecha'
        });
        
        restante -= aTomar;
    }
    
    const costoTotal = despachos.reduce((sum, d) => sum + d.costoTotal, 0);
    
    console.log('✅ PEPS calculado:', despachos);
    
    return {
        error: false,
        despachos: despachos,
        costoTotal: costoTotal
    };
}

// ============================================
// REGISTRAR SALIDA
// ============================================
// ============================================
// REGISTRAR SALIDA (VERSIÓN CORREGIDA)
// ============================================
function registrarSalida() {
    
    // 1. PRIMERO: Obtener datos del formulario
    const datos = {
        fecha: new Date(),
        numDespacho: document.getElementById('numDespacho').value.trim(),
        hospital: document.getElementById('hospitalDestino').value,
        codigoMed: document.getElementById('medicamentoSalida').value,
        cantidad: parseInt(document.getElementById('cantidadSalida').value),
        responsable: document.getElementById('responsableSalida').value.trim()
    };
    
    // 2. VALIDACIONES BÁSICAS
    if (!datos.numDespacho) {
        alert('❌ El número de despacho es obligatorio');
        return;
    }
    
    if (!datos.hospital) {
        alert('❌ Debe seleccionar un hospital destino');
        return;
    }
    
    if (!datos.codigoMed) {
        alert('❌ Debe seleccionar un medicamento');
        return;
    }
    
    if (isNaN(datos.cantidad) || datos.cantidad <= 0) {
        alert('❌ La cantidad debe ser mayor a 0');
        return;
    }
    
    if (!datos.responsable) {
        alert('❌ Debe indicar el responsable del despacho');
        return;
    }
    
    // 3. AHORA SÍ: Validar si hay stock suficiente
    const totalStock = hojas.inventario
        .filter(l => l.Código_Med === datos.codigoMed)
        .reduce((sum, l) => sum + (l.Cant_Actual || 0), 0);

    if (totalStock < datos.cantidad) {
        alert(`❌ No hay suficiente stock disponible.\nDisponible: ${totalStock} unidades\nSolicitado: ${datos.cantidad} unidades`);
        return;
    }
    
    console.log('📤 Registrando salida...', datos);
    
    try {
        // 4. Aplicar PEPS
        const resultado = aplicarPEPS(datos.codigoMed, datos.cantidad);
        
        if (resultado.error) {
            alert('❌ ' + resultado.mensaje);
            return;
        }
        
        const medicamento = buscarMedicamento(datos.codigoMed);
        
        // 5. Actualizar cantidades en Inventario_Lotes
        resultado.despachos.forEach(desp => {
            const lote = hojas.inventario.find(l => l.ID_Lote === desp.idLote);
            if (lote) {
                lote.Cant_Actual -= desp.cantidad;
                
                // Si se agotó, cambiar estado
                if (lote.Cant_Actual === 0) {
                    lote.Estado = 'Agotado';
                }
            }
        });
        
        // 6. Registrar cada despacho en Libro_Salidas
        resultado.despachos.forEach(desp => {
            hojas.salidas.push({
                Fecha: formatearFechaHora(datos.fecha),
                Num_Despacho: datos.numDespacho,
                Hospital_Destino: datos.hospital,
                Código_Med: datos.codigoMed,
                Nombre_Med: medicamento.Nombre,
                Num_Lote: desp.numLote,
                Cantidad: desp.cantidad,
                Costo_Unit: desp.costoUnit,
                Total: desp.costoTotal,
                Responsable: datos.responsable
            });
        });
        
        // 7. Generar asientos contables
        const numAsiento = obtenerUltimoAsiento() + 1;
        const descripcion = `Despacho ${datos.hospital} - ${datos.numDespacho}`;
        
        // Asiento 1: Debe - Costo de medicamentos despachados
        hojas.diario.push({
            Fecha: formatearFechaHora(datos.fecha),
            Num_Asiento: numAsiento,
            Descripción: descripcion, 
            Cuenta: 'Costo de medicamentos despachados', 
            Debe: resultado.costoTotal,
            Haber: 0
        });
        
        // Asiento 2: Haber - Inventario 
        hojas.diario.push({
            Fecha: formatearFechaHora(datos.fecha),
            Num_Asiento: numAsiento,
            Descripción: descripcion,
            Cuenta: 'Inventario de Medicamentos',
            Debe: 0,
            Haber: resultado.costoTotal
        });
        
        // 8. MOSTRAR resultado
        console.log('✅ Salida registrada exitosamente');
        console.log('  - Lotes utilizados:', resultado.despachos.length);
        console.log('  - Costo total: $' + resultado.costoTotal.toFixed(2));
        console.log('  - Asiento contable:', numAsiento);
        
        // 9. Actualizar dashboard y verificar alertas
        if (typeof recalcAll === 'function') recalcAll();
        if (typeof actualizarLibroMayor === 'function') actualizarLibroMayor();
        if (typeof guardarExcel === 'function') guardarExcel();
        
        mostrarDashboard();
        verificarAlertas();

        // 10. Mostrar confirmación al usuario 
        let mensaje = '✅ Despacho registrado exitosamente\n\n';
        mensaje += `🏥 Hospital: ${datos.hospital}\n`;
        mensaje += `💊 Medicamento: ${medicamento.Nombre}\n`;
        mensaje += `📦 Cantidad Total: ${datos.cantidad} unidades\n`;
        mensaje += `💰 Costo Total: $${resultado.costoTotal.toFixed(2)}\n\n`;
        mensaje += `📋 Lotes utilizados (PEPS):\n`;
        resultado.despachos.forEach((desp, index) => {
            mensaje += `  ${index + 1}. Lote ${desp.numLote}: ${desp.cantidad} und. × $${desp.costoUnit.toFixed(2)} = $${desp.costoTotal.toFixed(2)}\n`;
        });
        mensaje += `\n📊 Se generaron 2 asientos contables (#${numAsiento})`;

        alert(mensaje);
        
        // 11. Volver al dashboard
        document.getElementById('contenidoDinamico').innerHTML = '';
        
    } catch (error) {
        console.error('❌ Error al registrar salida:', error);
        alert('❌ Error al registrar el despacho:\n' + error.message);
    }
}

// ============================================
// CANCELAR LA SALIDA
// ============================================
function cancelarSalida() {
    const confirmar = confirm('¿Desea cancelar el registro del despacho?');
    if (confirmar) {
        document.getElementById('contenidoDinamico').innerHTML = '';
        mostrarDashboard();
    }
}
//Cancelar la salida 
function cancelarSalida(){
const confirmar = confirm('¿Desea cancelar el registro del despacho?');
if (confirmar) {
document.getElementById('contenidoDinamico').innerHTML = '';
}
}