const PDFDocument = require('pdfkit');
const { query } = require('../config/database');

async function getBalanceData(desde, hasta) {
  const [{ rows: ventas }] = await Promise.all([
    query("SELECT COALESCE(SUM(total), 0) as total FROM ventas WHERE fecha >= $1 AND fecha <= $2 AND estado = 'completada'", [desde, hasta]),
  ]);

  const [{ rows: ingresosCaja }] = await Promise.all([
    query("SELECT COALESCE(SUM(cm.monto), 0) as total FROM caja_movimientos cm JOIN caja_sesiones cs ON cm.sesion_id = cs.id WHERE cm.tipo = 'ingreso' AND cs.fecha_apertura >= $1 AND cs.fecha_apertura <= $2", [desde, hasta]),
  ]);

  const [{ rows: comisiones }] = await Promise.all([
    query("SELECT COALESCE(SUM(total_pago), 0) as total FROM pagos_vendedor WHERE estado = 'pagado' AND pagado_en >= $1 AND pagado_en <= $2", [desde, hasta]),
  ]);

  const [{ rows: retiros }] = await Promise.all([
    query("SELECT COALESCE(SUM(cm.monto), 0) as total FROM caja_movimientos cm JOIN caja_sesiones cs ON cm.sesion_id = cs.id WHERE cm.tipo = 'egreso' AND cm.categoria = 'retiro' AND cs.fecha_apertura >= $1 AND cs.fecha_apertura <= $2", [desde, hasta]),
  ]);

  const [{ rows: gastosReales }] = await Promise.all([
    query("SELECT COALESCE(SUM(cm.monto), 0) as total FROM caja_movimientos cm JOIN caja_sesiones cs ON cm.sesion_id = cs.id WHERE cm.tipo = 'egreso' AND (cm.categoria IS NULL OR cm.categoria = 'gasto') AND cs.fecha_apertura >= $1 AND cs.fecha_apertura <= $2", [desde, hasta]),
  ]);

  return {
    ventas: Number(ventas[0].total),
    otrosIngresos: Number(ingresosCaja[0].total),
    comisiones: Number(comisiones[0].total),
    gastosCaja: Number(gastosReales[0].total),
    retiros: Number(retiros[0].total),
  };
}

