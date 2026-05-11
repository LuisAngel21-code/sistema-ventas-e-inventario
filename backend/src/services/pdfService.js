const PDFDocument = require('pdfkit');
const pool = require('../config/database');
const { calcularResumenVentas } = require('../utils/calculations');

function generarReporteVendedor(doc, vendedor, ventas, resumen) {
  const pageWidth = doc.page.width;
  const margin = 50;
  const usableWidth = pageWidth - margin * 2;

  doc.font('Helvetica-Bold').fontSize(20).text('TIENDA DE CAMAS Y COLCHONES', { align: 'center' });
  doc.fontSize(12).font('Helvetica').text('Reporte de Ventas por Vendedor', { align: 'center' });
  doc.moveDown(0.5);

  doc.fontSize(10).fillColor('#666')
    .text(`Generado el: ${new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });
  doc.moveDown(1);

  doc.rect(margin, doc.y, usableWidth, 80).fillAndStroke('#f8f9fa', '#dee2e6');
  doc.fillColor('#333').fontSize(11);

  doc.text(`Vendedor: ${vendedor.nombre} ${vendedor.apellido}`, margin + 10, doc.y + 10);
  doc.text(`Email: ${vendedor.email || '---'}`, margin + 10, doc.y + 25);
  doc.text(`Teléfono: ${vendedor.telefono || '---'}`, margin + 10, doc.y + 40);
  doc.text(`Sueldo Fijo: S/ ${vendedor.sueldo_fijo.toFixed(2)}`, margin + 10, doc.y + 55);

  doc.fillColor('#000');
  doc.moveDown(3);

  const tableTop = doc.y;
  const colWidths = [25, 50, 55, 45, 50, 50, 45];
  const headers = ['#', 'Fecha', 'Producto', 'Costo', 'P. Base', 'P. Final', 'Sobrepr.'];

  doc.font('Helvetica-Bold').fontSize(8).fillColor('#fff');
  let xPos = margin;
  doc.rect(margin, tableTop, usableWidth, 18).fill('#2c3e50');
  headers.forEach((h, i) => {
    doc.text(h, xPos + 3, tableTop + 4, { width: colWidths[i], align: 'center' });
    xPos += colWidths[i];
  });

  doc.fillColor('#000');
  let yPos = tableTop + 22;

  ventas.forEach((v, idx) => {
    if (yPos > doc.page.height - 80) {
      doc.addPage();
      yPos = 50;
    }

    if (idx % 2 === 0) {
      doc.rect(margin, yPos - 4, usableWidth, 18).fill('#f1f3f5');
    }

    doc.font('Helvetica').fontSize(8);
    xPos = margin;
    const row = [
      String(idx + 1),
      new Date(v.fecha).toLocaleDateString('es-PE'),
      (v.producto_nombre || '').substring(0, 12),
      `S/ ${Number(v.costo_unitario).toFixed(2)}`,
      `S/ ${Number(v.precio_base_unitario).toFixed(2)}`,
      `S/ ${Number(v.precio_final_unitario).toFixed(2)}`,
      `S/ ${Number(v.sobreprecio_unitario).toFixed(2)}`
    ];

    row.forEach((val, i) => {
      doc.text(val, xPos + 3, yPos, { width: colWidths[i], align: 'center' });
      xPos += colWidths[i];
    });
    yPos += 18;
  });

  doc.moveDown(2);
  const summaryTop = yPos + 10;

  doc.rect(margin, summaryTop, usableWidth, 130).fillAndStroke('#f8f9fa', '#2c3e50');
  doc.fillColor('#2c3e50').font('Helvetica-Bold').fontSize(12)
    .text('RESUMEN DE PAGO', margin + 10, summaryTop + 10);

  doc.fillColor('#333').font('Helvetica').fontSize(11);
  const lineHeight = 18;
  let sy = summaryTop + 35;

  doc.text(`Total de Ventas:`, margin + 15, sy);
  doc.text(`S/ ${resumen.totalVentas.toFixed(2)}`, margin + usableWidth - 100, sy, { width: 90, align: 'right' });
  sy += lineHeight;

  doc.text(`Comisión (2%):`, margin + 15, sy);
  doc.text(`S/ ${resumen.totalComision.toFixed(2)}`, margin + usableWidth - 100, sy, { width: 90, align: 'right' });
  sy += lineHeight;

  doc.text(`Sobreprecio Total:`, margin + 15, sy);
  doc.text(`S/ ${resumen.totalSobreprecio.toFixed(2)}`, margin + usableWidth - 100, sy, { width: 90, align: 'right' });
  sy += lineHeight;

  doc.text(`50% Sobreprecio para Vendedor:`, margin + 15, sy);
  doc.text(`S/ ${resumen.totalGananciaSobreprecio.toFixed(2)}`, margin + usableWidth - 100, sy, { width: 90, align: 'right' });
  sy += lineHeight;

  doc.text(`Sueldo Fijo:`, margin + 15, sy);
  doc.text(`S/ ${resumen.sueldoFijo.toFixed(2)}`, margin + usableWidth - 100, sy, { width: 90, align: 'right' });
  sy += lineHeight + 5;

  doc.rect(margin, sy - 5, usableWidth, 30).fill('#2c3e50');
  doc.fillColor('#fff').font('Helvetica-Bold').fontSize(13);
  doc.text(`TOTAL A PAGAR:`, margin + 15, sy + 5);
  doc.text(`S/ ${resumen.totalAPagar.toFixed(2)}`, margin + usableWidth - 100, sy + 5, { width: 90, align: 'right' });

  doc.fillColor('#666').font('Helvetica').fontSize(8);
  doc.text('Sistema de Ventas e Inventario - Tienda de Camas y Colchones', margin, doc.page.height - 50, { align: 'center', width: usableWidth });

  doc.end();
}

function generarReporteGeneral(doc, ventas, resumenGlobal, vendedoresData) {
  const pageWidth = doc.page.width;
  const margin = 50;
  const usableWidth = pageWidth - margin * 2;

  doc.font('Helvetica-Bold').fontSize(20).text('TIENDA DE CAMAS Y COLCHONES', { align: 'center' });
  doc.fontSize(12).font('Helvetica').text('Reporte General de Ventas', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#666')
    .text(`Generado el: ${new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });
  doc.moveDown(1);

  doc.rect(margin, doc.y, usableWidth, 60).fillAndStroke('#f8f9fa', '#dee2e6');
  doc.fillColor('#333').fontSize(11);
  doc.text(`Total de Ventas: ${ventas.length}`, margin + 10, doc.y + 10);
  doc.text(`Total Ingresos: S/ ${resumenGlobal.totalVentas.toFixed(2)}`, margin + 10, doc.y + 25);
  doc.text(`Total Comisiones: S/ ${resumenGlobal.totalComision.toFixed(2)}`, margin + 10, doc.y + 40);

  doc.fillColor('#000');
  doc.moveDown(3);

  const tableTop = doc.y;
  const colWidths = [25, 60, 60, 55, 50, 50];
  const headers = ['#', 'Fecha', 'Vendedor', 'Producto', 'Subtotal', 'Sobrepr.'];

  doc.font('Helvetica-Bold').fontSize(8).fillColor('#fff');
  let xPos = margin;
  doc.rect(margin, tableTop, usableWidth, 18).fill('#2c3e50');
  headers.forEach((h, i) => {
    doc.text(h, xPos + 3, tableTop + 4, { width: colWidths[i], align: 'center' });
    xPos += colWidths[i];
  });

  doc.fillColor('#000');
  let yPos = tableTop + 22;

  ventas.forEach((v, idx) => {
    if (yPos > doc.page.height - 80) {
      doc.addPage();
      yPos = 50;
    }

    if (idx % 2 === 0) {
      doc.rect(margin, yPos - 4, usableWidth, 18).fill('#f1f3f5');
    }

    doc.font('Helvetica').fontSize(8);
    xPos = margin;
    const row = [
      String(idx + 1),
      new Date(v.fecha).toLocaleDateString('es-PE'),
      (v.vendedor_nombre || '').substring(0, 12),
      (v.producto_nombre || '').substring(0, 12),
      `S/ ${Number(v.subtotal || v.total || 0).toFixed(2)}`,
      `S/ ${Number(v.sobreprecio_unitario || 0).toFixed(2)}`
    ];

    row.forEach((val, i) => {
      doc.text(val, xPos + 3, yPos, { width: colWidths[i], align: 'center' });
      xPos += colWidths[i];
    });
    yPos += 18;
  });

  doc.moveDown(2);

  if (vendedoresData && vendedoresData.length > 0) {
    const resumenTop = yPos + 10;
    doc.rect(margin, resumenTop, usableWidth, 150).fillAndStroke('#f8f9fa', '#2c3e50');
    doc.fillColor('#2c3e50').font('Helvetica-Bold').fontSize(12)
      .text('RESUMEN POR VENDEDOR', margin + 10, resumenTop + 10);

    let ry = resumenTop + 35;
    doc.font('Helvetica').fontSize(9);
    doc.fillColor('#fff');
    doc.rect(margin + 5, ry - 4, usableWidth - 10, 16).fill('#34495e');
    doc.text('Vendedor', margin + 10, ry);
    doc.text('Ventas', margin + 130, ry, { width: 60, align: 'center' });
    doc.text('Total', margin + 180, ry, { width: 70, align: 'center' });
    doc.text('Comisión', margin + 240, ry, { width: 70, align: 'center' });
    doc.text('A Pagar', margin + 300, ry, { width: 70, align: 'right' });
    ry += 20;

    doc.fillColor('#333');
    vendedoresData.forEach((vd, idx) => {
      if (idx % 2 === 0) doc.rect(margin + 5, ry - 4, usableWidth - 10, 16).fill('#f1f3f5');
      doc.text(vd.nombre, margin + 10, ry);
      doc.text(String(vd.total_ventas), margin + 130, ry, { width: 60, align: 'center' });
      doc.text(`S/ ${vd.total_monto.toFixed(2)}`, margin + 180, ry, { width: 70, align: 'center' });
      doc.text(`S/ ${vd.total_comision.toFixed(2)}`, margin + 240, ry, { width: 70, align: 'center' });
      doc.text(`S/ ${vd.total_pagar.toFixed(2)}`, margin + 300, ry, { width: 70, align: 'right' });
      ry += 16;
    });
  }

  doc.fillColor('#666').font('Helvetica').fontSize(8);
  doc.text('Sistema de Ventas e Inventario - Tienda de Camas y Colchones', margin, doc.page.height - 50, { align: 'center', width: usableWidth });

  doc.end();
}

