const { query } = require('../config/database');

exports.get = async (req, res) => {
  try {
    const { clave } = req.params;
    const { rows } = await query('SELECT valor FROM configuracion WHERE clave = $1', [clave]);
    res.json({ clave, valor: rows[0]?.valor || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.set = async (req, res) => {
  try {
    const { clave } = req.params;
    const { valor } = req.body;
    const { rows } = await query(
      'INSERT INTO configuracion (clave, valor) VALUES ($1, $2) ON CONFLICT (clave) DO UPDATE SET valor = $2, updated_at = NOW() RETURNING *',
      [clave, String(valor)]
    );
    res.json({ message: 'Guardado', valor: rows[0].valor });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
