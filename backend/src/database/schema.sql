CREATE DATABASE IF NOT EXISTS tienda_camas
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE tienda_camas;

-- ============================================
-- TABLA: vendedores
-- ============================================
CREATE TABLE IF NOT EXISTS vendedores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE,
  telefono VARCHAR(20),
  activo BOOLEAN DEFAULT TRUE,
  sueldo_fijo DECIMAL(10,2) NOT NULL DEFAULT 350.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================
-- TABLA: productos
-- ============================================
CREATE TABLE IF NOT EXISTS productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  costo DECIMAL(10,2) NOT NULL,
  precio_base DECIMAL(10,2) NOT NULL,
  precio_venta DECIMAL(10,2) DEFAULT NULL,
  stock INT NOT NULL DEFAULT 0,
  stock_minimo INT DEFAULT 0,
  categoria VARCHAR(100),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================
-- TABLA: ventas
-- ============================================
CREATE TABLE IF NOT EXISTS ventas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vendedor_id INT NOT NULL,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vendedor_id) REFERENCES vendedores(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================
-- TABLA: detalle_ventas
-- ============================================
CREATE TABLE IF NOT EXISTS detalle_ventas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  venta_id INT NOT NULL,
  producto_id INT NOT NULL,
  cantidad INT NOT NULL DEFAULT 1,
  costo_unitario DECIMAL(10,2) NOT NULL,
  precio_base_unitario DECIMAL(10,2) NOT NULL,
  precio_final_unitario DECIMAL(10,2) NOT NULL,
  sobreprecio_unitario DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  subtotal DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================
-- TABLA: inventario_movimientos
-- ============================================
CREATE TABLE IF NOT EXISTS inventario_movimientos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  producto_id INT NOT NULL,
  tipo ENUM('entrada', 'salida', 'ajuste') NOT NULL,
  cantidad INT NOT NULL,
  referencia VARCHAR(200),
  venta_id INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT,
  FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================
-- TABLA: usuarios (acceso al sistema)
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vendedor_id INT DEFAULT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  rol ENUM('admin', 'vendedor') NOT NULL DEFAULT 'vendedor',
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vendedor_id) REFERENCES vendedores(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX idx_ventas_vendedor ON ventas(vendedor_id);
CREATE INDEX idx_ventas_fecha ON ventas(fecha);
CREATE INDEX idx_detalle_venta ON detalle_ventas(venta_id);
CREATE INDEX idx_movimientos_producto ON inventario_movimientos(producto_id);
CREATE INDEX idx_movimientos_tipo ON inventario_movimientos(tipo);
CREATE INDEX idx_productos_categoria ON productos(categoria);

-- ============================================
-- Datos de ejemplo
-- ============================================
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
