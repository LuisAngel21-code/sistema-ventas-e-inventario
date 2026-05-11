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

async function start() {
  await initDB();
  initDatabase(db);

  app.use(cors({ origin: process.env.CORS_ORIGIN || '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }));
  app.use(express.json());
  app.use(morgan('dev'));

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
