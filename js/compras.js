// ============================================
// REGENERAR ASIENTOS DESDE COMPRAS EXISTENTES
// ============================================
function regenerarAsientosContables() {
    if (!hojas.compras || hojas.compras.length === 0) {
        alert('⚠️ No hay compras registradas para procesar');
        return;
    }
    
    const confirmar = confirm(
        `🔄 REGENERAR ASIENTOS CONTABLES\n\n` +
        `Se encontraron ${hojas.compras.length} compras registradas.\n\n` +
        `Esta acción:\n` +
        `• Borrará todos los asientos del Libro Diario actual\n` +
        `• Generará nuevos asientos para cada compra\n` +
        `• Recalculará el Libro Mayor\n\n` +
        `¿Desea continuar?`
    );
    
    if (!confirmar) return;
    
    try {
        // 1. Limpiar libro diario actual
        hojas.diario = [];
        
        let asientosGenerados = 0;
        let numAsiento = 1;
        
        // 2. Por cada compra, generar 3 asientos
        hojas.compras.forEach((compra) => {
            const subtotal = parseFloat(compra.Subtotal) || 0;
            const iva = parseFloat(compra.IVA_13) || 0;
            const total = parseFloat(compra.Total) || 0;
            
            // Validar que los datos sean correctos
            if (subtotal === 0 || total === 0) {
                console.warn(`⚠️ Compra con valores en cero:`, compra);
                return; // Skip esta compra
            }
            
            const descripcion = `Compra ${compra.Nombre_Med} - Fact. ${compra.Num_Factura}`;
            
            // Asiento 1: Inventario (DEBE)
            hojas.diario.push({
                Fecha: compra.Fecha,
                Num_Asiento: numAsiento,
                Descripción: descripcion,
                Cuenta: 'Inventario de Medicamentos',
                Debe: parseFloat(subtotal.toFixed(2)),
                Haber: 0
            });
            
            // Asiento 2: IVA (DEBE)
            hojas.diario.push({
                Fecha: compra.Fecha,
                Num_Asiento: numAsiento,
                Descripción: descripcion,
                Cuenta: 'IVA Crédito Fiscal',
                Debe: parseFloat(iva.toFixed(2)),
                Haber: 0
            });
            
            // Asiento 3: Cuentas por Pagar (HABER)
            hojas.diario.push({
                Fecha: compra.Fecha,
                Num_Asiento: numAsiento,
                Descripción: descripcion,
                Cuenta: 'Cuentas por Pagar',
                Debe: 0,
                Haber: parseFloat(total.toFixed(2))
            });
            
            asientosGenerados += 3;
            numAsiento++;
        });
        
        console.log(`✅ Asientos regenerados: ${asientosGenerados}`);
        
        // 3. Procesar salidas/despachos si existen
        if (hojas.salidas && hojas.salidas.length > 0) {
            hojas.salidas.forEach((salida) => {
                const costoTotal = parseFloat(salida.Costo_Total) || 0;
                
                if (costoTotal === 0) {
                    console.warn(`⚠️ Salida con costo en cero:`, salida);
                    return;
                }
                
                const descripcion = `Despacho ${salida.Hospital} - ${salida.Num_Despacho}`;
                
                // Asiento 1: Costo de Medicamentos (DEBE)
                hojas.diario.push({
                    Fecha: salida.Fecha,
                    Num_Asiento: numAsiento,
                    Descripción: descripcion,
                    Cuenta: 'Costo de Medicamentos Despachados',
                    Debe: parseFloat(costoTotal.toFixed(2)),
                    Haber: 0
                });
                
                // Asiento 2: Inventario (HABER)
                hojas.diario.push({
                    Fecha: salida.Fecha,
                    Num_Asiento: numAsiento,
                    Descripción: descripcion,
                    Cuenta: 'Inventario de Medicamentos',
                    Debe: 0,
                    Haber: parseFloat(costoTotal.toFixed(2))
                });
                
                asientosGenerados += 2;
                numAsiento++;
            });
        }
        
        // 4. Actualizar todo
        if (typeof actualizarLibroMayor === 'function') actualizarLibroMayor();
        if (typeof guardarExcel === 'function') guardarExcel();
        
        mostrarDashboard();
        
        alert(
            `✅ ASIENTOS REGENERADOS EXITOSAMENTE\n\n` +
            `📊 Resumen:\n` +
            `• Compras procesadas: ${hojas.compras.length}\n` +
            `• Salidas procesadas: ${hojas.salidas ? hojas.salidas.length : 0}\n` +
            `• Total asientos generados: ${asientosGenerados}\n\n` +
            `✅ El Libro Diario y Mayor han sido actualizados.`
        );
        
    } catch (error) {
        console.error('❌ Error al regenerar asientos:', error);
        alert('❌ Error al regenerar asientos:\n' + error.message);
    }
}