exports.getBalance = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    if (!desde || !hasta) return res.status(400).json({ error: 'Parámetros desde y hasta requeridos' });

    const d = await getBalanceData(desde, hasta);
    const totalIngresos = d.ventas + d.otrosIngresos;
    const totalEgresos = d.comisiones + d.gastosCaja;
    const ganancia = totalIngresos - totalEgresos;
    const margen = totalIngresos > 0 ? Math.round((ganancia / totalIngresos) * 10000) / 100 : 0;

    res.json({
      ingresos: { ventas: d.ventas, otros_ingresos: d.otrosIngresos, total: totalIngresos },
      egresos: { comisiones: d.comisiones, gastos_caja: d.gastosCaja, total: totalEgresos },
      retiros: d.retiros,
      resultado: { ganancia, margen },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.exportPdf = async (req, res) => {
  try {
    const { desde, hasta, alquiler } = req.query;
    if (!desde || !hasta) return res.status(400).json({ error: 'Parámetros desde y hasta requeridos' });

    const d = await getBalanceData(desde, hasta);
    const montoAlquiler = Number(alquiler) || 0;
    const totalIngresos = d.ventas + d.otrosIngresos;
    const totalEgresos = d.comisiones + d.gastosCaja + montoAlquiler;
    const ganancia = totalIngresos - totalEgresos;
    const margen = totalIngresos > 0 ? Math.round((ganancia / totalIngresos) * 10000) / 100 : 0;

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=balance_general.pdf');

    const chunks = [];
    const stream = doc.pipe(require('stream').PassThrough());
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('end', () => {
      const pdf = Buffer.concat(chunks);
      res.send(pdf);
    });

    const m = 50;
    const w = doc.page.width - m * 2;
    let y = m;

    doc.font('Helvetica-Bold').fontSize(20).text('Mueblería Cams', m, y, { align: 'center', width: w });
    y += 28;
    doc.fontSize(14).font('Helvetica').text('Balance General', m, y, { align: 'center', width: w });
    y += 20;
    doc.fontSize(10).fillColor('#666')
      .text(`${new Date(desde).toLocaleDateString('es-PE')} — ${new Date(hasta).toLocaleDateString('es-PE')}`, m, y, { align: 'center', width: w });
    y += 30;

    // INGRESOS
    doc.fillColor('#1e3a5f').font('Helvetica-Bold').fontSize(12);
    doc.text('INGRESOS', m, y);
    y += 20;

    doc.rect(m, y, w, 16).fill('#f0fdf4');
    doc.fillColor('#333').font('Helvetica').fontSize(10);
    doc.text('Ventas', m + 10, y + 4);
    doc.text(`S/ ${d.ventas.toFixed(2)}`, m + w - 10, y + 4, { align: 'right', width: 90 });
    y += 16;

    doc.rect(m, y, w, 16).fill('#fff');
    doc.fillColor('#333').font('Helvetica').fontSize(10);
    doc.text('Otros ingresos', m + 10, y + 4);
    doc.text(`S/ ${d.otrosIngresos.toFixed(2)}`, m + w - 10, y + 4, { align: 'right', width: 90 });
    y += 16;

    doc.rect(m, y, w, 18).fill('#dcfce7');
    doc.fillColor('#166534').font('Helvetica-Bold').fontSize(10);
    doc.text('Total Ingresos', m + 10, y + 4);
    doc.text(`S/ ${totalIngresos.toFixed(2)}`, m + w - 10, y + 4, { align: 'right', width: 90 });
    y += 28;

    // EGRESOS
    doc.fillColor('#991b1b').font('Helvetica-Bold').fontSize(12);
    doc.text('EGRESOS', m, y);
    y += 20;

    doc.rect(m, y, w, 16).fill('#fef2f2');
    doc.fillColor('#333').font('Helvetica').fontSize(10);
    doc.text('Comisiones vendedores', m + 10, y + 4);
    doc.text(`S/ ${d.comisiones.toFixed(2)}`, m + w - 10, y + 4, { align: 'right', width: 90 });
    y += 16;

    if (montoAlquiler > 0) {
      doc.rect(m, y, w, 16).fill('#fff');
      doc.fillColor('#333').font('Helvetica').fontSize(10);
      doc.text('Alquiler tienda', m + 10, y + 4);
      doc.text(`S/ ${montoAlquiler.toFixed(2)}`, m + w - 10, y + 4, { align: 'right', width: 90 });
      y += 16;
    }

    doc.rect(m, y, w, 16).fill('#fff');
    doc.fillColor('#333').font('Helvetica').fontSize(10);
    doc.text('Gastos de caja', m + 10, y + 4);
    doc.text(`S/ ${d.gastosCaja.toFixed(2)}`, m + w - 10, y + 4, { align: 'right', width: 90 });
    y += 16;

    doc.rect(m, y, w, 18).fill('#fee2e2');
    doc.fillColor('#991b1b').font('Helvetica-Bold').fontSize(10);
    doc.text('Total Egresos', m + 10, y + 4);
    doc.text(`S/ ${totalEgresos.toFixed(2)}`, m + w - 10, y + 4, { align: 'right', width: 90 });
    y += 30;

    // RESULTADO
    doc.rect(m, y, w, 24).fill('#1e3a5f');
    doc.fillColor('#fff').font('Helvetica-Bold').fontSize(14);
    doc.text('GANANCIA NETA', m + 10, y + 6);
    doc.text(`S/ ${ganancia.toFixed(2)}`, m + w - 10, y + 6, { align: 'right', width: 90 });
    y += 30;

    doc.fillColor('#666').font('Helvetica').fontSize(10);
    doc.text(`Margen: ${margen}%`, m, y);
    y += 16;

    if (d.retiros > 0) {
      doc.text(`Retiros del dueño: S/ ${d.retiros.toFixed(2)}`, m, y);
    }

    y = doc.page.height - 60;
    doc.fillColor('#999').font('Helvetica').fontSize(8);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-PE')}`, m, y, { align: 'center', width: w });

    doc.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
