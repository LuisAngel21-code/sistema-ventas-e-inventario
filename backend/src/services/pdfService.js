const PDFDocument = require('pdfkit');
const pool = require('../config/database');
const { calcularResumenVentas } = require('../utils/calculations');

function generarReporteVendedor(doc, vendedor, ventas, resumen) {
  const pageWidth = doc.page.width;
  const margin = 50;
  const usableWidth = pageWidth - margin * 2;

  doc.font('Helvetica-Bold').fontSize(20).text('Mueblería Cams', { align: 'center' });
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
  doc.text('Mueblería Cams — Sistema de Gestión', margin, doc.page.height - 50, { align: 'center', width: usableWidth });

  doc.end();
}

module.exports = { generarReporteVendedor, generarReporteGeneral, generarReporteInventario };
