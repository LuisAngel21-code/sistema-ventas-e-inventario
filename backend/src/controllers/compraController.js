const { query, getConnection } = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM compras ORDER BY fecha DESC'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { rows: compra } = await query('SELECT * FROM compras WHERE id = $1', [req.params.id]);
    if (compra.length === 0) return res.status(404).json({ error: 'Compra no encontrada' });

    const { rows: detalle } = await query(
      `SELECT dc.*, p.nombre AS producto_nombre, p.codigo AS producto_codigo
       FROM detalle_compras dc
       JOIN productos p ON dc.producto_id = p.id
       WHERE dc.compra_id = $1`,
      [req.params.id]
    );

    res.json({ ...compra[0], detalle });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  const { proveedor, productos } = req.body;

  if (!proveedor || !productos || productos.length === 0) {
    return res.status(400).json({ error: 'Proveedor y al menos un producto requeridos' });
  }

  const client = await getConnection();

  try {
    await client.query('BEGIN');

    let total = 0;
    const detalles = [];

    for (const item of productos) {
      const { rows: producto } = await client.query(
        'SELECT id, nombre, costo FROM productos WHERE id = $1 AND activo = true',
        [item.producto_id]
      );
      if (producto.length === 0) throw new Error(`Producto ID ${item.producto_id} no encontrado`);

      const cantidad = item.cantidad || 1;
      const costoUnitario = item.costo_unitario || producto[0].costo;
      const subtotal = Math.round(costoUnitario * cantidad * 100) / 100;
      total += subtotal;

      detalles.push({ producto_id: item.producto_id, cantidad, costo_unitario: costoUnitario, subtotal });
    }

    total = Math.round(total * 100) / 100;

    const { rows: compraResult } = await client.query(
      'INSERT INTO compras (proveedor, total) VALUES ($1, $2) RETURNING id',
      [proveedor, total]
    );
    const compraId = compraResult[0].id;

    for (const det of detalles) {
      await client.query(
        'INSERT INTO detalle_compras (compra_id, producto_id, cantidad, costo_unitario, subtotal) VALUES ($1, $2, $3, $4, $5)',
        [compraId, det.producto_id, det.cantidad, det.costo_unitario, det.subtotal]
      );

      await client.query(
        'UPDATE productos SET stock = stock + $1, costo = $2 WHERE id = $3',
        [det.cantidad, det.costo_unitario, det.producto_id]
      );

      await client.query(
        'INSERT INTO inventario_movimientos (producto_id, tipo, cantidad, referencia) VALUES ($1, $2, $3, $4)',
        [det.producto_id, 'entrada', det.cantidad, `Compra #${compraId} - ${proveedor}`]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ id: compraId, total, message: 'Compra registrada exitosamente' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};
