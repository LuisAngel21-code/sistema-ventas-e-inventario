const { query } = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM categorias ORDER BY nombre');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM categorias WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    const { rows } = await query(
      'INSERT INTO categorias (nombre, descripcion) VALUES ($1, $2) RETURNING id',
      [nombre, descripcion]
    );
    res.status(201).json({ id: rows[0].id, message: 'Categoría creada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { nombre, descripcion, activo } = req.body;
    await query(
      'UPDATE categorias SET nombre = $1, descripcion = $2, activo = $3 WHERE id = $4',
      [nombre, descripcion, activo ?? true, req.params.id]
    );
    res.json({ message: 'Categoría actualizada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await query('UPDATE productos SET categoria_id = NULL WHERE categoria_id = $1', [req.params.id]);
    await query('DELETE FROM categorias WHERE id = $1', [req.params.id]);
    res.json({ message: 'Categoría eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
