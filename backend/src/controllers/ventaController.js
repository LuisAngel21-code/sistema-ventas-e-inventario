const { query, getConnection } = require('../config/database');
const { calcularSobreprecio } = require('../utils/calculations');

exports.getAll = async (req, res) => {
  try {
    const { desde, hasta, vendedor_id } = req.query;
    let sql = `
      SELECT v.id, v.fecha, v.total, v.tipo_venta, v.tipo_comprobante, v.metodo_pago, v.nro_comprobante,
             COALESCE(ve.nombre, t.nombre) AS vendedor_nombre,
             COALESCE(ve.apellido, t.apellido) AS vendedor_apellido
      FROM ventas v
      LEFT JOIN vendedores ve ON v.vendedor_id = ve.id
      LEFT JOIN trabajadores t ON v.trabajador_id = t.id
      WHERE 1=1`;
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
      `SELECT v.*,
              COALESCE(ve.nombre, t.nombre) AS vendedor_nombre,
              COALESCE(ve.apellido, t.apellido) AS vendedor_apellido,
              COALESCE(v.tipo_comprobante, 'boleta') as tipo_comprobante,
              COALESCE(v.metodo_pago, 'efectivo') as metodo_pago,
              COALESCE(v.nro_comprobante, '') as nro_comprobante
       FROM ventas v
       LEFT JOIN vendedores ve ON v.vendedor_id = ve.id
       LEFT JOIN trabajadores t ON v.trabajador_id = t.id
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
  let { vendedor_id, trabajador_id, productos, tipo_comprobante, metodo_pago, nro_comprobante, tipo_venta, monto_acta } = req.body;
  if (typeof productos === 'string') productos = JSON.parse(productos);
  const files = req.files || {};

  if ((!vendedor_id && !trabajador_id) || !productos || productos.length === 0) {
    return res.status(400).json({ error: 'Debe especificar vendedor/encargado y al menos un producto' });
  }
  if (!tipo_comprobante) return res.status(400).json({ error: 'Tipo de comprobante requerido' });
  if (!metodo_pago) return res.status(400).json({ error: 'Método de pago requerido' });
  if (!nro_comprobante) return res.status(400).json({ error: 'Nro. de comprobante requerido' });
  if (!files.comprobante) return res.status(400).json({ error: 'Foto del comprobante requerida' });
  if (metodo_pago !== 'efectivo' && !files.voucher) {
    return res.status(400).json({ error: 'Foto del voucher requerida para este método de pago' });
  }

  const comprobanteUrl = files.comprobante ? `/uploads/comprobantes/${files.comprobante[0].filename}` : null;
  const voucherUrl = files.voucher ? `/uploads/comprobantes/${files.voucher[0].filename}` : null;

  const client = await getConnection();

  try {
    await client.query('BEGIN');

    if (vendedor_id) {
      const { rows: v } = await client.query('SELECT id FROM vendedores WHERE id = $1 AND activo = true', [vendedor_id]);
      if (v.length === 0) throw new Error('Vendedor no encontrado o inactivo');
    } else if (trabajador_id) {
      const { rows: t } = await client.query("SELECT id FROM trabajadores WHERE id = $1 AND tipo IN ('vendedor','encargado') AND activo = true", [trabajador_id]);
      if (t.length === 0) throw new Error('Encargado no encontrado o inactivo');
    }

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

    const esActa = tipo_venta && tipo_venta !== 'directa';
    const estadoVenta = esActa ? 'pendiente' : 'completada';
    const montoTotal = esActa ? (Number(monto_acta) || 0) : totalVenta;

    const { rows: ventaResult } = await client.query(
      "INSERT INTO ventas (vendedor_id, trabajador_id, total, tipo_comprobante, metodo_pago, nro_comprobante, voucher_url, comprobante_url, estado, tipo_venta, monto_acta) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id",
      [vendedor_id || null, trabajador_id || null, montoTotal, tipo_comprobante, metodo_pago, nro_comprobante, voucherUrl, comprobanteUrl, estadoVenta, tipo_venta || 'directa', Number(monto_acta) || 0]
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

exports.abonar = async (req, res) => {
  const { monto } = req.body;
  if (!monto || monto <= 0) return res.status(400).json({ error: 'Monto válido requerido' });

  const client = await getConnection();
  try {
    await client.query('BEGIN');

    const { rows: venta } = await client.query(
      "SELECT * FROM ventas WHERE id = $1 AND estado = 'pendiente' AND tipo_venta IN ('contrato', 'separacion') FOR UPDATE",
      [req.params.id]
    );
    if (venta.length === 0) return res.status(404).json({ error: 'Venta pendiente no encontrada' });

    const nuevoActo = Number(venta[0].monto_acta) + Number(monto);
    const nuevoTotal = Number(venta[0].total) + Number(monto);
    const { rows: detalles } = await client.query(
      'SELECT SUM(dv.precio_base_unitario * dv.cantidad) as total_base FROM detalle_ventas dv WHERE dv.venta_id = $1',
      [req.params.id]
    );
    const totalBase = Number(detalles[0]?.total_base) || 0;
    const completada = nuevoTotal >= totalBase;

    await client.query(
      'UPDATE ventas SET monto_acta = $1, total = $2, estado = $3 WHERE id = $4',
      [nuevoActo, nuevoTotal, completada ? 'completada' : 'pendiente', req.params.id]
    );

    await client.query('COMMIT');
    res.json({ message: completada ? 'Venta completada' : 'Abono registrado', total: nuevoTotal, estado: completada ? 'completada' : 'pendiente' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

exports.remove = async (req, res) => {
  const client = await getConnection();

  try {
    await client.query('BEGIN');

    const { rows: detalles } = await client.query(
      'SELECT producto_id, cantidad FROM detalle_ventas WHERE venta_id = $1',
      [req.params.id]
    );

    for (const det of detalles) {
      await client.query(
        'UPDATE productos SET stock = stock + $1 WHERE id = $2',
        [det.cantidad, det.producto_id]
      );
    }

    await client.query('DELETE FROM ventas WHERE id = $1', [req.params.id]);

    await client.query('COMMIT');
    res.json({ message: 'Venta eliminada. Stock restaurado.' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};
