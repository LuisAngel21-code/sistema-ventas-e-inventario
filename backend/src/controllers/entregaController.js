const { query } = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const { estado, fecha } = req.query;
    let sql = 'SELECT * FROM entregas WHERE 1=1';
    const params = [];
    let idx = 1;
    if (estado) { sql += ` AND estado = $${idx++}`; params.push(estado); }
    if (fecha) { sql += ` AND fecha_entrega = $${idx++}`; params.push(fecha); }
    sql += ' ORDER BY fecha_entrega ASC, hora_programada ASC';
    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.create = async (req, res) => {
  try {
    const { venta_id, cliente, direccion, distrito, referencia, fecha_entrega, hora_programada, telefono, producto, observaciones } = req.body;
    const { rows } = await query(
      'INSERT INTO entregas (venta_id, cliente, direccion, distrito, referencia, fecha_entrega, hora_programada, telefono, producto, observaciones) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
      [venta_id || null, cliente, direccion, distrito, referencia, fecha_entrega, hora_programada || null, telefono, producto, observaciones]
    );
    res.status(201).json({ entrega: rows[0], message: 'Entrega registrada' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.updateEstado = async (req, res) => {
  try {
    const { estado } = req.body;
    const { rows } = await query('UPDATE entregas SET estado = $1 WHERE id = $2 RETURNING *', [estado, req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Entrega no encontrada' });
    res.json({ entrega: rows[0], message: `Entrega ${estado === 'entregado' ? 'marcada como entregada' : 'actualizada'}` });
  } catch (error) { res.status(500).json({ error: error.message }); }
};
