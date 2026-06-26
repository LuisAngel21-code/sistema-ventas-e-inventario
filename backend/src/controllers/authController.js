const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'cams_secret_key_change_in_production';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '8h';

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    const { rows } = await query(
      `SELECT u.id, u.username, u.password, u.rol, u.activo,
              v.id as vendedor_id, v.nombre, v.apellido, v.sueldo_fijo
       FROM usuarios u
       LEFT JOIN vendedores v ON u.vendedor_id = v.id
       WHERE u.username = $1`,
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = rows[0];
    if (!user.activo) {
      return res.status(401).json({ error: 'Usuario inactivo' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const tokenPayload = {
      id: user.id,
      username: user.username,
      rol: user.rol,
      vendedor_id: user.vendedor_id,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        rol: user.rol,
        vendedor_id: user.vendedor_id,
        nombre: user.nombre,
        apellido: user.apellido,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.me = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT u.id, u.username, u.rol,
              v.id as vendedor_id, v.nombre, v.apellido, v.email, v.sueldo_fijo
       FROM usuarios u
       LEFT JOIN vendedores v ON u.vendedor_id = v.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.cambiarPassword = async (req, res) => {
  try {
    const { password_actual, password_nueva } = req.body;

    const { rows } = await query('SELECT password FROM usuarios WHERE id = $1', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    const valid = await bcrypt.compare(password_actual, rows[0].password);
    if (!valid) return res.status(400).json({ error: 'Contraseña actual incorrecta' });

    const hash = await bcrypt.hash(password_nueva, 10);
    await query('UPDATE usuarios SET password = $1 WHERE id = $2', [hash, req.user.id]);

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
