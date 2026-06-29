const { query } = require('../config/database');

exports.listar = async (req, res) => {
  try {
    const { persona_id, fuente } = req.query;
    let sql = `
      SELECT pv.id, 'vendedor' as fuente, pv.vendedor_id as persona_id, v.nombre, v.apellido,
             'Vendedor' as cargo, pv.semana_inicio, pv.semana_fin, pv.sueldo_base,
             pv.total_comision, pv.total_sobreprecio, pv.total_pago as total,
             pv.adelanto, pv.fecha_adelanto, pv.estado, pv.pagado_en
      FROM pagos_vendedor pv
      JOIN vendedores v ON pv.vendedor_id = v.id

      UNION ALL

      SELECT pt.id, 'trabajador' as fuente, pt.trabajador_id as persona_id, t.nombre, t.apellido,
             CASE t.tipo WHEN 'jornalero' THEN 'Jornalero' WHEN 'destajista' THEN 'Destajista' WHEN 'encargado' THEN 'Encargado' END as cargo,
             pt.semana_inicio, pt.semana_fin, 0 as sueldo_base, 0 as total_comision, 0 as total_sobreprecio,
             pt.total_pagar as total, 0 as adelanto, NULL as fecha_adelanto, pt.estado, pt.pagado_en
      FROM pagos_trabajadores pt
      JOIN trabajadores t ON pt.trabajador_id = t.id
      WHERE 1=1`;
    const params = []; let idx = 1;
    if (persona_id && fuente === 'vendedor') { sql += ` AND pv.vendedor_id = $${idx++}`; params.push(persona_id); }
    if (persona_id && fuente === 'trabajador') { sql += ` AND pt.trabajador_id = $${idx++}`; params.push(persona_id); }
    sql += ' ORDER BY semana_inicio DESC, nombre';
    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.personal = async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT id, nombre, apellido, 'Vendedor' as cargo FROM vendedores WHERE activo = true
      UNION ALL
      SELECT id, nombre, apellido, CASE tipo WHEN 'jornalero' THEN 'Jornalero' WHEN 'destajista' THEN 'Destajista' WHEN 'encargado' THEN 'Encargado' END FROM trabajadores WHERE activo = true
      ORDER BY nombre
    `);
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.mensual = async (req, res) => {
  try {
    const { persona_id, mes, anio } = req.query;
    if (!persona_id || !mes || !anio) return res.status(400).json({ error: 'persona_id, mes y anio requeridos' });

    const { rows: trabajador } = await query('SELECT * FROM trabajadores WHERE id = $1', [persona_id]);
    if (trabajador.length === 0) return res.status(404).json({ error: 'Trabajador no encontrado' });

    const { rows: resumen } = await query(`
      SELECT COUNT(*) as num_semanas,
             COALESCE(SUM(COALESCE(sueldo_base, 0)), 0) as sueldo_mensual,
             COALESCE(SUM(COALESCE(total_comision, 0)), 0) as comision_mensual,
             COALESCE(SUM(COALESCE(total_sobreprecio, 0)), 0) as sobreprecio_mensual,
             COALESCE(SUM(total_pagar), 0) as total_mensual,
             COALESCE(SUM(COALESCE(adelanto, 0)), 0) as adelanto_mensual,
             CASE WHEN COUNT(*) FILTER (WHERE estado = 'pendiente') > 0 THEN 'pendiente' ELSE 'pagado' END as estado,
             MAX(pagado_en) as ultimo_pago
      FROM pagos_trabajadores
      WHERE trabajador_id = $1
        AND EXTRACT(MONTH FROM semana_inicio) = $2
        AND EXTRACT(YEAR FROM semana_inicio) = $3
    `, [persona_id, mes, anio]);

    res.json({ trabajador: trabajador[0], resumen: resumen[0] || null });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.mesesDisponibles = async (req, res) => {
  try {
    const { persona_id } = req.query;
    const { rows } = await query(`
      SELECT DISTINCT EXTRACT(MONTH FROM semana_inicio) as mes, EXTRACT(YEAR FROM semana_inicio) as anio
      FROM pagos_trabajadores WHERE trabajador_id = $1
      ORDER BY anio DESC, mes DESC
    `, [persona_id]);
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.calcular = async (req, res) => {
  try {
    const { semana_inicio, semana_fin, persona_id, fuente } = req.query;
    if (!semana_inicio || !semana_fin) return res.status(400).json({ error: 'semana_inicio y semana_fin requeridos' });
    const mensajes = [];

    // Calcular para vendedores
    const vendedores = persona_id && fuente === 'vendedor'
      ? (await query('SELECT id, nombre, apellido, sueldo_fijo FROM vendedores WHERE id = $1 AND activo = true', [persona_id])).rows
      : persona_id ? [] : (await query('SELECT id, nombre, apellido, sueldo_fijo FROM vendedores WHERE activo = true')).rows;

    for (const v of vendedores) {
      const { rows: ventas } = await query(`
        SELECT COALESCE(SUM(dv.precio_base_unitario * dv.cantidad) * 0.02, 0) as total_comision,
               COALESCE(SUM(CASE WHEN dv.precio_final_unitario > dv.precio_base_unitario THEN (dv.precio_final_unitario - dv.precio_base_unitario) * dv.cantidad * 0.5 ELSE 0 END), 0) as total_sobreprecio
        FROM ventas vv JOIN detalle_ventas dv ON dv.venta_id = vv.id
        WHERE vv.vendedor_id = $1 AND vv.fecha >= $2 AND vv.fecha <= $3 AND vv.estado = 'completada'
      `, [v.id, semana_inicio, semana_fin]);
      const totalPago = Math.round((Number(v.sueldo_fijo) + Number(ventas[0].total_comision) + Number(ventas[0].total_sobreprecio)) * 100) / 100;
      const { rows: existente } = await query("SELECT id, estado FROM pagos_vendedor WHERE vendedor_id = $1 AND semana_inicio = $2", [v.id, semana_inicio]);

      if (existente.length > 0) {
        if (existente[0].estado === 'pagado') { mensajes.push(`${v.nombre} ${v.apellido} - ya pagado`); continue; }
        await query('UPDATE pagos_vendedor SET total_comision=$1, total_sobreprecio=$2, total_pago=$3 WHERE id=$4', [ventas[0].total_comision, ventas[0].total_sobreprecio, totalPago, existente[0].id]);
      } else {
        await query('INSERT INTO pagos_vendedor (vendedor_id, semana_inicio, semana_fin, sueldo_base, total_comision, total_sobreprecio, total_pago) VALUES ($1,$2,$3,$4,$5,$6,$7)', [v.id, semana_inicio, semana_fin, v.sueldo_fijo, ventas[0].total_comision, ventas[0].total_sobreprecio, totalPago]);
      }
      mensajes.push(`${v.nombre} ${v.apellido} - S/ ${totalPago.toFixed(2)}`);
    }

    // Calcular para trabajadores (jornalero, destajista, encargado)
    const trabajadores = persona_id && fuente === 'trabajador'
      ? (await query('SELECT * FROM trabajadores WHERE id = $1 AND activo = true', [persona_id])).rows
      : persona_id ? [] : (await query("SELECT * FROM trabajadores WHERE tipo IN ('jornalero', 'destajista', 'encargado') AND activo = true")).rows;

    for (const t of trabajadores) {
      let totalPagar = 0, tipoPago = '', unidades = 0;
      let sueldoBase = 0, totalComision = 0, totalSobreprecio = 0;
      if (t.tipo === 'jornalero') { totalPagar = Number(t.sueldo_semanal); tipoPago = 'sueldo_fijo'; sueldoBase = Number(t.sueldo_semanal); }
      else if (t.tipo === 'destajista') { totalPagar = Number(t.sueldo_semanal); tipoPago = 'produccion'; sueldoBase = Number(t.sueldo_semanal); }
      else if (t.tipo === 'encargado') {
        sueldoBase = (Number(t.sueldo_mensual) || 0) / 4;
        const { rows: v } = await query(`
          SELECT COALESCE(SUM(dv.precio_base_unitario * dv.cantidad) * 0.02, 0) as comision,
                 COALESCE(SUM(CASE WHEN dv.precio_final_unitario > dv.precio_base_unitario THEN (dv.precio_final_unitario - dv.precio_base_unitario) * dv.cantidad * 0.5 ELSE 0 END), 0) as sobreprecio
          FROM ventas vv JOIN detalle_ventas dv ON dv.venta_id = vv.id
          WHERE vv.trabajador_id = $1 AND vv.fecha >= $2 AND vv.fecha <= $3 AND vv.estado = 'completada'
        `, [t.id, semana_inicio, semana_fin]);
        totalComision = Number(v[0].comision);
        totalSobreprecio = Number(v[0].sobreprecio);
        totalPagar = Math.round((sueldoBase + totalComision + totalSobreprecio) * 100) / 100;
        tipoPago = 'mixto';
      }

      const { rows: existente } = await query('SELECT id, estado FROM pagos_trabajadores WHERE trabajador_id = $1 AND semana_inicio = $2', [t.id, semana_inicio]);
      if (existente.length > 0) {
        if (existente[0].estado === 'pagado') { mensajes.push(`${t.nombre} ${t.apellido} - ya pagado`); continue; }
        await query('UPDATE pagos_trabajadores SET total_pagar=$1, sueldo_base=$2, total_comision=$3, total_sobreprecio=$4 WHERE id=$5', [totalPagar, sueldoBase, totalComision, totalSobreprecio, existente[0].id]);
      } else {
        await query('INSERT INTO pagos_trabajadores (trabajador_id, semana_inicio, semana_fin, tipo_pago, total_pagar, sueldo_base, total_comision, total_sobreprecio) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [t.id, semana_inicio, semana_fin, tipoPago, totalPagar, sueldoBase, totalComision, totalSobreprecio]);
      }
      mensajes.push(`${t.nombre} ${t.apellido} - S/ ${totalPagar.toFixed(2)}`);
    }

    res.json({ message: `${mensajes.length} pago(s) calculado(s)`, pagos: mensajes });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.remove = async (req, res) => {
  try {
    const { fuente } = req.query;
    if (fuente === 'trabajador') await query('DELETE FROM pagos_trabajadores WHERE id = $1', [req.params.id]);
    else await query('DELETE FROM pagos_vendedor WHERE id = $1', [req.params.id]);
    res.json({ message: 'Pago eliminado' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.marcarPagado = async (req, res) => {
  try {
    const { fuente } = req.query;
    const table = fuente === 'trabajador' ? 'pagos_trabajadores' : 'pagos_vendedor';
    const { rows } = await query(
      `UPDATE ${table} SET estado = 'pagado', pagado_en = NOW() WHERE id = $1 AND estado = 'pendiente' RETURNING id`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Pago no encontrado o ya fue pagado' });
    res.json({ message: 'Pago marcado como pagado' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.adelanto = async (req, res) => {
  try {
    const { monto, fuente } = req.body;
    const table = fuente === 'trabajador' ? 'pagos_trabajadores' : 'pagos_vendedor';
    const { rows } = await query(
      `UPDATE ${table} SET adelanto = $1, fecha_adelanto = NOW() WHERE id = $2 RETURNING *`,
      [monto || 0, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Pago no encontrado' });
    res.json({ pago: rows[0], message: 'Adelanto registrado' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};
