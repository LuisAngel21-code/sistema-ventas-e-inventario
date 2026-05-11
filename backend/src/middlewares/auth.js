const pool = require('../config/database');

const usuariosAutorizados = {
  'admin': 'admin123',
  'vendedor1': 'ventas2024',
  'vendedor2': 'ventas2024'
};

exports.basicAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Sistema Ventas"');
    return res.status(401).json({ error: 'Autenticación requerida' });
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');

  if (usuariosAutorizados[username] && usuariosAutorizados[username] === password) {
    req.user = { username, role: username === 'admin' ? 'admin' : 'vendedor' };
    return next();
  }

  return res.status(401).json({ error: 'Credenciales inválidas' });
};

exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
};
