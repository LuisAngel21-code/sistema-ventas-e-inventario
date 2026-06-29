const { query } = require('../config/database');

exports.listar = async (req, res) => {
  try {
    const { vendedor_id } = req.query;
    let sql = `
      SELECT pv.*, v.nombre, v.apellido, v.sueldo_fijo
      FROM pagos_vendedor pv
      JOIN vendedores v ON pv.vendedor_id = v.id
      WHERE 1=1`;
    const params = [];
    let idx = 1;
    if (vendedor_id) { sql += ` AND pv.vendedor_id = $${idx++}`; params.push(vendedor_id); }
    sql += ' ORDER BY pv.semana_inicio DESC, v.nombre';

    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.calcular = async (req, res) => {
  try {
    const { semana_inicio, semana_fin } = req.query;
    if (!semana_inicio || !semana_fin) {
      return res.status(400).json({ error: 'semana_inicio y semana_fin requeridos' });
    }

    const { rows: hayVentas } = await query(
      "SELECT COUNT(*) as total FROM ventas WHERE fecha >= $1 AND fecha <= $2 AND estado = 'completada'",
      [semana_inicio, semana_fin]
    );
    if (Number(hayVentas[0].total) === 0) {
      return res.status(404).json({ error: 'No hay ventas en esta semana para ningún vendedor' });
    }

    const { rows: vendedores } = await query(
      'SELECT id, nombre, apellido, sueldo_fijo FROM vendedores WHERE activo = true'
    );

    const creados = [];
    for (const v of vendedores) {

      const { rows: ventas } = await query(`
        SELECT COALESCE(SUM(dv.subtotal), 0) as total_ventas,
               COALESCE(SUM(dv.precio_base_unitario * dv.cantidad) * 0.02, 0) as total_comision,
               COALESCE(SUM(CASE WHEN dv.precio_final_unitario > dv.precio_base_unitario
                 THEN (dv.precio_final_unitario - dv.precio_base_unitario) * dv.cantidad * 0.5
                 ELSE 0 END), 0) as total_sobreprecio
        FROM ventas vv
        JOIN detalle_ventas dv ON dv.venta_id = vv.id
        WHERE vv.vendedor_id = $1 AND vv.fecha >= $2 AND vv.fecha <= $3 AND vv.estado = 'completada'
      `, [v.id, semana_inicio, semana_fin]);

      const d = ventas[0];
      const totalComision = Number(d.total_comision) || 0;
      const totalSobreprecio = Number(d.total_sobreprecio) || 0;
      const totalPago = Math.round((Number(v.sueldo_fijo) + totalComision + totalSobreprecio) * 100) / 100;

      const { rows: existente } = await query(
        "SELECT id, estado FROM pagos_vendedor WHERE vendedor_id = $1 AND semana_inicio = $2",
        [v.id, semana_inicio]
      );

      if (existente.length > 0) {
        if (existente[0].estado === 'pagado') {
          creados.push({ vendedor: `${v.nombre} ${v.apellido}`, total: totalPago, pagado: true });
          continue;
        }
        await query(
          'UPDATE pagos_vendedor SET total_comision = $1, total_sobreprecio = $2, total_pago = $3 WHERE id = $4',
          [totalComision, totalSobreprecio, totalPago, existente[0].id]
        );
        creados.push({ vendedor: `${v.nombre} ${v.apellido}`, total: totalPago, actualizado: true });
      } else {
        await query(
          'INSERT INTO pagos_vendedor (vendedor_id, semana_inicio, semana_fin, sueldo_base, total_comision, total_sobreprecio, total_pago) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [v.id, semana_inicio, semana_fin, v.sueldo_fijo, totalComision, totalSobreprecio, totalPago]
        );
        creados.push({ vendedor: `${v.nombre} ${v.apellido}`, total: totalPago });
      }
    }

    res.json({ message: `${creados.length} pago(s) calculado(s)`, pagos: creados });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await query('DELETE FROM pagos_vendedor WHERE id = $1', [req.params.id]);
    res.json({ message: 'Pago eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.marcarPagado = async (req, res) => {
  try {
    const { rows } = await query(
      "UPDATE pagos_vendedor SET estado = 'pagado', pagado_en = NOW() WHERE id = $1 AND estado = 'pendiente' RETURNING id",
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Pago no encontrado o ya fue pagado' });
    res.json({ message: 'Pago marcado como pagado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
