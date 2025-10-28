// ============================================
// MÓDULO DE COMPRAS
// ============================================

function mostrarFormularioCompra() {
    console.log('📥 Mostrando formulario de compras...');
    
    const html = `
        <div class="formulario-compra">
            <h2>📥 Registrar Nueva Compra</h2>
            
            <form id="formCompra" onsubmit="return false;">
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Fecha de Compra *</label>
                        <input type="date" id="fechaCompra" value="${new Date().toISOString().slice(0,10)}" required>
                    </div>
                    
                    <div class="form-group">
                        <label>N° de Factura *</label>
                        <input type="text" id="numFactura" placeholder="F-001234" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Proveedor *</label>
                    <select id="proveedor" required>
                        <option value="">-- Seleccionar --</option>
                        <option value="Laboratorios Unidos SA">Laboratorios Unidos SA</option>
                        <option value="Farma Central">Farma Central</option>
                        <option value="Distribuidora Médica">Distribuidora Médica</option>
                        <option value="Pharma International">Pharma International</option>
                        <option value="Medicamentos y Equipos SA">Medicamentos y Equipos SA</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Medicamento *</label>
                    <select id="medicamentoCompra" onchange="mostrarInfoMedicamento()" required>
                        <option value="">-- Seleccionar --</option>
                        ${hojas.catalogo.map(med => 
                            `<option value="${med.Código}">${med.Código} - ${med.Nombre}</option>`
                        ).join('')}
                    </select>
                </div>
                
                <!-- Info del medicamento -->
                <div id="infoMedicamento" style="display:none; background:#e3f2fd; padding:15px; border-radius:8px; margin:15px 0;">
                    <h4 style="margin-top:0;">ℹ️ Información del Medicamento</h4>
                    <div id="detallesMedicamento"></div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>Cantidad *</label>
                        <input type="number" id="cantidadCompra" min="1" placeholder="1000" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Precio Unitario *</label>
                        <input type="number" id="precioCompra" step="0.01" min="0" placeholder="45.00" required>
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label>N° de Lote *</label>
                        <input type="text" id="numLote" placeholder="LOT-2025-001" required>
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
    
    // Event listeners para calcular total en tiempo real
    document.getElementById('cantidadCompra').addEventListener('input', calcularTotalCompra);
    document.getElementById('precioCompra').addEventListener('input', calcularTotalCompra);
}

// ============================================
// MOSTRAR INFO DEL MEDICAMENTO SELECCIONADO
// ============================================
function mostrarInfoMedicamento() {
    const codigoMed = document.getElementById('medicamentoCompra').value;
    
    if (!codigoMed) {
        document.getElementById('infoMedicamento').style.display = 'none';
        return;
    }
    
    const medicamento = buscarMedicamento(codigoMed);
    
    if (!medicamento) return;
    
    // Calcular stock actual
    const stockActual = hojas.inventario
        .filter(lote => lote.Código_Med === codigoMed)
        .reduce((sum, lote) => sum + (lote.Cant_Actual || 0), 0);
    
    const html = `
        <p><strong>Nombre:</strong> ${medicamento.Nombre}</p>
        <p><strong>Presentación:</strong> ${medicamento.Presentacion || ''} ${medicamento.Concentración || ''}</p>
        <p><strong>Clasificación ABC:</strong> <span class="badge badge-${medicamento.Clase_ABC.toLowerCase()}">${medicamento.Clase_ABC}</span></p>
        <p><strong>Precio unitario sugerido:</strong> $${(medicamento.Precio_Unit || 0).toFixed(2)}</p>
        <p><strong>Stock actual:</strong> ${stockActual} unidades</p>
        <p><strong>Stock mínimo:</strong> ${medicamento.Stock_Min} unidades</p>
        ${stockActual < medicamento.Stock_Min ? 
            '<p style="color:red; font-weight:bold;">⚠️ Stock por debajo del mínimo - Compra recomendada</p>' : 
            '<p style="color:green;">✅ Stock adecuado</p>'
        }
    `;
    
    document.getElementById('detallesMedicamento').innerHTML = html;
    document.getElementById('infoMedicamento').style.display = 'block';
    
    // Auto-llenar precio sugerido
    document.getElementById('precioCompra').value = medicamento.Precio_Unit || '';
    calcularTotalCompra();
}

// ============================================
// CALCULAR TOTAL DE LA COMPRA
// ============================================
function calcularTotalCompra() {
    const cantidad = parseFloat(document.getElementById('cantidadCompra').value) || 0;
    const precio = parseFloat(document.getElementById('precioCompra').value) || 0;
    
    const subtotal = cantidad * precio;
    const iva = subtotal * 0.13;
    const total = subtotal + iva;
    
    document.getElementById('subtotalCompra').textContent = '$' + subtotal.toFixed(2);
    document.getElementById('ivaCompra').textContent = '$' + iva.toFixed(2);
    document.getElementById('totalCompra').textContent = '$' + total.toFixed(2);
}

// ============================================
// REGISTRAR LA COMPRA
// ============================================
function registrarCompra() {
    // Obtener datos del formulario
    const datos = {
        fecha: document.getElementById('fechaCompra').value,
        numFactura: document.getElementById('numFactura').value.trim(),
        proveedor: document.getElementById('proveedor').value,
        codigoMed: document.getElementById('medicamentoCompra').value,
        cantidad: parseInt(document.getElementById('cantidadCompra').value),
        precio: parseFloat(document.getElementById('precioCompra').value),
        numLote: document.getElementById('numLote').value.trim(),
        fechaFab: document.getElementById('fechaFab').value,
        fechaVenc: document.getElementById('fechaVenc').value
    };
    
    // VALIDACIONES
    if (!datos.numFactura) {
        alert('❌ El número de factura es obligatorio');
        return;
    }
    
    if (!datos.proveedor) {
        alert('❌ Debe seleccionar un proveedor');
        return;
    }
    
    if (!datos.codigoMed) {
        alert('❌ Debe seleccionar un medicamento');
        return;
    }
    
    if (datos.cantidad <= 0) {
        alert('❌ La cantidad debe ser mayor a 0');
        return;
    }
    
    if (datos.precio <= 0) {
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
    const hoy = new Date();
    
    if (fechaVenc <= fechaFab) {
        alert('❌ La fecha de vencimiento debe ser posterior a la fecha de fabricación');
        return;
    }
    
    const mesesDiferencia = (fechaVenc - fechaFab) / (1000 * 60 * 60 * 24 * 30);
    if (mesesDiferencia < 6) {
        const confirmar = confirm('⚠️ El medicamento vence en menos de 6 meses.\n¿Desea continuar?');
        if (!confirmar) return;
    }
    
    // Buscar info del medicamento
    const medicamento = buscarMedicamento(datos.codigoMed);
    
    // Calcular valores contables
    const subtotal = datos.cantidad * datos.precio;
    const iva = subtotal * 0.13;
    const total = subtotal + iva;
    
    console.log('💾 Registrando compra...', datos);
    
    try {
        // 1. AGREGAR A INVENTARIO_LOTES
        const nuevoLote = {
            ID_Lote: generarIDLote(),
            Código_Med: datos.codigoMed,
            Nombre_Med: medicamento.Nombre,
            Num_Lote: datos.numLote,
            Cant_Inicial: datos.cantidad,
            Cant_Actual: datos.cantidad,
            Fecha_Fab: formatearFecha(new Date(datos.fechaFab)),
            Fecha_Venc: formatearFecha(new Date(datos.fechaVenc)),
            Costo_Unit: datos.precio,
            Estado: '✅ Activo'
        };
        hojas.inventario.push(nuevoLote);
        
        // 2. AGREGAR A LIBRO_COMPRAS
        const nuevaCompra = {
            Fecha: formatearFecha(new Date(datos.fecha)),
            Num_Factura: datos.numFactura,
            Proveedor: datos.proveedor,
            Código_Med: datos.codigoMed,
            Nombre_Med: medicamento.Nombre,
            Num_Lote: datos.numLote,
            Cantidad: datos.cantidad,
            Precio_Unit: datos.precio,
            Subtotal: subtotal,
            IVA_13: iva,
            Total: total
        };
        hojas.compras.push(nuevaCompra);
        
        // 3. GENERAR ASIENTOS CONTABLES EN LIBRO_DIARIO
        const numAsiento = obtenerUltimoAsiento() + 1;
        const descripcion = `Compra ${medicamento.Nombre} - Fact. ${datos.numFactura}`;
        
        // Asiento 1: Debe - Inventario
        hojas.diario.push({
            Fecha: formatearFecha(new Date(datos.fecha)),
            Num_Asiento: numAsiento,
            Descripción: descripcion,
            Cuenta: 'Inventario de Medicamentos',
            Debe: subtotal,
            Haber: 0
        });
        
        // Asiento 2: Debe - IVA
        hojas.diario.push({
            Fecha: formatearFecha(new Date(datos.fecha)),
            Num_Asiento: numAsiento,
            Descripción: descripcion,
            Cuenta: 'IVA Crédito Fiscal',
            Debe: iva,
            Haber: 0
        });
        
        // Asiento 3: Haber - Cuentas por Pagar
        hojas.diario.push({
            Fecha: formatearFecha(new Date(datos.fecha)),
            Num_Asiento: numAsiento,
            Descripción: descripcion,
            Cuenta: 'Cuentas por Pagar',
            Debe: 0,
            Haber: total
        });
        
        console.log('✅ Compra registrada exitosamente');
        console.log('  - Lote creado:', nuevoLote.ID_Lote);
        console.log('  - Asiento contable:', numAsiento);
        
        // Actualizar dashboard, recalcular y guardar excel 
        recalcAll()
        actualizarLibroMayor();
        mostrarDashboard();
        verificarAlertas();
        
        
        // Mostrar confirmación
        alert(`✅ Compra registrada exitosamente\n\n` +
              `Lote: ${nuevoLote.ID_Lote}\n` +
              `Medicamento: ${medicamento.Nombre}\n` +
              `Cantidad: ${datos.cantidad} unidades\n` +
              `Total: $${total.toFixed(2)}\n\n` +
              `Se generaron 3 asientos contables en el Libro Diario.`);
              
        
        // Volver al dashboard
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
    const confirmar = confirm('¿Desea cancelar el registro de la compra?');
    if (confirmar) {
        document.getElementById('contenidoDinamico').innerHTML = '';
    }
}