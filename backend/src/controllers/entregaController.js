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
    const desc = `Dirección: ${direccion}${producto ? '. Producto: ' + producto : ''}`;
    await query(
      'INSERT INTO agenda (titulo, fecha, hora, descripcion, tipo) VALUES ($1, $2, $3, $4, $5)',
      [`Entrega - ${cliente}`, fecha_entrega, hora_programada || null, desc, 'entrega']
    );
    res.status(201).json({ entrega: rows[0], message: 'Entrega registrada' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.update = async (req, res) => {
  try {
    const { cliente, direccion, distrito, referencia, fecha_entrega, hora_programada, telefono, producto, observaciones, estado } = req.body;
    const { rows } = await query(
      'UPDATE entregas SET cliente=$1, direccion=$2, distrito=$3, referencia=$4, fecha_entrega=$5, hora_programada=$6, telefono=$7, producto=$8, observaciones=$9, estado=$10 WHERE id=$11 RETURNING *',
      [cliente, direccion, distrito, referencia, fecha_entrega, hora_programada, telefono, producto, observaciones, estado, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Entrega no encontrada' });
    res.json({ entrega: rows[0], message: 'Entrega actualizada' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.remove = async (req, res) => {
  try {
    await query('DELETE FROM entregas WHERE id = $1', [req.params.id]);
    res.json({ message: 'Entrega eliminada' });
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
