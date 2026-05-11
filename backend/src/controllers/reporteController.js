const PDFDocument = require('pdfkit');
const { db } = require('../config/database');
const { generarReporteVendedor, generarReporteGeneral, generarReporteInventario } = require('../services/pdfService');
const { calcularResumenVentas } = require('../utils/calculations');

exports.reportePorVendedor = async (req, res) => {
  try {
    const { id } = req.params;
    const { desde, hasta } = req.query;

    const [vendedores] = await db.async.query(
      'SELECT id, nombre, apellido, email, telefono, sueldo_fijo FROM vendedores WHERE id = ? AND activo = 1',
      [id]
    );
    if (vendedores.length === 0) {
      return res.status(404).json({ error: 'Vendedor no encontrado' });
    }

    let query = `
      SELECT dv.*, v.fecha, p.nombre AS producto_nombre, p.codigo AS producto_codigo
      FROM detalle_ventas dv
      JOIN ventas v ON dv.venta_id = v.id
      JOIN productos p ON dv.producto_id = p.id
      WHERE v.vendedor_id = ?`;
    const params = [id];

    if (desde) { query += ' AND v.fecha >= ?'; params.push(desde); }
    if (hasta) { query += ' AND v.fecha <= ?'; params.push(hasta); }
    query += ' ORDER BY v.fecha DESC';

    const [detalles] = await db.async.query(query, params);

    if (detalles.length === 0) {
      return res.status(404).json({ error: 'No hay ventas para este vendedor en el período seleccionado' });
    }

    const resumen = calcularResumenVentas(detalles);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=reporte_vendedor_${id}.pdf`);

    doc.pipe(res);
    generarReporteVendedor(doc, vendedores[0], detalles, resumen);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.reporteGeneral = async (req, res) => {
  try {
    const { desde, hasta } = req.query;

    let query = `
      SELECT dv.*, v.fecha, v.vendedor_id, v.total AS venta_total,
             ve.nombre AS vendedor_nombre, ve.apellido AS vendedor_apellido,
             p.nombre AS producto_nombre, p.codigo AS producto_codigo
      FROM detalle_ventas dv
      JOIN ventas v ON dv.venta_id = v.id
      JOIN vendedores ve ON v.vendedor_id = ve.id
      JOIN productos p ON dv.producto_id = p.id
      WHERE 1=1`;
    const params = [];

    if (desde) { query += ' AND v.fecha >= ?'; params.push(desde); }
    if (hasta) { query += ' AND v.fecha <= ?'; params.push(hasta); }
    query += ' ORDER BY v.fecha DESC';

    const [detalles] = await db.async.query(query, params);

    const resumenGlobal = calcularResumenVentas(detalles);

    const [vendedoresResumen] = await db.async.query(`
      SELECT ve.id, ve.nombre, ve.apellido, ve.sueldo_fijo,
             COUNT(DISTINCT v.id) AS total_ventas,
             COALESCE(SUM(dv.subtotal), 0) AS total_monto,
             COALESCE(SUM(dv.precio_base_unitario * dv.cantidad) * 0.02, 0) AS total_comision
      FROM vendedores ve
      LEFT JOIN ventas v ON ve.id = v.vendedor_id
      LEFT JOIN detalle_ventas dv ON v.id = dv.venta_id
      WHERE ve.activo = 1
      GROUP BY ve.id
      ORDER BY total_monto DESC
    `);

    const vendedoresData = vendedoresResumen.map(vd => {
      const comision = Number(vd.total_comision) || 0;
      const sueldoFijo = Number(vd.sueldo_fijo) || 350;
      const totalPagar = Math.round((comision + sueldoFijo) * 100) / 100;
      return {
        ...vd,
        total_monto: Number(vd.total_monto) || 0,
        total_comision: comision,
        total_pagar: totalPagar
      };
    });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte_general.pdf');

    doc.pipe(res);
    generarReporteGeneral(doc, detalles, resumenGlobal, vendedoresData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.reporteInventario = async (req, res) => {
  try {
    const [productos] = await db.async.query(
      'SELECT id, codigo, nombre, costo, precio_base, stock, stock_minimo FROM productos WHERE activo = 1 ORDER BY nombre'
    );

    const [movimientos] = await db.async.query(`
      SELECT im.*, p.nombre AS producto_nombre
      FROM inventario_movimientos im
      JOIN productos p ON im.producto_id = p.id
      ORDER BY im.created_at DESC
      LIMIT 200
    `);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte_inventario.pdf');

    doc.pipe(res);
    generarReporteInventario(doc, productos, movimientos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
