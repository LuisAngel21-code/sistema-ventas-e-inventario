const { query } = require('../config/database');

exports.getAll = async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM trabajadores ORDER BY nombre');
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.create = async (req, res) => {
  try {
    const { nombre, apellido, tipo, telefono, email, sueldo_semanal, tarifa_por_unidad } = req.body;
    if (!nombre || !apellido || !tipo) return res.status(400).json({ error: 'Nombre, apellido y tipo requeridos' });
    const { rows } = await query(
      'INSERT INTO trabajadores (nombre, apellido, tipo, telefono, email, sueldo_semanal, tarifa_por_unidad) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [nombre, apellido, tipo, telefono, email, sueldo_semanal || 0, tarifa_por_unidad || 0]
    );
    res.status(201).json({ trabajador: rows[0], message: 'Trabajador registrado' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.update = async (req, res) => {
  try {
    const { nombre, apellido, tipo, telefono, email, sueldo_semanal, tarifa_por_unidad, activo } = req.body;
    const { rows } = await query(
      'UPDATE trabajadores SET nombre=$1,apellido=$2,tipo=$3,telefono=$4,email=$5,sueldo_semanal=$6,tarifa_por_unidad=$7,activo=$8 WHERE id=$9 RETURNING *',
      [nombre, apellido, tipo, telefono, email, sueldo_semanal, tarifa_por_unidad, activo ?? true, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Trabajador no encontrado' });
    res.json({ trabajador: rows[0], message: 'Trabajador actualizado' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.remove = async (req, res) => {
  try {
    await query('DELETE FROM pagos_trabajadores WHERE trabajador_id = $1', [req.params.id]);
    await query('DELETE FROM trabajadores WHERE id = $1', [req.params.id]);
    res.json({ message: 'Trabajador eliminado' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.calcularPago = async (req, res) => {
  try {
    const { trabajador_id, semana_inicio, semana_fin, unidades } = req.body;
    const { rows: trab } = await query('SELECT * FROM trabajadores WHERE id = $1', [trabajador_id]);
    if (trab.length === 0) return res.status(404).json({ error: 'Trabajador no encontrado' });

    const { rows: existente } = await query(
      'SELECT id FROM pagos_trabajadores WHERE trabajador_id = $1 AND semana_inicio = $2',
      [trabajador_id, semana_inicio]
    );
    if (existente.length > 0) return res.status(400).json({ error: 'El pago de esta semana ya fue calculado' });

    let totalPagar = 0;
    let tipoPago = '';
    let numUnidades = 0;

    if (trab[0].tipo === 'jornalero') {
      totalPagar = Number(trab[0].sueldo_semanal);
      tipoPago = 'sueldo_fijo';
    } else if (trab[0].tipo === 'destajista') {
      numUnidades = unidades || 0;
      totalPagar = Math.round(Number(trab[0].tarifa_por_unidad) * numUnidades * 100) / 100;
      tipoPago = 'produccion';
    }

    const { rows } = await query(
      'INSERT INTO pagos_trabajadores (trabajador_id, semana_inicio, semana_fin, tipo_pago, unidades, total_pagar) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [trabajador_id, semana_inicio, semana_fin, tipoPago, numUnidades, totalPagar]
    );

    res.status(201).json({ pago: rows[0], message: `Pago calculado: S/ ${totalPagar.toFixed(2)}` });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.pagos = async (req, res) => {
  try {
    const { trabajador_id } = req.query;
    let sql = 'SELECT pt.*, t.nombre, t.apellido, t.tipo FROM pagos_trabajadores pt JOIN trabajadores t ON pt.trabajador_id = t.id';
    const params = []; let idx = 1;
    if (trabajador_id) { sql += ` WHERE pt.trabajador_id = $${idx++}`; params.push(trabajador_id); }
    sql += ' ORDER BY pt.semana_inicio DESC';
    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.marcarPagado = async (req, res) => {
  try {
    const { rows } = await query(
      "UPDATE pagos_trabajadores SET estado = 'pagado', pagado_en = NOW() WHERE id = $1 AND estado = 'pendiente' RETURNING id",
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Pago no encontrado o ya pagado' });
    res.json({ message: 'Pago marcado como pagado' });
  } catch (error) { res.status(500).json({ error: error.message }); }
};
