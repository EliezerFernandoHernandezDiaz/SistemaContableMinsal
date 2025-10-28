// ============================================
// MÓDULO DE RECÁLCULOS AUTOMÁTICOS
// ============================================

// 1️⃣ Recalcular Stock_Actual del Catálogo
function recalcCatalogo() {
    const stockPorMedicamento = {};

    // Sumar existencias por Código_Med en Inventario_Lotes
    hojas.inventario.forEach(lote => {
        const codigo = lote.Código_Med;
        const cantidad = parseFloat(lote.Cant_Actual || 0);
        if (!stockPorMedicamento[codigo]) stockPorMedicamento[codigo] = 0;
        stockPorMedicamento[codigo] += cantidad;
    });

    // Actualizar Stock_Actual en Catálogo
    hojas.catalogo = hojas.catalogo.map(med => ({
        ...med,
        Stock_Actual: stockPorMedicamento[med.Código] || 0
    }));

    console.log("✅ Stock recalculado correctamente.");
}

// 2️⃣ Recalcular Estado de cada lote
function recalcEstadoLote() {
    const hoy = new Date();

    hojas.inventario = hojas.inventario.map(lote => {
        const cant = parseFloat(lote.Cant_Actual || 0);
        let estado = "✅ Activo";

        // Si está agotado
        if (cant <= 0) estado = "❌ Agotado";

        // Validar vencimiento
        if (lote.Fecha_Venc) {
            try {
                const [d, m, a] = lote.Fecha_Venc.split("/");
                const fechaVenc = new Date(`${a}-${m}-${d}`);
                const diff = (fechaVenc - hoy) / (1000 * 60 * 60 * 24);

                if (diff <= 0) estado = "⛔ Vencido";
                else if (diff <= 30 && cant > 0) estado = "⚠️ Por Vencer";
            } catch {
                console.warn("⚠️ Fecha inválida en lote:", lote.Num_Lote);
            }
        }

        return { ...lote, Estado: estado };
    });

    console.log("✅ Estados de lotes actualizados.");
}

// 3️⃣ Función general
function recalcAll() {
    recalcEstadoLote();
    recalcCatalogo();
    console.log("✅ Recalculo completo realizado.");
}


// =========================================== Actualizando lirbo mayor
function actualizarLibroMayor() {
    console.log('📘 Actualizando Libro Mayor automáticamente...');

    // 1️⃣ Agrupar movimientos del Libro Diario por cuenta
    const cuentas = {};

    hojas.diario.forEach(asiento => {
        const cuenta = asiento.Cuenta || 'Sin especificar';
        if (!cuentas[cuenta]) {
            cuentas[cuenta] = {
                totalDebe: 0,
                totalHaber: 0,
                movimientos: []
            };
        }

        cuentas[cuenta].movimientos.push(asiento);
        cuentas[cuenta].totalDebe += parseFloat(asiento.Debe || 0);
        cuentas[cuenta].totalHaber += parseFloat(asiento.Haber || 0);
    });

    // 2️⃣ Limpiar Libro Mayor anterior
    hojas.mayor = [];

    // 3️⃣ Registrar nuevas cuentas con sus saldos
    Object.keys(cuentas).forEach(nombreCuenta => {
        const cuenta = cuentas[nombreCuenta];
        const saldoFinal = cuenta.totalDebe - cuenta.totalHaber;

        hojas.mayor.push({
            Cuenta: nombreCuenta,
            Total_Debe: cuenta.totalDebe.toFixed(2),
            Total_Haber: cuenta.totalHaber.toFixed(2),
            Saldo_Final: saldoFinal.toFixed(2),
            Estado: saldoFinal === 0 ? '✔️ Balanceado' : 
                    saldoFinal > 0 ? '📈 Deudor' : '📉 Acreedor'
        });
    });

    console.log('✅ Libro Mayor actualizado:', hojas.mayor.length, 'cuentas procesadas');
}