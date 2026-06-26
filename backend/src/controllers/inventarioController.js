const { query, getConnection } = require('../config/database');

exports.getStock = async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT id, codigo, nombre, categoria, costo, precio_base, stock, stock_minimo,
             CASE
               WHEN stock <= 0 THEN 'sin_stock'
               WHEN stock <= stock_minimo THEN 'bajo'
               ELSE 'normal'
             END as estado_stock
      FROM productos
      WHERE activo = true
      ORDER BY nombre
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMovimientos = async (req, res) => {
  try {
    const { producto_id } = req.query;
    let sql = `
      SELECT im.*, p.nombre AS producto_nombre, p.codigo AS producto_codigo
      FROM inventario_movimientos im
      JOIN productos p ON im.producto_id = p.id
      WHERE 1=1`;
    const params = [];
    let idx = 1;

    if (producto_id) {
      sql += ` AND im.producto_id = $${idx++}`;
      params.push(producto_id);
    }

    sql += ' ORDER BY im.created_at DESC LIMIT 200';

    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.entradaStock = async (req, res) => {
  const { producto_id, cantidad, referencia } = req.body;

  if (!producto_id || !cantidad || cantidad <= 0) {
    return res.status(400).json({ error: 'Producto y cantidad válida requeridos' });
  }

  const client = await getConnection();

  try {
    await client.query('BEGIN');

    const { rows: producto } = await client.query(
      'SELECT id, nombre FROM productos WHERE id = $1 AND activo = true',
      [producto_id]
    );
    if (producto.length === 0) throw new Error('Producto no encontrado');

    await client.query(
      'UPDATE productos SET stock = stock + $1 WHERE id = $2',
      [cantidad, producto_id]
    );

    await client.query(
      'INSERT INTO inventario_movimientos (producto_id, tipo, cantidad, referencia) VALUES ($1, $2, $3, $4)',
      [producto_id, 'entrada', cantidad, referencia || 'Entrada manual']
    );

    await client.query('COMMIT');
    res.json({ message: `Stock actualizado para ${producto[0].nombre}` });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};