// ============================================
// MAPEO: MEDICAMENTO → PROVEEDOR
// ============================================
const medicamentoProveedor = {
    'MED-001': 'Laboratorios Unidos SA',
    'MED-002': 'Farma Central',
    'MED-003': 'Distribuidora Médica',
    'MED-004': 'Droguería El Salvador',
    'MED-005': 'BioPharma S.A. de C.V.',
    'MED-006': 'Laboratorios Lopez',
    'MED-007': 'Laboratorios Suizos',
    'MED-008': 'Farmacéutica Panamericana',
    'MED-009': 'Laboratorios Cofasa',
    'MED-010': 'Droguería Santa Lucía',
    'MED-011': 'Laboratorios Bonima',
    'MED-012': 'Farmadistr S.A.',
    'MED-013': 'Laboratorios Stein',
    'MED-014': 'Distribuidora Farmacéutica del Norte',
    'MED-015': 'Laboratorios Pailyn',
    'MED-016': 'Laboratorios Baxter',
    'MED-017': 'Droguería Farmedic',
    'MED-018': 'Laboratorios Chinoin',
    'MED-019': 'Medisurv S.A. de C.V.',
    'MED-020': 'Laboratorios Baxter'
};

// ============================================
// GENERAR NÚMERO DE FACTURA AUTOMÁTICO
// ============================================
function generarNumeroFactura() {
    let ultimoNum = 0;
    
    hojas.compras.forEach(compra => {
        const numFactura = compra.Num_Factura || '';
        const match = numFactura.match(/F-(\d+)/);
        if (match) {
            const num = parseInt(match[1]);
            if (num > ultimoNum) ultimoNum = num;
        }
    });
    
    const nuevoNum = ultimoNum + 1;
    return `F-${String(nuevoNum).padStart(6, '0')}`;
}


// ============================================
// GENERAR NÚMERO DE LOTE AUTOMÁTICO
// ============================================
function generarNumeroLote() {
    const anioActual = new Date().getFullYear();
    let ultimoNum = 0;
    
    // Buscar el último número de lote del año actual
    hojas.inventario.forEach(lote => {
        const numLote = lote.Num_Lote || '';
        // Buscar patrón: LOT-2025-001, LOT-2025-002, etc.
        const match = numLote.match(/LOT-(\d{4})-(\d+)/);
        
        if (match) {
            const anioLote = parseInt(match[1]);
            const numSecuencial = parseInt(match[2]);
            
            // Solo contar lotes del año actual
            if (anioLote === anioActual && numSecuencial > ultimoNum) {
                ultimoNum = numSecuencial;
            }
        }
    });
    
    // Incrementar y formatear con 3 dígitos
    const nuevoNum = ultimoNum + 1;
    return `LOT-${anioActual}-${String(nuevoNum).padStart(3, '0')}`;
}

