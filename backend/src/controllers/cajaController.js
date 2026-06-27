const { query } = require('../config/database');

exports.sesionActual = async (req, res) => {
  try {
    const { rows } = await query(
      "SELECT * FROM caja_sesiones WHERE estado = 'abierta' ORDER BY fecha_apertura DESC LIMIT 1"
    );
    if (rows.length === 0) return res.json({ sesion: null });
    res.json({ sesion: rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.abrir = async (req, res) => {
  try {
    const { saldo_inicial } = req.body;
    const { rows: abierta } = await query(
      "SELECT id FROM caja_sesiones WHERE estado = 'abierta' LIMIT 1"
    );
    if (abierta.length > 0) {
      return res.status(400).json({ error: 'Ya hay una caja abierta. Ciérrela primero.' });
    }
    const { rows } = await query(
      'INSERT INTO caja_sesiones (saldo_inicial, saldo_final) VALUES ($1, $1) RETURNING *',
      [saldo_inicial || 0]
    );
    res.status(201).json({ sesion: rows[0], message: 'Caja abierta' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.cerrar = async (req, res) => {
  try {
    const { rows: sesion } = await query(
      "SELECT * FROM caja_sesiones WHERE estado = 'abierta' LIMIT 1"
    );
    if (sesion.length === 0) return res.status(400).json({ error: 'No hay caja abierta' });

    const { rows: totales } = await query(
      'SELECT COALESCE(SUM(CASE WHEN tipo = $1 THEN monto ELSE 0 END), 0) as ing, COALESCE(SUM(CASE WHEN tipo = $2 THEN monto ELSE 0 END), 0) as eg FROM caja_movimientos WHERE sesion_id = $3',
      ['ingreso', 'egreso', sesion[0].id]
    );

    const saldoFinal = Number(sesion[0].saldo_inicial) + Number(totales[0].ing) - Number(totales[0].eg);

    const { rows } = await query(
      'UPDATE caja_sesiones SET estado = $1, fecha_cierre = NOW(), saldo_final = $2, total_ingresos = $3, total_egresos = $4 WHERE id = $5 RETURNING *',
      ['cerrada', saldoFinal, totales[0].ing, totales[0].eg, sesion[0].id]
    );

    res.json({ sesion: rows[0], message: 'Caja cerrada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.movimientos = async (req, res) => {
  try {
    const { sesion_id } = req.query;
    let sql = 'SELECT cm.*, cs.fecha_apertura FROM caja_movimientos cm JOIN caja_sesiones cs ON cm.sesion_id = cs.id';
    const params = [];
    let idx = 1;

    if (sesion_id) { sql += ` WHERE cm.sesion_id = $${idx++}`; params.push(sesion_id); }
    sql += ' ORDER BY cm.created_at DESC';

    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.registrar = async (req, res) => {
  try {
    const { tipo, tipo_pago, nro_comprobante, descripcion, monto } = req.body;

    if (!tipo || !tipo_pago || !monto || monto <= 0) {
      return res.status(400).json({ error: 'Tipo, tipo de pago y monto válido requeridos' });
    }

    const { rows: sesion } = await query(
      "SELECT * FROM caja_sesiones WHERE estado = 'abierta' LIMIT 1"
    );
    if (sesion.length === 0) return res.status(400).json({ error: 'No hay caja abierta. Abra la caja primero.' });

    const { rows: totales } = await query(
      'SELECT COALESCE(SUM(CASE WHEN tipo = $1 THEN monto ELSE 0 END), 0) as ing, COALESCE(SUM(CASE WHEN tipo = $2 THEN monto ELSE 0 END), 0) as eg FROM caja_movimientos WHERE sesion_id = $3',
      ['ingreso', 'egreso', sesion[0].id]
    );

    const saldoActual = Number(sesion[0].saldo_inicial) + Number(totales[0].ing) - Number(totales[0].eg);
    const saldoDespues = tipo === 'ingreso' ? saldoActual + Number(monto) : saldoActual - Number(monto);
    if (saldoDespues < 0) return res.status(400).json({ error: 'Saldo insuficiente' });

    const { rows } = await query(
      'INSERT INTO caja_movimientos (sesion_id, tipo, tipo_pago, nro_comprobante, descripcion, monto, saldo_despues) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [sesion[0].id, tipo, tipo_pago, nro_comprobante || null, descripcion || null, monto, saldoDespues]
    );

    await query('UPDATE caja_sesiones SET saldo_final = $1 WHERE id = $2', [saldoDespues, sesion[0].id]);

    res.status(201).json({ movimiento: rows[0], saldo: saldoDespues, message: 'Movimiento registrado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

async function recalcularSaldos(sesionId) {
  const { rows: sesion } = await query('SELECT saldo_inicial FROM caja_sesiones WHERE id = $1', [sesionId]);
  if (sesion.length === 0) return;

  let saldo = Number(sesion[0].saldo_inicial);
  const { rows: movs } = await query(
    'SELECT id, tipo, monto FROM caja_movimientos WHERE sesion_id = $1 ORDER BY id',
    [sesionId]
  );

  for (const m of movs) {
    saldo = m.tipo === 'ingreso' ? saldo + Number(m.monto) : saldo - Number(m.monto);
    await query('UPDATE caja_movimientos SET saldo_despues = $1 WHERE id = $2', [saldo, m.id]);
  }

  await query('UPDATE caja_sesiones SET saldo_final = $1 WHERE id = $2', [saldo, sesionId]);
}

exports.actualizar = async (req, res) => {
  try {
    const { tipo, tipo_pago, nro_comprobante, descripcion, monto } = req.body;
    const { rows } = await query(
      'UPDATE caja_movimientos SET tipo = $1, tipo_pago = $2, nro_comprobante = $3, descripcion = $4, monto = $5 WHERE id = $6 RETURNING *',
      [tipo, tipo_pago, nro_comprobante, descripcion, monto, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Movimiento no encontrado' });

    await recalcularSaldos(rows[0].sesion_id);
    res.json({ message: 'Movimiento actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.eliminar = async (req, res) => {
  try {
    const { rows } = await query('DELETE FROM caja_movimientos WHERE id = $1 RETURNING sesion_id', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Movimiento no encontrado' });

    await recalcularSaldos(rows[0].sesion_id);
    res.json({ message: 'Movimiento eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.historial = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    let sql = 'SELECT * FROM caja_sesiones WHERE 1=1';
    const params = [];
    let idx = 1;
    if (desde) { sql += ` AND fecha_apertura >= $${idx++}`; params.push(desde); }
    if (hasta) { sql += ` AND fecha_apertura <= $${idx++}`; params.push(hasta); }
    sql += ' ORDER BY fecha_apertura DESC';

    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
