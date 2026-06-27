require('dotenv').config();
const { query } = require('../config/database');

async function initDatabase() {
  console.log('Inicializando base de datos...');

  await query(`
    CREATE TABLE IF NOT EXISTS categorias (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      descripcion TEXT,
      activo BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS marcas (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      activo BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS vendedores (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      apellido VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE,
      telefono VARCHAR(20),
      activo BOOLEAN DEFAULT TRUE,
      sueldo_fijo DECIMAL(10,2) DEFAULT 350.00,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS productos (
      id SERIAL PRIMARY KEY,
      codigo VARCHAR(50) UNIQUE,
      nombre VARCHAR(200) NOT NULL,
      descripcion TEXT,
      costo DECIMAL(10,2) NOT NULL,
      precio_base DECIMAL(10,2) NOT NULL,
      precio_venta DECIMAL(10,2),
      stock INTEGER DEFAULT 0,
      stock_minimo INTEGER DEFAULT 0,
      categoria VARCHAR(100),
      categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
      marca_id INTEGER REFERENCES marcas(id) ON DELETE SET NULL,
      imagen_url TEXT,
      activo BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS ventas (
      id SERIAL PRIMARY KEY,
      vendedor_id INTEGER NOT NULL REFERENCES vendedores(id) ON DELETE RESTRICT,
      fecha TIMESTAMP DEFAULT NOW(),
      total DECIMAL(10,2) DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS detalle_ventas (
      id SERIAL PRIMARY KEY,
      venta_id INTEGER NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
      producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
      cantidad INTEGER DEFAULT 1,
      costo_unitario DECIMAL(10,2) NOT NULL,
      precio_base_unitario DECIMAL(10,2) NOT NULL,
      precio_final_unitario DECIMAL(10,2) NOT NULL,
      sobreprecio_unitario DECIMAL(10,2) DEFAULT 0.00,
      subtotal DECIMAL(10,2) NOT NULL
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS inventario_movimientos (
      id SERIAL PRIMARY KEY,
      producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
      tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'salida', 'ajuste')),
      cantidad INTEGER NOT NULL,
      referencia VARCHAR(200),
      venta_id INTEGER REFERENCES ventas(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      vendedor_id INTEGER REFERENCES vendedores(id) ON DELETE SET NULL,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      rol VARCHAR(20) NOT NULL DEFAULT 'vendedor' CHECK (rol IN ('admin', 'vendedor')),
      activo BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS compras (
      id SERIAL PRIMARY KEY,
      proveedor VARCHAR(200),
      fecha TIMESTAMP DEFAULT NOW(),
      total DECIMAL(10,2) DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS detalle_compras (
      id SERIAL PRIMARY KEY,
      compra_id INTEGER NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
      producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
      cantidad INTEGER NOT NULL,
      costo_unitario DECIMAL(10,2) NOT NULL,
      subtotal DECIMAL(10,2) NOT NULL
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS pagos_vendedor (
      id SERIAL PRIMARY KEY,
      vendedor_id INTEGER NOT NULL REFERENCES vendedores(id) ON DELETE RESTRICT,
      semana_inicio DATE NOT NULL,
      semana_fin DATE NOT NULL,
      sueldo_base DECIMAL(10,2) DEFAULT 350.00,
      total_comision DECIMAL(10,2) DEFAULT 0.00,
      total_sobreprecio DECIMAL(10,2) DEFAULT 0.00,
      total_pago DECIMAL(10,2) DEFAULT 0.00,
      estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado')),
      pagado_en TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await query(`CREATE INDEX IF NOT EXISTS idx_ventas_vendedor ON ventas(vendedor_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_detalle_venta ON detalle_ventas(venta_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_movimientos_producto ON inventario_movimientos(producto_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_movimientos_tipo ON inventario_movimientos(tipo);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_pagos_vendedor ON pagos_vendedor(vendedor_id);`);

  await query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ventas' AND column_name='estado') THEN
        ALTER TABLE ventas ADD COLUMN estado VARCHAR(20) DEFAULT 'completada';
      END IF;
    END $$;
  `);

  await query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='productos' AND column_name='proveedor') THEN
        ALTER TABLE productos ADD COLUMN proveedor VARCHAR(200);
        ALTER TABLE productos ADD COLUMN tipo VARCHAR(50);
      END IF;
    END $$;
  `);

  await query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ventas' AND column_name='tipo_comprobante') THEN
        ALTER TABLE ventas ADD COLUMN tipo_comprobante VARCHAR(20) NOT NULL DEFAULT 'boleta';
        ALTER TABLE ventas ADD COLUMN metodo_pago VARCHAR(30) NOT NULL DEFAULT 'efectivo';
        ALTER TABLE ventas ADD COLUMN nro_comprobante VARCHAR(50) NOT NULL DEFAULT '';
        ALTER TABLE ventas ADD COLUMN voucher_url TEXT;
        ALTER TABLE ventas ADD COLUMN comprobante_url TEXT;
      END IF;
    END $$;
  `);

  console.log('Base de datos inicializada correctamente');
}

initDatabase().catch(err => {
  console.error('Error al inicializar BD:', err);
  process.exit(1);
});
