const { query } = require('../config/database');
const { exportToExcel, addSheet } = require('../services/excelService');

exports.productos = async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT codigo, nombre, categoria, medida, costo, precio_base, stock, stock_minimo FROM productos WHERE activo = true ORDER BY nombre'
    );
    const workbook = await exportToExcel(rows, [
      { header: 'Código', key: 'codigo', width: 15 },
      { header: 'Nombre', key: 'nombre', width: 35 },
      { header: 'Categoría', key: 'categoria', width: 20 },
      { header: 'Medida', key: 'medida', width: 12 },
      { header: 'Costo', key: 'costo', width: 15 },
      { header: 'Precio Base', key: 'precio_base', width: 15 },
      { header: 'Stock', key: 'stock', width: 10 },
      { header: 'Stock Mínimo', key: 'stock_minimo', width: 12 },
    ], 'productos');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=productos.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.ventas = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    let sql = `
      SELECT v.id, v.fecha, ve.nombre || ' ' || ve.apellido as vendedor, v.total as total_venta
      FROM ventas v
      JOIN vendedores ve ON v.vendedor_id = ve.id
      WHERE 1=1`;
    const params = [];
    let idx = 1;
    if (desde) { sql += ` AND v.fecha >= $${idx++}`; params.push(desde); }
    if (hasta) { sql += ` AND v.fecha <= $${idx++}`; params.push(hasta); }
    sql += ' ORDER BY v.fecha DESC';

    const { rows } = await query(sql, params);
    const workbook = await exportToExcel(rows, [
      { header: '#', key: 'id', width: 8 },
      { header: 'Fecha', key: 'fecha', width: 15 },
      { header: 'Vendedor', key: 'vendedor', width: 25 },
      { header: 'Total', key: 'total_venta', width: 15 },
    ], 'ventas');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=ventas.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.inventario = async (req, res) => {
  try {
    const { tipo, desde, hasta } = req.query;
    const { rows: productos } = await query(
      "SELECT codigo, nombre, categoria, medida, costo, precio_base, stock, stock_minimo, CASE WHEN stock <= stock_minimo THEN 'Bajo' ELSE 'Normal' END as estado FROM productos WHERE activo = true ORDER BY nombre"
    );
    let sqlMov = 'SELECT im.created_at as fecha, p.nombre as producto, im.tipo, im.cantidad, im.referencia FROM inventario_movimientos im JOIN productos p ON im.producto_id = p.id WHERE 1=1';
    const params = []; let idx = 1;
    if (desde) { sqlMov += ` AND im.created_at >= $${idx++}`; params.push(desde); }
    if (hasta) { sqlMov += ` AND im.created_at <= $${idx++}`; params.push(hasta); }
    if (tipo) { sqlMov += ` AND im.tipo = $${idx++}`; params.push(tipo); }
    sqlMov += ' ORDER BY im.created_at DESC LIMIT 500';
    const { rows: movimientos } = await query(sqlMov, params);

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    addSheet(workbook, 'Stock', [
      { header: 'Código', key: 'codigo', width: 15 },
      { header: 'Nombre', key: 'nombre', width: 35 },
      { header: 'Categoría', key: 'categoria', width: 20 },
      { header: 'Medida', key: 'medida', width: 12 },
      { header: 'Costo', key: 'costo', width: 15 },
      { header: 'Precio Base', key: 'precio_base', width: 15 },
      { header: 'Stock', key: 'stock', width: 10 },
      { header: 'Estado', key: 'estado', width: 12 },
    ], productos);
    addSheet(workbook, 'Movimientos', [
      { header: 'Fecha', key: 'fecha', width: 20 },
      { header: 'Producto', key: 'producto', width: 35 },
      { header: 'Tipo', key: 'tipo', width: 12 },
      { header: 'Cantidad', key: 'cantidad', width: 10 },
      { header: 'Referencia', key: 'referencia', width: 30 },
    ], movimientos);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=inventario.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.movimientos = async (req, res) => {
  try {
    const { tipo } = req.query;
    let sql = 'SELECT im.created_at as fecha, p.nombre as producto, im.tipo, im.cantidad, im.referencia FROM inventario_movimientos im JOIN productos p ON im.producto_id = p.id WHERE 1=1';
    const params = []; let idx = 1;
    if (tipo) { sql += ` AND im.tipo = $${idx++}`; params.push(tipo); }
    sql += ' ORDER BY im.created_at DESC LIMIT 500';
    const { rows } = await query(sql, params);

    const workbook = await exportToExcel(rows, [
      { header: 'Fecha', key: 'fecha', width: 20 },
      { header: 'Producto', key: 'producto', width: 35 },
      { header: 'Tipo', key: 'tipo', width: 12 },
      { header: 'Cantidad', key: 'cantidad', width: 10 },
      { header: 'Referencia', key: 'referencia', width: 30 },
    ], 'movimientos');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=movimientos.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.vendedores = async (req, res) => {
  try {
    const { rows } = await query(
      "SELECT nombre, apellido, email, telefono, sueldo_fijo, CASE WHEN activo THEN 'Activo' ELSE 'Inactivo' END as estado FROM vendedores ORDER BY nombre"
    );
    const workbook = await exportToExcel(rows, [
      { header: 'Nombre', key: 'nombre', width: 20 },
      { header: 'Apellido', key: 'apellido', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Teléfono', key: 'telefono', width: 15 },
      { header: 'Sueldo Fijo', key: 'sueldo_fijo', width: 15 },
      { header: 'Estado', key: 'estado', width: 10 },
    ], 'vendedores');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=vendedores.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
