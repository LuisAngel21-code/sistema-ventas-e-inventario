const { query } = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const { fecha, tipo, desde, hasta } = req.query;
    let sql = 'SELECT * FROM agenda WHERE 1=1';
    const params = [];
    let idx = 1;
    if (fecha) { sql += ` AND fecha = $${idx++}`; params.push(fecha); }
    if (tipo) { sql += ` AND tipo = $${idx++}`; params.push(tipo); }
    if (desde) { sql += ` AND fecha >= $${idx++}`; params.push(desde); }
    if (hasta) { sql += ` AND fecha <= $${idx++}`; params.push(hasta); }
    sql += ' ORDER BY fecha ASC, hora ASC';
    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.create = async (req, res) => {
  try {
    const { titulo, fecha, hora, descripcion, tipo } = req.body;
    const { rows } = await query(
      'INSERT INTO agenda (titulo, fecha, hora, descripcion, tipo) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [titulo, fecha, hora || null, descripcion || null, tipo || 'recordatorio']
    );
    res.status(201).json({ evento: rows[0], message: 'Evento creado' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.update = async (req, res) => {
  try {
    const { titulo, fecha, hora, descripcion, tipo, completado } = req.body;
    const { rows } = await query(
      'UPDATE agenda SET titulo=$1,fecha=$2,hora=$3,descripcion=$4,tipo=$5,completado=$6 WHERE id=$7 RETURNING *',
      [titulo, fecha, hora, descripcion, tipo, completado, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Evento no encontrado' });
    res.json({ evento: rows[0], message: 'Evento actualizado' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.remove = async (req, res) => {
  try {
    await query('DELETE FROM agenda WHERE id = $1', [req.params.id]);
    res.json({ message: 'Evento eliminado' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};