// ============================================
// ACTUALIZAR INFO AL SELECCIONAR MEDICAMENTO
// ============================================
function actualizarInfoCompra() {
    const select = document.getElementById('medicamento');
    if (!select) return;
    
    const codigoMed = select.value;
    
    if (!codigoMed) {
        document.getElementById('proveedor').value = '';
        document.getElementById('precioUnit').value = '';
        document.getElementById('infoMedicamento').style.display = 'none';
        return;
    }
    
    const medicamento = hojas.catalogo.find(m => m.Código === codigoMed);
    if (!medicamento) return;
    
    // Asignar proveedor automáticamente
    const proveedor = medicamentoProveedor[codigoMed] || 'Proveedor no asignado';
    document.getElementById('proveedor').value = proveedor;
    
    // Asignar precio unitario (con 2 decimales)
    const precioUnit = (medicamento.Precio_Unit || 0).toFixed(2);
    document.getElementById('precioUnit').value = precioUnit;
    
    // Calcular stock disponible
    const stockTotal = hojas.inventario
        .filter(l => l.Código_Med === codigoMed)
        .reduce((sum, l) => sum + (l.Cant_Actual || 0), 0);
    
    // Mostrar info
    const html = `
        <h4 style="margin-top:0;">ℹ️ Información del Medicamento</h4>
        <p><strong>📦 Medicamento:</strong> ${medicamento.Nombre}</p>
        <p><strong>🏭 Proveedor asignado:</strong> ${proveedor}</p>
        <p><strong>💰 Precio unitario:</strong> $${precioUnit}</p>
        <p><strong>📊 Stock actual:</strong> ${formatearNumero(stockTotal)} unidades</p>
        <p><strong>📈 Stock mínimo:</strong> ${formatearNumero(medicamento.Stock_Min || 0)}</p>
        <p><strong>📉 Stock máximo:</strong> ${formatearNumero(medicamento.Stock_Max || 0)}</p>
    `;
    
    document.getElementById('infoMedicamento').innerHTML = html;
    document.getElementById('infoMedicamento').style.display = 'block';
    
    // Recalcular totales
    calcularTotalCompra();
}

// ============================================
// CALCULAR TOTAL DE LA COMPRA
// ============================================
function calcularTotalCompra() {
    const cantidad = parseFloat(document.getElementById('cantidadCompra')?.value) || 0;
    const precio = parseFloat(document.getElementById('precioUnit')?.value) || 0;
    
    if (cantidad <= 0 || precio <= 0) {
        document.getElementById('subtotalCompra').textContent = '$0.00';
        document.getElementById('ivaCompra').textContent = '$0.00';
        document.getElementById('totalCompra').textContent = '$0.00';
        return;
    }
    
    const subtotal = cantidad * precio;
    const iva = subtotal * 0.13;
    const total = subtotal + iva;
    
    document.getElementById('subtotalCompra').textContent = formatearDinero(subtotal);
    document.getElementById('ivaCompra').textContent = formatearDinero(iva);
    document.getElementById('totalCompra').textContent = formatearDinero(total);
}

