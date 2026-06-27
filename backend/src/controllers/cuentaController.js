const { query } = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const { estado } = req.query;
    let sql = 'SELECT * FROM cuentas_pagar WHERE 1=1';
    const params = []; let idx = 1;
    if (estado) { sql += ` AND estado = $${idx++}`; params.push(estado); }
    sql += ' ORDER BY fecha_inicio DESC';
    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.create = async (req, res) => {
  try {
    const { proveedor, concepto, monto_total, cuotas, fecha_inicio, periodicidad } = req.body;
    if (!proveedor || !concepto || !monto_total || !fecha_inicio) return res.status(400).json({ error: 'Campos requeridos' });
    const numCuotas = cuotas || 1;
    const montoCuota = Math.round((monto_total / numCuotas) * 100) / 100;
    const { rows } = await query(
      'INSERT INTO cuentas_pagar (proveedor, concepto, monto_total, cuotas, monto_cuota, fecha_inicio, periodicidad) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [proveedor, concepto, monto_total, numCuotas, montoCuota, fecha_inicio, periodicidad || 'semanal']
    );
    res.status(201).json({ cuenta: rows[0], message: 'Cuenta registrada' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.pagarCuota = async (req, res) => {
  try {
    const { nro_cuota, monto, metodo_pago, observaciones } = req.body;
    const { rows: cuenta } = await query('SELECT * FROM cuentas_pagar WHERE id = $1', [req.params.id]);
    if (cuenta.length === 0) return res.status(404).json({ error: 'Cuenta no encontrada' });
    if (cuenta[0].estado !== 'activa') return res.status(400).json({ error: 'La cuenta ya está pagada o cancelada' });

    await query(
      'INSERT INTO pagos_cuenta (cuenta_id, nro_cuota, monto, metodo_pago, observaciones) VALUES ($1,$2,$3,$4,$5)',
      [req.params.id, nro_cuota, monto, metodo_pago || null, observaciones || null]
    );

    const nuevasPagadas = Number(cuenta[0].cuotas_pagadas) + 1;
    const nuevoEstado = nuevasPagadas >= Number(cuenta[0].cuotas) ? 'pagada' : 'activa';
    await query('UPDATE cuentas_pagar SET cuotas_pagadas = $1, estado = $2 WHERE id = $3', [nuevasPagadas, nuevoEstado, req.params.id]);

    const tituloObs = observaciones ? ` - ${observaciones}` : '';
    await query(
      'INSERT INTO agenda (titulo, fecha, tipo) VALUES ($1, $2, $3)',
      [`Pago cuota #${nro_cuota} a ${cuenta[0].proveedor}${tituloObs}`, new Date().toISOString().split('T')[0], 'pago']
    );

    res.json({ message: `Cuota ${nro_cuota} pagada` });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.pagos = async (req, res) => {
  try {
    const { rows } = await query('SELECT pc.*, cp.proveedor, cp.concepto FROM pagos_cuenta pc JOIN cuentas_pagar cp ON pc.cuenta_id = cp.id WHERE pc.cuenta_id = $1 ORDER BY pc.nro_cuota', [req.params.id]);
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
};
