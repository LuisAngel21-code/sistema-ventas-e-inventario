const { query } = require('../config/database');

exports.sesionActual = async (req, res) => {
  try {
    const { rows } = await query(
      "SELECT * FROM caja_sesiones WHERE estado = 'abierta' ORDER BY fecha_apertura DESC LIMIT 1"
    );
    if (rows.length === 0) return res.json({ sesion: null });
    res.json({ sesion: rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.abrir = async (req, res) => {
  try {
    const { saldo_inicial } = req.body;
    const { rows: abierta } = await query(
      "SELECT id FROM caja_sesiones WHERE estado = 'abierta' LIMIT 1"
    );
    if (abierta.length > 0) {
      return res.status(400).json({ error: 'Ya hay una caja abierta. Ciérrela primero.' });
    }
    const { rows } = await query(
      'INSERT INTO caja_sesiones (saldo_inicial, saldo_final) VALUES ($1, $1) RETURNING *',
      [saldo_inicial || 0]
    );
    res.status(201).json({ sesion: rows[0], message: 'Caja abierta' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.cerrar = async (req, res) => {
  try {
    const { rows: sesion } = await query(
      "SELECT * FROM caja_sesiones WHERE estado = 'abierta' LIMIT 1"
    );
    if (sesion.length === 0) return res.status(400).json({ error: 'No hay caja abierta' });

    const { rows: totales } = await query(
      'SELECT COALESCE(SUM(CASE WHEN tipo = $1 THEN monto ELSE 0 END), 0) as ing, COALESCE(SUM(CASE WHEN tipo = $2 THEN monto ELSE 0 END), 0) as eg FROM caja_movimientos WHERE sesion_id = $3',
      ['ingreso', 'egreso', sesion[0].id]
    );

    const saldoFinal = Number(sesion[0].saldo_inicial) + Number(totales[0].ing) - Number(totales[0].eg);

    const { rows } = await query(
      'UPDATE caja_sesiones SET estado = $1, fecha_cierre = NOW(), saldo_final = $2, total_ingresos = $3, total_egresos = $4 WHERE id = $5 RETURNING *',
      ['cerrada', saldoFinal, totales[0].ing, totales[0].eg, sesion[0].id]
    );

    res.json({ sesion: rows[0], message: 'Caja cerrada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.movimientos = async (req, res) => {
  try {
    const { sesion_id } = req.query;
    let sql = 'SELECT cm.*, cs.fecha_apertura FROM caja_movimientos cm JOIN caja_sesiones cs ON cm.sesion_id = cs.id';
    const params = [];
    let idx = 1;

    if (sesion_id) { sql += ` WHERE cm.sesion_id = $${idx++}`; params.push(sesion_id); }
    sql += ' ORDER BY cm.created_at DESC';

    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.registrar = async (req, res) => {
  try {
    const { tipo, tipo_pago, nro_comprobante, descripcion, monto, categoria } = req.body;

    if (!tipo || !tipo_pago || !monto || monto <= 0) {
      return res.status(400).json({ error: 'Tipo, tipo de pago y monto válido requeridos' });
    }

    const { rows: sesion } = await query(
      "SELECT * FROM caja_sesiones WHERE estado = 'abierta' LIMIT 1"
    );
    if (sesion.length === 0) return res.status(400).json({ error: 'No hay caja abierta. Abra la caja primero.' });

    const { rows: totales } = await query(
      'SELECT COALESCE(SUM(CASE WHEN tipo = $1 THEN monto ELSE 0 END), 0) as ing, COALESCE(SUM(CASE WHEN tipo = $2 THEN monto ELSE 0 END), 0) as eg FROM caja_movimientos WHERE sesion_id = $3',
      ['ingreso', 'egreso', sesion[0].id]
    );

    const saldoActual = Number(sesion[0].saldo_inicial) + Number(totales[0].ing) - Number(totales[0].eg);
    const saldoDespues = tipo === 'ingreso' ? saldoActual + Number(monto) : saldoActual - Number(monto);
    if (saldoDespues < 0) return res.status(400).json({ error: 'Saldo insuficiente' });

    const cat = tipo === 'egreso' ? (categoria || 'gasto') : null;
    const { rows } = await query(
      'INSERT INTO caja_movimientos (sesion_id, tipo, tipo_pago, nro_comprobante, descripcion, monto, saldo_despues, categoria) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [sesion[0].id, tipo, tipo_pago, nro_comprobante || null, descripcion || null, monto, saldoDespues, cat]
    );

    await query('UPDATE caja_sesiones SET saldo_final = $1 WHERE id = $2', [saldoDespues, sesion[0].id]);

    res.status(201).json({ movimiento: rows[0], saldo: saldoDespues, message: 'Movimiento registrado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

async function recalcularSaldos(sesionId) {
  const { rows: sesion } = await query('SELECT saldo_inicial FROM caja_sesiones WHERE id = $1', [sesionId]);
  if (sesion.length === 0) return;

  let saldo = Number(sesion[0].saldo_inicial);
  const { rows: movs } = await query(
    'SELECT id, tipo, monto FROM caja_movimientos WHERE sesion_id = $1 ORDER BY id',
    [sesionId]
  );

  for (const m of movs) {
    saldo = m.tipo === 'ingreso' ? saldo + Number(m.monto) : saldo - Number(m.monto);
    await query('UPDATE caja_movimientos SET saldo_despues = $1 WHERE id = $2', [saldo, m.id]);
  }

  await query('UPDATE caja_sesiones SET saldo_final = $1 WHERE id = $2', [saldo, sesionId]);
}

exports.actualizar = async (req, res) => {
  try {
    const { tipo, tipo_pago, nro_comprobante, descripcion, monto, categoria } = req.body;
    const cat = tipo === 'egreso' ? (categoria || 'gasto') : null;
    const { rows } = await query(
      'UPDATE caja_movimientos SET tipo = $1, tipo_pago = $2, nro_comprobante = $3, descripcion = $4, monto = $5, categoria = $6 WHERE id = $7 RETURNING *',
      [tipo, tipo_pago, nro_comprobante, descripcion, monto, cat, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Movimiento no encontrado' });

    await recalcularSaldos(rows[0].sesion_id);
    res.json({ message: 'Movimiento actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.eliminar = async (req, res) => {
  try {
    const { rows } = await query('DELETE FROM caja_movimientos WHERE id = $1 RETURNING sesion_id', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Movimiento no encontrado' });

    await recalcularSaldos(rows[0].sesion_id);
    res.json({ message: 'Movimiento eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.exportarReporte = async (req, res) => {
  try {
    const { rows: sesion } = await query('SELECT * FROM caja_sesiones WHERE id = $1', [req.params.id]);
    if (sesion.length === 0) return res.status(404).json({ error: 'Sesión no encontrada' });

    const { rows: movimientos } = await query(
      'SELECT * FROM caja_movimientos WHERE sesion_id = $1 ORDER BY created_at ASC',
      [req.params.id]
    );

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    const stream = doc.pipe(require('stream').PassThrough());
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('end', () => {
      const pdf = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=reporte_caja.pdf');
      res.send(pdf);
    });
    stream.on('error', err => { if (!res.headersSent) res.status(500).json({ error: err.message }); });

    const m = 50;
    const w = doc.page.width - m * 2;
    let y = m;

    doc.font('Helvetica-Bold').fontSize(20).text('Mueblería Cams', m, y, { align: 'center', width: w });
    y += 28;
    doc.fontSize(14).font('Helvetica').text('Reporte Diario de Caja', m, y, { align: 'center', width: w });
    y += 20;
    doc.fontSize(10).fillColor('#666')
      .text(new Date(sesion[0].fecha_apertura).toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), m, y, { align: 'center', width: w });
    y += 8;
    doc.text(`Estado: ${sesion[0].estado === 'abierta' ? 'Abierta' : 'Cerrada'}`, m, y, { align: 'center', width: w });
    y += 25;

    // Saldo inicial
    doc.rect(m, y, w, 20).fill('#f8f9fa');
    doc.fillColor('#333').font('Helvetica-Bold').fontSize(11);
    doc.text('Saldo inicial:', m + 10, y + 5);
    doc.text(`S/ ${Number(sesion[0].saldo_inicial).toFixed(2)}`, m + w - 10, y + 5, { align: 'right' });
    y += 28;

    // Tabla movimientos
    doc.fillColor('#1e3a5f').font('Helvetica-Bold').fontSize(10);
    doc.text('MOVIMIENTOS', m, y);
    y += 18;

    const colW = [45, 65, 65, 170, 65];
    const headers = ['Hora', 'Tipo', 'Pago', 'Descripción', 'Monto'];
    doc.rect(m, y, w, 16).fill('#1e3a5f');
    doc.fillColor('#fff').font('Helvetica-Bold').fontSize(8);
    let x = m;
    headers.forEach((h, i) => { doc.text(h, x + 3, y + 4, { width: colW[i] }); x += colW[i]; });
    y += 18;

    let totalIng = 0, totalEgr = 0;
    doc.font('Helvetica').fontSize(8);
    movimientos.forEach((mv, idx) => {
      if (y > doc.page.height - 60) { doc.addPage(); y = 50; }
      if (idx % 2 === 0) doc.rect(m, y, w, 14).fill('#f8f9fa');
      doc.fillColor('#333');
      x = m;
      const vals = [
        new Date(mv.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
        mv.tipo === 'ingreso' ? 'Ingreso' : 'Egreso',
        mv.tipo_pago || '—',
        mv.descripcion || '—',
        `${mv.tipo === 'ingreso' ? '+' : '-'} S/ ${Number(mv.monto).toFixed(2)}`,
      ];
      vals.forEach((v, i) => { doc.text(v, x + 3, y + 3, { width: colW[i] }); x += colW[i]; });
      if (mv.tipo === 'ingreso') totalIng += Number(mv.monto);
      else totalEgr += Number(mv.monto);
      y += 14;
    });

    y += 10;
    if (y > doc.page.height - 80) { doc.addPage(); y = 50; }

    doc.rect(m, y, w, 60).fill('#f8f9fa');
    doc.fillColor('#333').font('Helvetica').fontSize(10);
    y += 8;
    doc.text(`Total Ingresos:`, m + 10, y);
    doc.text(`S/ ${totalIng.toFixed(2)}`, m + w - 10, y, { align: 'right' });
    y += 16;
    doc.text(`Total Egresos:`, m + 10, y);
    doc.text(`S/ ${totalEgr.toFixed(2)}`, m + w - 10, y, { align: 'right' });
    y += 16;
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#1e3a5f');
    doc.text(`Saldo Final:`, m + 10, y);
    doc.text(`S/ ${Number(sesion[0].saldo_final).toFixed(2)}`, m + w - 10, y, { align: 'right' });

    y = doc.page.height - 50;
    doc.fillColor('#999').font('Helvetica').fontSize(8);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-PE')}`, m, y, { align: 'center', width: w });

    doc.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.historial = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    let sql = 'SELECT * FROM caja_sesiones WHERE 1=1';
    const params = [];
    let idx = 1;
    if (desde) { sql += ` AND fecha_apertura >= $${idx++}`; params.push(desde); }
    if (hasta) { sql += ` AND fecha_apertura <= $${idx++}`; params.push(hasta); }
    sql += ' ORDER BY fecha_apertura DESC';

    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