// ============================================
// MOSTRAR FORMULARIO DE COMPRA
// ============================================
function mostrarFormularioCompra() {
    console.log('📥 Mostrando formulario de compras...');
    
    const numFacturaAuto = generarNumeroFactura();
    const numloteAuto= generarNumeroLote();
    const fechaHoy = new Date().toISOString().slice(0, 10);
    
    const html = `
        <div class="formulario-compra">
            <h2>📥 Registrar Nueva Compra</h2>
            
            <form id="formCompra" onsubmit="return false;">
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Fecha de Compra *</label>
                        <input type="date" id="fechaCompra" value="${fechaHoy}" required>
                    </div>
                    
                    <div class="form-group">
                        <label>N° de Factura *</label>
                        <input type="text" 
                               id="numFactura" 
                               value="${numFacturaAuto}" 
                               readonly 
                               style="background:#f0f0f0; cursor:not-allowed;"
                               required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="proveedor">Proveedor *</label>
                    <input type="text" 
                        id="proveedor" 
                        readonly 
                        value=""
                        placeholder="Se asignará al seleccionar medicamento"
                        style="background:#f0f0f0; cursor:not-allowed;"
                        required>
                </div>
                
                <div class="form-group">
                    <label>Medicamento *</label>
                    <select id="medicamento" required>
                        <option value="">-- Seleccionar --</option>
                        ${hojas.catalogo.map(med => 
                            `<option value="${med.Código}">${med.Código} - ${med.Nombre}</option>`
                        ).join('')}
                    </select>
                </div>
                
                <!-- Info del medicamento -->
                <div id="infoMedicamento" style="display:none; background:#e3f2fd; padding:15px; border-radius:8px; margin:15px 0;"></div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Cantidad *</label>
                        <input type="number" id="cantidadCompra" min="1" placeholder="1000" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Precio Unitario *</label>
                        <input type="text" 
                            id="precioUnit" 
                            readonly 
                            value=""
                            placeholder="Se asignará automáticamente"
                            style="background:#f0f0f0; cursor:not-allowed; text-align:right;"
                            required>
                    </div>
                </div>
                
                <div class="form-row">
                  <div class="form-group">
                    <label>N° de Lote *</label>
                    <input type="text" 
                        id="numLote" 
                        value="${generarNumeroLote()}" 
                        readonly 
                        style="background:#f0f0f0; cursor:not-allowed;"
                        required>
                </div>
                                    
                    <div class="form-group">
                        <label>Fecha de Fabricación *</label>
                        <input type="date" id="fechaFab" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Fecha de Vencimiento *</label>
                    <input type="date" id="fechaVenc" required>
                </div>
                
                <!-- Resumen de la compra -->
                <div style="background:#fff3cd; padding:20px; border-radius:8px; margin:20px 0;">
                    <h4 style="margin-top:0;">💰 Resumen de la Compra</h4>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size:1.1em;">
                        <div>Subtotal:</div>
                        <div style="text-align:right; font-weight:bold;" id="subtotalCompra">$0.00</div>
                        <div>IVA (13%):</div>
                        <div style="text-align:right; font-weight:bold;" id="ivaCompra">$0.00</div>
                        <div style="border-top:2px solid #333; padding-top:10px;">TOTAL:</div>
                        <div style="border-top:2px solid #333; padding-top:10px; text-align:right; font-weight:bold; font-size:1.3em; color:#28a745;" id="totalCompra">$0.00</div>
                    </div>
                </div>
                
                <div style="text-align:center; margin-top:30px;">
                    <button type="button" class="btn-secondary" onclick="cancelarCompra()">❌ Cancelar</button>
                    <button type="button" class="btn-success" onclick="registrarCompra()">✅ Registrar Compra</button>
                </div>
                
            </form>
        </div>
    `;
    
    document.getElementById('contenidoDinamico').innerHTML = html;
    
    // Event listeners DESPUÉS de insertar HTML
    setTimeout(() => {
        const selectMed = document.getElementById('medicamento');
        const inputCantidad = document.getElementById('cantidadCompra');
        
        if (selectMed) {
            selectMed.addEventListener('change', actualizarInfoCompra);
        }
        
        if (inputCantidad) {
            inputCantidad.addEventListener('input', calcularTotalCompra);
        }
    }, 100);
}

