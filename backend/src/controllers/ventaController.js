const { query, getConnection } = require('../config/database');
const { calcularSobreprecio } = require('../utils/calculations');

exports.getAll = async (req, res) => {
  try {
    const { desde, hasta, vendedor_id } = req.query;
    let sql = `
      SELECT v.id, v.fecha, v.total, v.estado,
             ve.nombre AS vendedor_nombre, ve.apellido AS vendedor_apellido
      FROM ventas v
      JOIN vendedores ve ON v.vendedor_id = ve.id
      WHERE v.estado = 'completada'`;
    const params = [];
    let idx = 1;

    if (desde) { sql += ` AND v.fecha >= $${idx++}`; params.push(desde); }
    if (hasta) { sql += ` AND v.fecha <= $${idx++}`; params.push(hasta); }
    if (vendedor_id) { sql += ` AND v.vendedor_id = $${idx++}`; params.push(vendedor_id); }

    sql += ' ORDER BY v.fecha DESC';

    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { rows: venta } = await query(
      `SELECT v.*, ve.nombre AS vendedor_nombre, ve.apellido AS vendedor_apellido
       FROM ventas v
       JOIN vendedores ve ON v.vendedor_id = ve.id
       WHERE v.id = $1`,
      [req.params.id]
    );
    if (venta.length === 0) return res.status(404).json({ error: 'Venta no encontrada' });

    const { rows: detalle } = await query(
      `SELECT dv.*, p.nombre AS producto_nombre, p.codigo AS producto_codigo
       FROM detalle_ventas dv
       JOIN productos p ON dv.producto_id = p.id
       WHERE dv.venta_id = $1`,
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

  const client = await getConnection();

  try {
    await client.query('BEGIN');

    const { rows: vendedor } = await client.query(
      'SELECT id FROM vendedores WHERE id = $1 AND activo = true',
      [vendedor_id]
    );
    if (vendedor.length === 0) throw new Error('Vendedor no encontrado o inactivo');

    let totalVenta = 0;
    const detalles = [];

    for (const item of productos) {
      const { rows: producto } = await client.query(
        'SELECT id, nombre, costo, precio_base, stock FROM productos WHERE id = $1 AND activo = true',
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
        subtotal,
      });
    }

    totalVenta = Math.round(totalVenta * 100) / 100;

    const { rows: ventaResult } = await client.query(
      'INSERT INTO ventas (vendedor_id, total) VALUES ($1, $2) RETURNING id',
      [vendedor_id, totalVenta]
    );
    const ventaId = ventaResult[0].id;

    for (const det of detalles) {
      await client.query(
        'INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, costo_unitario, precio_base_unitario, precio_final_unitario, sobreprecio_unitario, subtotal) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [ventaId, det.producto_id, det.cantidad, det.costo_unitario, det.precio_base_unitario, det.precio_final_unitario, det.sobreprecio_unitario, det.subtotal]
      );

      await client.query(
        'UPDATE productos SET stock = stock - $1 WHERE id = $2',
        [det.cantidad, det.producto_id]
      );

      await client.query(
        'INSERT INTO inventario_movimientos (producto_id, tipo, cantidad, referencia, venta_id) VALUES ($1, $2, $3, $4, $5)',
        [det.producto_id, 'salida', det.cantidad, `Venta #${ventaId}`, ventaId]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({
      id: ventaId,
      total: totalVenta,
      message: 'Venta registrada exitosamente',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

exports.anular = async (req, res) => {
  const client = await getConnection();

  try {
    await client.query('BEGIN');

    const { rows: venta } = await client.query(
      "SELECT id, estado FROM ventas WHERE id = $1 FOR UPDATE",
      [req.params.id]
    );
    if (venta.length === 0) throw new Error('Venta no encontrada');
    if (venta[0].estado === 'anulada') throw new Error('La venta ya fue anulada');

    const { rows: detalles } = await client.query(
      'SELECT producto_id, cantidad FROM detalle_ventas WHERE venta_id = $1',
      [req.params.id]
    );

    for (const det of detalles) {
      await client.query(
        'UPDATE productos SET stock = stock + $1 WHERE id = $2',
        [det.cantidad, det.producto_id]
      );
      await client.query(
        "INSERT INTO inventario_movimientos (producto_id, tipo, cantidad, referencia, venta_id) VALUES ($1, $2, $3, $4, $5)",
        [det.producto_id, 'entrada', det.cantidad, `Anulación Venta #${req.params.id}`, req.params.id]
      );
    }

    await client.query(
      "UPDATE ventas SET estado = 'anulada' WHERE id = $1",
      [req.params.id]
    );

    await client.query('COMMIT');
    res.json({ message: 'Venta anulada exitosamente. Stock restaurado.' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};
