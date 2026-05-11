const { db } = require('../config/database');
const { calcularPrecioBase, calcularSobreprecio } = require('../utils/calculations');

exports.getAll = async (req, res) => {
  try {
    const { desde, hasta, vendedor_id } = req.query;
    let query = `
      SELECT v.id, v.fecha, v.total,
             ve.nombre AS vendedor_nombre, ve.apellido AS vendedor_apellido
      FROM ventas v
      JOIN vendedores ve ON v.vendedor_id = ve.id
      WHERE 1=1`;
    const params = [];

    if (desde) { query += ' AND v.fecha >= ?'; params.push(desde); }
    if (hasta) { query += ' AND v.fecha <= ?'; params.push(hasta); }
    if (vendedor_id) { query += ' AND v.vendedor_id = ?'; params.push(vendedor_id); }

    query += ' ORDER BY v.fecha DESC';

    const [rows] = await db.async.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const [venta] = await db.async.query(
      `SELECT v.*, ve.nombre AS vendedor_nombre, ve.apellido AS vendedor_apellido
       FROM ventas v
       JOIN vendedores ve ON v.vendedor_id = ve.id
       WHERE v.id = ?`,
      [req.params.id]
    );
    if (venta.length === 0) return res.status(404).json({ error: 'Venta no encontrada' });

    const [detalle] = await db.async.query(
      `SELECT dv.*, p.nombre AS producto_nombre, p.codigo AS producto_codigo
       FROM detalle_ventas dv
       JOIN productos p ON dv.producto_id = p.id
       WHERE dv.venta_id = ?`,
      [req.params.id]
    );

    res.json({ ...venta[0], detalle });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  const { vendedor_id, productos } = req.body;

  if (!vendedor_id || !productos || productos.length === 0) {
    return res.status(400).json({ error: 'Debe especificar vendedor y al menos un producto' });
  }

  const connection = await db.async.getConnection();
  let transStarted = false;

  try {
    await connection.beginTransaction();
    transStarted = true;

    const [vendedor] = await connection.query(
      'SELECT id FROM vendedores WHERE id = ? AND activo = 1',
      [vendedor_id]
    );
    if (vendedor.length === 0) throw new Error('Vendedor no encontrado o inactivo');

    let totalVenta = 0;
    const detalles = [];

    for (const item of productos) {
      const [producto] = await connection.query(
        'SELECT id, nombre, costo, precio_base, stock FROM productos WHERE id = ? AND activo = 1',
        [item.producto_id]
      );
      if (producto.length === 0) throw new Error(`Producto ID ${item.producto_id} no encontrado`);
      if (producto[0].stock < (item.cantidad || 1)) {
        throw new Error(`Stock insuficiente para ${producto[0].nombre}. Disponible: ${producto[0].stock}`);
      }

      const cantidad = item.cantidad || 1;
      const precioFinal = item.precio_final || producto[0].precio_base;
      const costo = Number(producto[0].costo);
      const precioBase = Number(producto[0].precio_base);
      const sobreprecio = calcularSobreprecio(precioFinal, precioBase);
      const subtotal = Math.round(precioFinal * cantidad * 100) / 100;

      totalVenta += subtotal;

      detalles.push({
        producto_id: item.producto_id,
        cantidad,
        costo_unitario: costo,
        precio_base_unitario: precioBase,
        precio_final_unitario: precioFinal,
        sobreprecio_unitario: sobreprecio,
        subtotal
      });
    }

    totalVenta = Math.round(totalVenta * 100) / 100;

    const [ventaResult] = await connection.query(
      'INSERT INTO ventas (vendedor_id, total) VALUES (?, ?)',
      [vendedor_id, totalVenta]
    );
    const ventaId = ventaResult.insertId;

    for (const det of detalles) {
      await connection.query(
        'INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, costo_unitario, precio_base_unitario, precio_final_unitario, sobreprecio_unitario, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [ventaId, det.producto_id, det.cantidad, det.costo_unitario, det.precio_base_unitario, det.precio_final_unitario, det.sobreprecio_unitario, det.subtotal]
      );

      await connection.query(
        'UPDATE productos SET stock = stock - ? WHERE id = ?',
        [det.cantidad, det.producto_id]
      );

      await connection.query(
        'INSERT INTO inventario_movimientos (producto_id, tipo, cantidad, referencia, venta_id) VALUES (?, ?, ?, ?, ?)',
        [det.producto_id, 'salida', det.cantidad, `Venta #${ventaId}`, ventaId]
      );
    }

    await connection.commit();
    res.status(201).json({
      id: ventaId,
      total: totalVenta,
      message: 'Venta registrada exitosamente'
    });
  } catch (error) {
    if (transStarted) await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

exports.remove = async (req, res) => {
  try {
    await db.async.query('DELETE FROM ventas WHERE id = ?', [req.params.id]);
    res.json({ message: 'Venta eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
