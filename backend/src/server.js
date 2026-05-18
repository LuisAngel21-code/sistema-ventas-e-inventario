require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { initDatabase } = require('./database/schema');
const { db, initDatabase: initDB } = require('./config/database');

const vendedoresRoutes = require('./routes/vendedores');
const productosRoutes = require('./routes/productos');
const ventasRoutes = require('./routes/ventas');
const inventarioRoutes = require('./routes/inventario');
const reportesRoutes = require('./routes/reportes');

const app = express();
const PORT = process.env.PORT || 3000;

const AUTH_USER = process.env.AUTH_USER || 'admin';
const AUTH_PASS = process.env.AUTH_PASS || 'Cams2024';

function authMiddleware(req, res, next) {
  if (req.path === '/login') return next();
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Basic ')) {
    return res.status(401).json({ error: 'Autenticación requerida' });
  }
  const base64 = auth.slice(6);
  const decoded = Buffer.from(base64, 'base64').toString('utf-8');
  const [user, pass] = decoded.split(':');
  if (user !== AUTH_USER || pass !== AUTH_PASS) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }
  next();
}

async function start() {
  await initDB();
  initDatabase(db);

  app.use(cors({ origin: process.env.CORS_ORIGIN || '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }));
  app.use(express.json());
  app.use(morgan('dev'));

  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === AUTH_USER && password === AUTH_PASS) {
      const token = Buffer.from(`${AUTH_USER}:${AUTH_PASS}`).toString('base64');
      return res.json({ success: true, token, user: { username, role: 'admin' } });
    }
    res.status(401).json({ error: 'Credenciales inválidas' });
  });

  app.use('/api', authMiddleware);

  app.use('/api/vendedores', vendedoresRoutes);
  app.use('/api/productos', productosRoutes);
  app.use('/api/ventas', ventasRoutes);
  app.use('/api/inventario', inventarioRoutes);
  app.use('/api/reportes', reportesRoutes);

  const distPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(distPath));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Error interno del servidor' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
  });
}

start().catch(err => {
  console.error('Error al iniciar:', err);
  process.exit(1);
});
