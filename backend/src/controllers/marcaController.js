const { query } = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM marcas ORDER BY nombre');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM marcas WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Marca no encontrada' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { nombre } = req.body;
    const { rows } = await query(
      'INSERT INTO marcas (nombre) VALUES ($1) RETURNING id',
      [nombre]
    );
    res.status(201).json({ id: rows[0].id, message: 'Marca creada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { nombre, activo } = req.body;
    await query(
      'UPDATE marcas SET nombre = $1, activo = $2 WHERE id = $3',
      [nombre, activo ?? true, req.params.id]
    );
    res.json({ message: 'Marca actualizada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await query('UPDATE productos SET marca_id = NULL WHERE marca_id = $1', [req.params.id]);
    await query('DELETE FROM marcas WHERE id = $1', [req.params.id]);
    res.json({ message: 'Marca eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