// ============================================
// REGISTRAR LA COMPRA
// ============================================
function registrarCompra() {
    const datos = {
        fecha: document.getElementById('fechaCompra').value,
        numFactura: document.getElementById('numFactura').value.trim(),
        proveedor: document.getElementById('proveedor').value,
        codigoMed: document.getElementById('medicamento').value,
        cantidad: parseInt(document.getElementById('cantidadCompra').value),
        precio: parseFloat(document.getElementById('precioUnit').value),
        numLote: document.getElementById('numLote').value.trim(),
        fechaFab: document.getElementById('fechaFab').value,
        fechaVenc: document.getElementById('fechaVenc').value
    };
    
    // VALIDACIONES
    if (!datos.numFactura) {
        alert('❌ El número de factura es obligatorio');
        return;
    }
    
    if (!datos.proveedor || datos.proveedor === 'Se asignará al seleccionar medicamento') {
        alert('❌ Debe seleccionar un medicamento primero');
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
    
    if (isNaN(datos.precio) || datos.precio <= 0) {
        alert('❌ El precio debe ser mayor a 0');
        return;
    }
    
    if (!datos.numLote) {
        alert('❌ El número de lote es obligatorio');
        return;
    }
    
    // Validar fechas
    const fechaFab = new Date(datos.fechaFab);
    const fechaVenc = new Date(datos.fechaVenc);
    
    if (fechaVenc <= fechaFab) {
        alert('❌ La fecha de vencimiento debe ser posterior a la de fabricación');
        return;
    }
    
    const mesesDiferencia = (fechaVenc - fechaFab) / (1000 * 60 * 60 * 24 * 30);
    if (mesesDiferencia < 6) {
        const confirmar = confirm('⚠️ El medicamento vence en menos de 6 meses.\n¿Desea continuar?');
        if (!confirmar) return;
    }
    
    const medicamento = buscarMedicamento(datos.codigoMed);
    const subtotal = datos.cantidad * datos.precio;
    const iva = subtotal * 0.13;
    const total = subtotal + iva;
    
    console.log('💾 Registrando compra...', datos);
    
    try {
        // 1. Agregar a inventario
        const nuevoLote = {
            ID_Lote: generarIDLote(),
            Código_Med: datos.codigoMed,
            Nombre_Med: medicamento.Nombre,
            Num_Lote: datos.numLote,
            Cant_Inicial: datos.cantidad,
            Cant_Actual: datos.cantidad,
            Fecha_Fab: formatearFecha(new Date(datos.fechaFab)),
            Fecha_Venc: formatearFecha(new Date(datos.fechaVenc)),
            Costo_Unit: parseFloat(datos.precio),
            Estado: 'Activo'
        };
        hojas.inventario.push(nuevoLote);
        
        // 2. Agregar a libro de compras
        hojas.compras.push({
            Fecha: formatearFecha(new Date(datos.fecha)),
            Num_Factura: datos.numFactura,
            Proveedor: datos.proveedor,
            Código_Med: datos.codigoMed,
            Nombre_Med: medicamento.Nombre,
            Num_Lote: datos.numLote,
            Cantidad: datos.cantidad,
            Precio_Unit: parseFloat(datos.precio).toFixed(2),
            Subtotal: subtotal.toFixed(2),
            IVA_13: iva.toFixed(2),
            Total: total.toFixed(2)
        });
        
        // 3. Asientos contables
        const numAsiento = obtenerUltimoAsiento() + 1;
        const descripcion = `Compra ${medicamento.Nombre} - Fact. ${datos.numFactura}`;
        

        //Primero: Inventario (DEBE)
        hojas.diario.push({
            Fecha: formatearFecha(new Date(datos.fecha)),
            Num_Asiento: numAsiento,
            Descripción: descripcion,
            Cuenta: 'Inventario de Medicamentos',
            Debe: parseFloat(subtotal.toFixed(2)),
            Haber: 0
        });
        //SEGUNDO : IVA (DEBE)
        hojas.diario.push({
            Fecha: formatearFecha(new Date(datos.fecha)),
            Num_Asiento: numAsiento,
            Descripción: descripcion,
            Cuenta: 'IVA Crédito Fiscal',
            Debe: parseFloat(iva.toFixed(2)),
            Haber: 0
        });
        //Tercero: cuentas por pagar (haber)
        hojas.diario.push({
            Fecha: formatearFecha(new Date(datos.fecha)),
            Num_Asiento: numAsiento,
            Descripción: descripcion,
            Cuenta: 'Cuentas por Pagar',
            Debe: 0,
            Haber: parseFloat(total.toFixed(2))
        });
        
        console.log('✅ Compra registrada exitosamente');
        console.log(`📊 Asientos generados:
        DEBE Inventario: ${subtotal.toFixed(2)}
        DEBE IVA: ${iva.toFixed(2)}
        HABER Cuentas por Pagar: ${total.toFixed(2)}
        ✅ Balance: ${(subtotal + iva).toFixed(2)} = ${total.toFixed(2)}`);
        if (typeof recalcAll === 'function') recalcAll();
        if (typeof actualizarLibroMayor === 'function') actualizarLibroMayor();
        if (typeof guardarExcel === 'function') guardarExcel();
        
        mostrarDashboard();
        verificarAlertas();
        
        alert(`✅ Compra registrada exitosamente\n\n` +
              `Lote: ${nuevoLote.ID_Lote}\n` +
              `Medicamento: ${medicamento.Nombre}\n` +
              `Cantidad: ${formatearNumero(datos.cantidad)} unidades\n` +
            `Subtotal: ${formatearDinero(subtotal)}\n` +
              `IVA (4%): ${formatearDinero(iva)}\n` +
              `Total: ${formatearDinero(total)}\n\n` +
              `Se generaron 3 asientos contables.`);
        
        document.getElementById('contenidoDinamico').innerHTML = '';
        
    } catch (error) {
        console.error('❌ Error al registrar compra:', error);
        alert('❌ Error al registrar la compra:\n' + error.message);
    }
}

// ============================================
// CANCELAR COMPRA
// ============================================
function cancelarCompra() {
    if (confirm('¿Desea cancelar el registro de la compra?')) {
        document.getElementById('contenidoDinamico').innerHTML = '';
        mostrarDashboard();
    }
}