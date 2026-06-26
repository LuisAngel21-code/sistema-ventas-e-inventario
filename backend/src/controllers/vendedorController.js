const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT id, nombre, apellido, email, telefono, activo, sueldo_fijo, created_at FROM vendedores ORDER BY nombre'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT id, nombre, apellido, email, telefono, activo, sueldo_fijo, created_at FROM vendedores WHERE id = $1',
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
    const { nombre, apellido, email, telefono, sueldo_fijo, username, password } = req.body;

    const { rows } = await query(
      'INSERT INTO vendedores (nombre, apellido, email, telefono, sueldo_fijo) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [nombre, apellido, email, telefono, sueldo_fijo || 350.00]
    );
    const vendedorId = rows[0].id;

    if (username && password) {
      const hash = await bcrypt.hash(password, 10);
      await query(
        "INSERT INTO usuarios (vendedor_id, username, password, rol) VALUES ($1, $2, $3, 'vendedor')",
        [vendedorId, username, hash]
      );
    }

    res.status(201).json({ id: vendedorId, message: 'Vendedor creado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { nombre, apellido, email, telefono, activo, sueldo_fijo } = req.body;
    await query(
      'UPDATE vendedores SET nombre = $1, apellido = $2, email = $3, telefono = $4, activo = $5, sueldo_fijo = $6 WHERE id = $7',
      [nombre, apellido, email, telefono, activo ?? 1, sueldo_fijo, req.params.id]
    );
    res.json({ message: 'Vendedor actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await query('DELETE FROM vendedores WHERE id = $1', [req.params.id]);
    res.json({ message: 'Vendedor eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
