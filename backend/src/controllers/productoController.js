const { query } = require('../config/database');
const { calcularPrecioBase } = require('../utils/calculations');

exports.getAll = async (req, res) => {
  try {
    const { activo, categoria } = req.query;
    let sql = 'SELECT id, codigo, nombre, descripcion, costo, precio_base, precio_venta, stock, stock_minimo, categoria, categoria_id, marca_id, proveedor, tipo, imagen_url, activo FROM productos';
    const params = [];
    const conditions = [];

    if (activo !== undefined) {
      conditions.push('activo = $' + (params.length + 1));
      params.push(activo === 'true' ? true : false);
    }
    if (categoria) {
      conditions.push('categoria = $' + (params.length + 1));
      params.push(categoria);
    }

    if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY nombre';

    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM productos WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { codigo, nombre, descripcion, costo, precio_venta, stock, stock_minimo, categoria, categoria_id, marca_id, proveedor, tipo } = req.body;
    const precio_base = calcularPrecioBase(costo);

    const { rows } = await query(
      'INSERT INTO productos (codigo, nombre, descripcion, costo, precio_base, precio_venta, stock, stock_minimo, categoria, categoria_id, marca_id, proveedor, tipo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id',
      [codigo, nombre, descripcion, costo, precio_base, precio_venta || null, stock || 0, stock_minimo || 0, categoria, categoria_id || null, marca_id || null, proveedor || null, tipo || null]
    );

    if (stock > 0) {
      await query(
        'INSERT INTO inventario_movimientos (producto_id, tipo, cantidad, referencia) VALUES ($1, $2, $3, $4)',
        [rows[0].id, 'entrada', stock, 'Stock inicial']
      );
    }

    res.status(201).json({ id: rows[0].id, precio_base, message: 'Producto creado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { codigo, nombre, descripcion, costo, precio_venta, stock, stock_minimo, categoria, categoria_id, marca_id, proveedor, tipo, activo } = req.body;

    const fields = [];
    const params = [];
    let idx = 1;

    if (codigo !== undefined) { fields.push(`codigo = $${idx++}`); params.push(codigo); }
    if (nombre !== undefined) { fields.push(`nombre = $${idx++}`); params.push(nombre); }
    if (descripcion !== undefined) { fields.push(`descripcion = $${idx++}`); params.push(descripcion); }
    if (costo !== undefined) {
      fields.push(`costo = $${idx++}`);
      params.push(costo);
      fields.push(`precio_base = $${idx++}`);
      params.push(calcularPrecioBase(costo));
    }
    if (precio_venta !== undefined) { fields.push(`precio_venta = $${idx++}`); params.push(precio_venta); }
    if (stock !== undefined) { fields.push(`stock = $${idx++}`); params.push(stock); }
    if (stock_minimo !== undefined) { fields.push(`stock_minimo = $${idx++}`); params.push(stock_minimo); }
    if (categoria !== undefined) { fields.push(`categoria = $${idx++}`); params.push(categoria); }
    if (categoria_id !== undefined) { fields.push(`categoria_id = $${idx++}`); params.push(categoria_id); }
    if (marca_id !== undefined) { fields.push(`marca_id = $${idx++}`); params.push(marca_id); }
    if (proveedor !== undefined) { fields.push(`proveedor = $${idx++}`); params.push(proveedor); }
    if (tipo !== undefined) { fields.push(`tipo = $${idx++}`); params.push(tipo); }
    if (activo !== undefined) { fields.push(`activo = $${idx++}`); params.push(activo); }

    if (fields.length === 0) return res.status(400).json({ error: 'No hay campos para actualizar' });

    params.push(req.params.id);
    await query(
      `UPDATE productos SET ${fields.join(', ')} WHERE id = $${idx}`,
      params
    );
    res.json({ message: 'Producto actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await query('UPDATE productos SET activo = false WHERE id = $1', [req.params.id]);
    res.json({ message: 'Producto desactivado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.activar = async (req, res) => {
  try {
    await query('UPDATE productos SET activo = true WHERE id = $1', [req.params.id]);
    res.json({ message: 'Producto activado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
