const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cams_secret_key_change_in_production';

function authenticate(req, res, next) {
  if (req.path === '/login' || req.path === '/health') return next();

  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticación requerido' });
  }

  const token = auth.slice(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
}

function adminOnly(req, res, next) {
  if (req.user && req.user.rol === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
}

module.exports = { authenticate, adminOnly };
