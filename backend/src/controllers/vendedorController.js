const { db } = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.async.query(
      'SELECT id, nombre, apellido, email, telefono, activo, sueldo_fijo, created_at FROM vendedores ORDER BY nombre'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await db.async.query(
      'SELECT id, nombre, apellido, email, telefono, activo, sueldo_fijo, created_at FROM vendedores WHERE id = ?',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Vendedor no encontrado' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { nombre, apellido, email, telefono, sueldo_fijo } = req.body;
    const [result] = await db.async.query(
      'INSERT INTO vendedores (nombre, apellido, email, telefono, sueldo_fijo) VALUES (?, ?, ?, ?, ?)',
      [nombre, apellido, email, telefono, sueldo_fijo || 350.00]
    );
    res.status(201).json({ id: result.insertId, message: 'Vendedor creado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { nombre, apellido, email, telefono, activo, sueldo_fijo } = req.body;
    await db.async.query(
      'UPDATE vendedores SET nombre = ?, apellido = ?, email = ?, telefono = ?, activo = ?, sueldo_fijo = ? WHERE id = ?',
      [nombre, apellido, email, telefono, activo ?? 1, sueldo_fijo, req.params.id]
    );
    res.json({ message: 'Vendedor actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await db.async.query('DELETE FROM vendedores WHERE id = ?', [req.params.id]);
    res.json({ message: 'Vendedor eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
