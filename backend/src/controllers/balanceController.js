const { query } = require('../config/database');

exports.getBalance = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    if (!desde || !hasta) {
      return res.status(400).json({ error: 'Parámetros desde y hasta requeridos' });
    }

    const [{ rows: ventas }] = await Promise.all([
      query("SELECT COALESCE(SUM(total), 0) as total FROM ventas WHERE fecha >= $1 AND fecha <= $2 AND estado = 'completada'", [desde, hasta]),
    ]);

    const [{ rows: ingresosCaja }] = await Promise.all([
      query("SELECT COALESCE(SUM(cm.monto), 0) as total FROM caja_movimientos cm JOIN caja_sesiones cs ON cm.sesion_id = cs.id WHERE cm.tipo = 'ingreso' AND cs.fecha_apertura >= $1 AND cs.fecha_apertura <= $2", [desde, hasta]),
    ]);

    const [{ rows: comisiones }] = await Promise.all([
      query("SELECT COALESCE(SUM(total_pago), 0) as total FROM pagos_vendedor WHERE estado = 'pagado' AND pagado_en >= $1 AND pagado_en <= $2", [desde, hasta]),
    ]);

    const [{ rows: retiros }] = await Promise.all([
      query("SELECT COALESCE(SUM(cm.monto), 0) as total FROM caja_movimientos cm JOIN caja_sesiones cs ON cm.sesion_id = cs.id WHERE cm.tipo = 'egreso' AND cm.categoria = 'retiro' AND cs.fecha_apertura >= $1 AND cs.fecha_apertura <= $2", [desde, hasta]),
    ]);

    const [{ rows: gastosReales }] = await Promise.all([
      query("SELECT COALESCE(SUM(cm.monto), 0) as total FROM caja_movimientos cm JOIN caja_sesiones cs ON cm.sesion_id = cs.id WHERE cm.tipo = 'egreso' AND (cm.categoria IS NULL OR cm.categoria = 'gasto') AND cs.fecha_apertura >= $1 AND cs.fecha_apertura <= $2", [desde, hasta]),
    ]);

    const totalIngresos = Number(ventas[0].total) + Number(ingresosCaja[0].total);
    const totalEgresos = Number(comisiones[0].total) + Number(gastosReales[0].total);
    const totalRetiros = Number(retiros[0].total);
    const ganancia = totalIngresos - totalEgresos;
    const margen = totalIngresos > 0 ? Math.round((ganancia / totalIngresos) * 10000) / 100 : 0;

    res.json({
      ingresos: {
        ventas: Number(ventas[0].total),
        otros_ingresos: Number(ingresosCaja[0].total),
        total: totalIngresos,
      },
      egresos: {
        comisiones: Number(comisiones[0].total),
        gastos_caja: Number(gastosReales[0].total),
        total: totalEgresos,
      },
      retiros: totalRetiros,
      resultado: {
        ganancia,
        margen,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
