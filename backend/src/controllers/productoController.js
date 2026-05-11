const { db } = require('../config/database');
const { calcularPrecioBase } = require('../utils/calculations');

exports.getAll = async (req, res) => {
  try {
    const { activo } = req.query;
    let query = 'SELECT id, codigo, nombre, descripcion, costo, precio_base, precio_venta, stock, stock_minimo, categoria, activo FROM productos';
    const params = [];

    if (activo !== undefined) {
      query += ' WHERE activo = ?';
      params.push(activo === 'true' ? 1 : 0);
    }
    query += ' ORDER BY nombre';

    const [rows] = await db.async.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await db.async.query('SELECT * FROM productos WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { codigo, nombre, descripcion, costo, precio_venta, stock, stock_minimo, categoria } = req.body;
    const precio_base = calcularPrecioBase(costo);

    const [result] = await db.async.query(
      'INSERT INTO productos (codigo, nombre, descripcion, costo, precio_base, precio_venta, stock, stock_minimo, categoria) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [codigo, nombre, descripcion, costo, precio_base, precio_venta || null, stock || 0, stock_minimo || 0, categoria]
    );

    if (stock > 0) {
      await db.async.query(
        'INSERT INTO inventario_movimientos (producto_id, tipo, cantidad, referencia) VALUES (?, ?, ?, ?)',
        [result.insertId, 'entrada', stock, 'Stock inicial']
      );
    }

    res.status(201).json({ id: result.insertId, precio_base, message: 'Producto creado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { codigo, nombre, descripcion, costo, precio_venta, stock, stock_minimo, categoria, activo } = req.body;

    const fields = [];
    const params = [];

    if (codigo !== undefined) { fields.push('codigo = ?'); params.push(codigo); }
    if (nombre !== undefined) { fields.push('nombre = ?'); params.push(nombre); }
    if (descripcion !== undefined) { fields.push('descripcion = ?'); params.push(descripcion); }
    if (costo !== undefined) { fields.push('costo = ?'); params.push(costo); fields.push('precio_base = ?'); params.push(calcularPrecioBase(costo)); }
    if (precio_venta !== undefined) { fields.push('precio_venta = ?'); params.push(precio_venta); }
    if (stock !== undefined) { fields.push('stock = ?'); params.push(stock); }
    if (stock_minimo !== undefined) { fields.push('stock_minimo = ?'); params.push(stock_minimo); }
    if (categoria !== undefined) { fields.push('categoria = ?'); params.push(categoria); }
    if (activo !== undefined) { fields.push('activo = ?'); params.push(activo); }

    if (fields.length === 0) return res.status(400).json({ error: 'No hay campos para actualizar' });

    params.push(req.params.id);
    await db.async.query(
      `UPDATE productos SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
    res.json({ message: 'Producto actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await db.async.query('DELETE FROM productos WHERE id = ?', [req.params.id]);
    res.json({ message: 'Producto eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
