const fs = require('fs');
const path = require('path');

function initDatabase(db) {
  db.raw.exec(`
    CREATE TABLE IF NOT EXISTS vendedores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      apellido TEXT NOT NULL,
      email TEXT UNIQUE,
      telefono TEXT,
      activo INTEGER DEFAULT 1,
      sueldo_fijo REAL DEFAULT 350.00,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT UNIQUE,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      costo REAL NOT NULL,
      precio_base REAL NOT NULL,
      precio_venta REAL DEFAULT NULL,
      stock INTEGER DEFAULT 0,
      stock_minimo INTEGER DEFAULT 0,
      categoria TEXT,
      activo INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS ventas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vendedor_id INTEGER NOT NULL,
      fecha TEXT DEFAULT (datetime('now', 'localtime')),
      total REAL DEFAULT 0.00,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (vendedor_id) REFERENCES vendedores(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS detalle_ventas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venta_id INTEGER NOT NULL,
      producto_id INTEGER NOT NULL,
      cantidad INTEGER DEFAULT 1,
      costo_unitario REAL NOT NULL,
      precio_base_unitario REAL NOT NULL,
      precio_final_unitario REAL NOT NULL,
      sobreprecio_unitario REAL DEFAULT 0.00,
      subtotal REAL NOT NULL,
      FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
      FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS inventario_movimientos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producto_id INTEGER NOT NULL,
      tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'salida', 'ajuste')),
      cantidad INTEGER NOT NULL,
      referencia TEXT,
      venta_id INTEGER DEFAULT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT,
      FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vendedor_id INTEGER DEFAULT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      rol TEXT NOT NULL DEFAULT 'vendedor' CHECK (rol IN ('admin', 'vendedor')),
      activo INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (vendedor_id) REFERENCES vendedores(id) ON DELETE SET NULL
    );
  `);

  db.raw.exec(`
    CREATE INDEX IF NOT EXISTS idx_ventas_vendedor ON ventas(vendedor_id);
    CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha);
    CREATE INDEX IF NOT EXISTS idx_detalle_venta ON detalle_ventas(venta_id);
    CREATE INDEX IF NOT EXISTS idx_movimientos_producto ON inventario_movimientos(producto_id);
    CREATE INDEX IF NOT EXISTS idx_movimientos_tipo ON inventario_movimientos(tipo);
    CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
  `);

  const count = db.raw.exec("SELECT COUNT(*) as total FROM vendedores");
  const total = count.length > 0 && count[0].values.length > 0 ? count[0].values[0][0] : 0;

  if (total === 0) {
    db.raw.exec(`
      INSERT INTO vendedores (nombre, apellido, email, telefono) VALUES
        ('Admin', 'Sistema', 'admin@tienda.com', '999999999'),
        ('María', 'García', 'maria@tienda.com', '987654321'),
        ('Carlos', 'López', 'carlos@tienda.com', '987654322'),
        ('Ana', 'Martínez', 'ana@tienda.com', '987654323');

      INSERT INTO usuarios (vendedor_id, username, password, rol) VALUES
        (1, 'admin', 'admin123', 'admin'),
        (2, 'maria', 'maria123', 'vendedor'),
        (3, 'carlos', 'carlos123', 'vendedor'),
        (4, 'ana', 'ana123', 'vendedor');

      INSERT INTO productos (codigo, nombre, descripcion, costo, precio_base, stock, stock_minimo, categoria) VALUES
        ('CAMA-001', 'Cama Queen Size Clásica', 'Cama queen size de madera sólida', 2500.00, 3500.00, 10, 2, 'Camas'),
        ('CAMA-002', 'Cama King Size Premium', 'Cama king size con cabecero tapizado', 4000.00, 5600.00, 5, 1, 'Camas'),
        ('CAMA-003', 'Cama Individual Juvenil', 'Cama individual ideal para jóvenes', 1500.00, 2100.00, 15, 3, 'Camas'),
        ('COLCHON-001', 'Colchón Queen Size Ortopédico', 'Colchón ortopédico de espuma viscoelástica', 1800.00, 2520.00, 20, 5, 'Colchones'),
        ('COLCHON-002', 'Colchón King Size Premium', 'Colchón premium con resortes pocket', 3200.00, 4480.00, 8, 2, 'Colchones'),
        ('COLCHON-003', 'Colchón Individual Estándar', 'Colchón individual de resortes', 900.00, 1260.00, 25, 5, 'Colchones'),
        ('BASE-001', 'Base Queen Size', 'Base de madera para cama queen', 800.00, 1120.00, 12, 3, 'Bases'),
        ('BASE-002', 'Base King Size', 'Base de madera reforzada king size', 1200.00, 1680.00, 7, 2, 'Bases'),
        ('ALM-001', 'Almohada Viscoelástica', 'Almohada viscoelástica con memoria', 200.00, 280.00, 50, 10, 'Accesorios'),
        ('PROT-001', 'Protector de Colchón Queen', 'Protector impermeable queen size', 150.00, 210.00, 30, 5, 'Accesorios');
    `);
    db.saveDB();
    console.log('Base de datos inicializada con datos de ejemplo');
  }

  console.log('Base de datos lista');
}

module.exports = { initDatabase };
