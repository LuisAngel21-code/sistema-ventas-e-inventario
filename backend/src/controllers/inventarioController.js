const { db } = require('../config/database');

exports.getMovimientos = async (req, res) => {
  try {
    const { producto_id, tipo, desde, hasta } = req.query;
    let query = `
      SELECT im.*, p.nombre AS producto_nombre, p.codigo AS producto_codigo
      FROM inventario_movimientos im
      JOIN productos p ON im.producto_id = p.id
      WHERE 1=1`;
    const params = [];

    if (producto_id) { query += ' AND im.producto_id = ?'; params.push(producto_id); }
    if (tipo) { query += ' AND im.tipo = ?'; params.push(tipo); }
    if (desde) { query += ' AND im.created_at >= ?'; params.push(desde); }
    if (hasta) { query += ' AND im.created_at <= ?'; params.push(hasta); }

    query += ' ORDER BY im.created_at DESC';

    const [rows] = await db.async.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.entradaStock = async (req, res) => {
  const connection = await db.async.getConnection();
  let transStarted = false;
  try {
    const { producto_id, cantidad, referencia } = req.body;
    await connection.beginTransaction();
    transStarted = true;
    await connection.query('UPDATE productos SET stock = stock + ? WHERE id = ?', [cantidad, producto_id]);
    await connection.query(
      'INSERT INTO inventario_movimientos (producto_id, tipo, cantidad, referencia) VALUES (?, ?, ?, ?)',
      [producto_id, 'entrada', cantidad, referencia || 'Entrada manual']
    );
    await connection.commit();
    res.json({ message: 'Entrada de stock registrada exitosamente' });
  } catch (error) {
    if (transStarted) await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

exports.getStock = async (req, res) => {
  try {
    const [rows] = await db.async.query(`
      SELECT id, codigo, nombre, costo, precio_base, stock, stock_minimo, categoria,
             CASE WHEN stock <= stock_minimo THEN 'bajo' ELSE 'normal' END AS estado_stock
      FROM productos
      WHERE activo = 1
      ORDER BY nombre
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