function generarReporteInventario(doc, productos, movimientos) {
  const margin = 50;
  const usableWidth = doc.page.width - margin * 2;

  doc.font('Helvetica-Bold').fontSize(20).text('TIENDA DE CAMAS Y COLCHONES', { align: 'center' });
  doc.fontSize(12).font('Helvetica').text('Reporte de Inventario', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#666')
    .text(`Generado el: ${new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });
  doc.moveDown(1);

  const tableTop = doc.y;
  const colWidths = [25, 50, 80, 50, 50, 50];
  const headers = ['#', 'Código', 'Producto', 'Costo', 'Stock', 'Estado'];

  doc.font('Helvetica-Bold').fontSize(8).fillColor('#fff');
  let xPos = margin;
  doc.rect(margin, tableTop, usableWidth, 18).fill('#2c3e50');
  headers.forEach((h, i) => {
    doc.text(h, xPos + 3, tableTop + 4, { width: colWidths[i], align: 'center' });
    xPos += colWidths[i];
  });

  doc.fillColor('#000');
  let yPos = tableTop + 22;

  productos.forEach((p, idx) => {
    if (yPos > doc.page.height - 80) {
      doc.addPage();
      yPos = 50;
    }

    if (idx % 2 === 0) {
      doc.rect(margin, yPos - 4, usableWidth, 18).fill('#f1f3f5');
    }

    const isLowStock = p.stock <= p.stock_minimo;
    if (isLowStock) {
      doc.fillColor('#e74c3c');
    }

    doc.font(isLowStock ? 'Helvetica-Bold' : 'Helvetica').fontSize(8);
    xPos = margin;
    const row = [
      String(idx + 1),
      p.codigo || '---',
      (p.nombre || '').substring(0, 18),
      `S/ ${Number(p.costo).toFixed(2)}`,
      String(p.stock),
      isLowStock ? 'Stock Bajo!' : 'Normal'
    ];

    row.forEach((val, i) => {
      doc.text(val, xPos + 3, yPos, { width: colWidths[i], align: 'center' });
      xPos += colWidths[i];
    });
    doc.fillColor('#000');
    yPos += 18;
  });

  doc.fillColor('#666').font('Helvetica').fontSize(8);
  doc.text('Sistema de Ventas e Inventario - Tienda de Camas y Colchones', margin, doc.page.height - 50, { align: 'center', width: usableWidth });

  doc.end();
}

module.exports = { generarReporteVendedor, generarReporteGeneral, generarReporteInventario };
