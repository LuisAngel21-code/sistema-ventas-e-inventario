# Sistema de Ventas e Inventario — Tienda de Camas y Colchones

Sistema web completo para la gestión de ventas, inventario, vendedores y reportes de una tienda de camas y colchones. Accesible desde cualquier navegador web, multiusuario, con base de datos centralizada y generación de reportes en PDF.

---

## 1. ARQUITECTURA DEL SISTEMA

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                   │
│               Desplegado en Vercel / Netlify                  │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │Dashboard│ │  Ventas  │ │Productos │ │ Reportes │  ...    │
│  └────▲────┘ └────▲─────┘ └────▲─────┘ └────▲─────┘        │
│       │            │            │            │               │
│  ┌────┴────────────┴────────────┴────────────┴────────┐      │
│  │              API Service (fetch)                     │      │
│  └─────────────────────┬───────────────────────────────┘      │
└────────────────────────┼──────────────────────────────────────┘
                         │  HTTPS / API REST
┌────────────────────────┼──────────────────────────────────────┐
│           BACKEND (Node.js + Express.js)                       │
│         Desplegado en Render / Railway                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐    │
│  │ Routes   │ │Controllers│ │ Services │ │ Middlewares    │    │
│  └────▲─────┘ └────▲─────┘ └────▲─────┘ └───────▲───────┘    │
│       │             │            │                │            │
│  ┌────┴─────────────┴────────────┴────────────────┴───────┐   │
│  │           MySQL Connection Pool (mysql2)                │   │
│  └────────────────────────┬───────────────────────────────┘   │
└───────────────────────────┼───────────────────────────────────┘
                            │
┌───────────────────────────┼───────────────────────────────────┐
│           BASE DE DATOS (MySQL / PlanetScale / Supabase)      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐  │
│  │Vendedores│ │ Ventas   │ │Productos │ │Inventario Mov. │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

### Flujo de datos

1. El vendedor accede vía navegador (desde tienda o remoto)
2. React hace peticiones HTTP al backend (Express API)
3. El backend procesa la lógica de negocio y consulta MySQL
4. La base de datos centralizada almacena todo en tiempo real
5. Los reportes PDF se generan en el servidor con PDFKit

---

## 2. MODELO ENTIDAD-RELACIÓN

```
┌─────────────────┐       ┌──────────────────┐
│   VENDEDORES     │       │     VENTAS        │
│─────────────────│       │──────────────────│
│ PK id            │◄──────│ FK vendedor_id    │
│   nombre         │ 1:N   │   fecha           │
│   apellido       │       │   total           │
│   email          │       └────────┬─────────┘
│   telefono       │                │
│   activo         │                │ 1:N
│   sueldo_fijo    │       ┌────────▼─────────┐
└─────────────────┘       │  DETALLE_VENTAS    │
                          │───────────────────│
┌─────────────────┐       │ PK id             │
│   PRODUCTOS      │       │ FK venta_id       │
│─────────────────│       │ FK producto_id     │
│ PK id            │◄──────│   cantidad         │
│   codigo         │ 1:N   │   costo_unitario   │
│   nombre         │       │   precio_base_u    │
│   costo          │       │   precio_final_u   │
│   precio_base    │       │   sobreprecio_u    │
│   stock          │       │   subtotal         │
│   stock_minimo   │       └──────────────────┘
│   categoria      │
│   activo         │       ┌──────────────────┐
└────────┬─────────┘       │INVENTARIO_MOV.   │
         │                 │──────────────────│
         └────────────────►│ PK id             │
             1:N           │ FK producto_id    │
                           │   tipo (ent/sal)  │
                           │   cantidad        │
                           │   referencia      │
                           │   FK venta_id     │
                           └──────────────────┘

┌──────────────────┐
│   USUARIOS        │
│──────────────────│
│ PK id             │
│ FK vendedor_id    │
│   username (UNIQUE)│
│   password         │
│   rol (admin/ven)  │
│   activo           │
└──────────────────┘
```

### Relaciones

| Relación | Tipo | Descripción |
|---|---|---|
| Vendedor → Ventas | 1:N | Un vendedor registra muchas ventas |
| Venta → Detalle_Ventas | 1:N | Una venta tiene múltiples productos |
| Producto → Detalle_Ventas | 1:N | Un producto aparece en muchos detalles |
| Producto → Inventario_Movimientos | 1:N | Un producto tiene múltiples movimientos |
| Venta → Inventario_Movimientos | 1:N | Una venta genera movimientos de salida |
| Vendedor → Usuario | 1:1 | Un vendedor tiene un usuario de sistema |

---

## 3. DISEÑO DE BASE DE DATOS SQL

El archivo completo está en `backend/src/database/schema.sql`. Incluye:

### Tablas principales

| Tabla | Propósito |
|---|---|
| `vendedores` | Datos personales y sueldo fijo de cada vendedor |
| `productos` | Catálogo con costos, precios y stock |
| `ventas` | Cabecera de cada venta (vendedor, fecha, total) |
| `detalle_ventas` | Líneas de cada venta (producto, cant, precios) |
| `inventario_movimientos` | Auditoría de entradas, salidas y ajustes |
| `usuarios` | Credenciales de acceso al sistema |

### Cálculos almacenados en detalle_ventas

- `costo_unitario`: El costo del producto al momento de la venta
- `precio_base_unitario`: Costo + 40% (calculado automáticamente)
- `precio_final_unitario`: Lo que realmente pagó el cliente (lo ingresa el vendedor)
- `sobreprecio_unitario`: precio_final - precio_base (0 si no hay excedente)
- `subtotal`: precio_final_unitario * cantidad

### Índices

- idx_ventas_vendedor, idx_ventas_fecha, idx_detalle_venta
- idx_movimientos_producto, idx_movimientos_tipo
- idx_productos_categoria

---

## 4. FLUJO COMPLETO DEL SISTEMA

### Flujo de Venta

```
1. VENDEDOR INICIA SESIÓN
   ↓
2. SELECCIONA "Nueva Venta"
   ↓
3. ELIGE VENDEDOR (sí mismo u otro)
   ↓
4. AGREGA PRODUCTOS:
   a. Selecciona producto del catálogo
   b. Define cantidad
   c. Ingresa PRECIO FINAL (manual)
   d. El sistema muestra:
      - Costo, Precio Base (costo+40%)
      - Sobreprecio si precio final > precio base
   ↓
5. CONFIRMA VENTA
   ↓
6. SISTEMA EJECUTA TRANSACCIÓN:
   a. Crea registro en ventas
   b. Crea registros en detalle_ventas
   c. DESCUENTA stock de cada producto
   d. Registra movimientos de inventario (salida)
   ↓
7. SISTEMA MUESTRA DETALLE DE VENTA
```

### Flujo de Reporte

```
1. JEFE/ADMIN INICIA SESIÓN
   ↓
2. SELECCIONA "Reportes"
   ↓
3. ELIGE TIPO DE REPORTE:
   ↓
   ├── "Reporte por Vendedor"
   │   a. Selecciona vendedor
   │   b. Define rango de fechas (opcional)
   │   c. Genera PDF
   │   d. PDF incluye:
   │      - Tabla de ventas (fecha, producto, costos, precios, sobreprecio)
   │      - Resumen: total ventas, comisión 2%, 50% sobreprecio,
   │        sueldo fijo S/350, total a pagar
   │
   ├── "Reporte General"
   │   a. Define rango de fechas (opcional)
   │   b. Genera PDF con todas las ventas
   │   c. Incluye resumen por vendedor
   │
   └── "Reporte de Inventario"
       a. Genera PDF con stock actual
       b. Alertas de stock bajo
```

---

## 5. ESTRUCTURA DE CARPETAS

```
sistema-ventas/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js          # Pool de conexión MySQL
│   │   ├── controllers/
│   │   │   ├── vendedorController.js
│   │   │   ├── productoController.js
│   │   │   ├── ventaController.js
│   │   │   ├── inventarioController.js
│   │   │   └── reporteController.js
│   │   ├── database/
│   │   │   └── schema.sql           # Script SQL completo
│   │   ├── middlewares/
│   │   │   └── auth.js              # Autenticación básica
│   │   ├── routes/
│   │   │   ├── vendedores.js
│   │   │   ├── productos.js
│   │   │   ├── ventas.js
│   │   │   ├── inventario.js
│   │   │   └── reportes.js
│   │   ├── services/
│   │   │   └── pdfService.js        # Generación de PDF con PDFKit
│   │   ├── utils/
│   │   │   └── calculations.js      # Lógica de negocio
│   │   └── server.js                # Punto de entrada
│   ├── package.json
│   ├── .env
│   └── .env.example
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.jsx           # Layout con sidebar
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── VentasPage.jsx
│   │   │   ├── NuevaVenta.jsx
│   │   │   ├── VentaDetalle.jsx
│   │   │   ├── ProductosPage.jsx
│   │   │   ├── InventarioPage.jsx
│   │   │   ├── VendedoresPage.jsx
│   │   │   └── ReportesPage.jsx
│   │   ├── services/
│   │   │   └── api.js               # Cliente HTTP
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── .gitignore
└── README.md
```

---

## 6. LÓGICA DE NEGOCIO DETALLADA

### Cálculos (backend/src/utils/calculations.js)

```javascript
// Constantes
TASA_COMISION = 2%        // 0.02
PORCENTAJE_COSTO_BASE = 140%  // 1.4 (costo + 40%)
PORCENTAJE_SOBREPRECIO_VENDEDOR = 50%  // 0.5
SUELDO_FIJO = S/ 350.00

// Fórmulas
precio_base = costo × 1.4
comisión = precio_base × 0.02
sobreprecio = precio_final - precio_base  (solo si > 0)
ganancia_vendedor_sobreprecio = sobreprecio × 0.5
total_a_pagar = comisión + ganancia_sobreprecio + 350
```

### Ejemplo numérico

| Concepto | Fórmula | Valor |
|---|---|---|
| Costo del producto | — | S/ 1,000 |
| Precio base | 1000 × 1.4 | S/ 1,400 |
| Precio final (vendedor) | — | S/ 1,800 |
| Sobreprecio | 1800 - 1400 | S/ 400 |
| Comisión (2%) | 1400 × 0.02 | S/ 28 |
| 50% sobreprecio | 400 × 0.5 | S/ 200 |
| Sueldo fijo | — | S/ 350 |
| **Total a pagar** | 28 + 200 + 350 | **S/ 578** |

### Lógica de transacción de venta

La venta se ejecuta dentro de una **transacción SQL** para garantizar integridad:

1. Verificar que el vendedor existe y está activo
2. Verificar stock suficiente para cada producto
3. Calcular precio base, sobreprecio y subtotales
4. Insertar registro en `ventas`
5. Insertar registros en `detalle_ventas`
6. Actualizar stock en `productos` (restar)
7. Insertar movimientos en `inventario_movimientos`
8. Si algo falla → `ROLLBACK` (todo se deshace)
9. Si todo ok → `COMMIT`

---

## 7. GENERACIÓN DE PDF

### Tecnología: PDFKit (Node.js)

El servicio de PDF está en `backend/src/services/pdfService.js`. Genera 3 tipos de reporte:

### Reporte por Vendedor
- Encabezado con datos del vendedor (nombre, email, teléfono, sueldo fijo)
- Tabla detallada de todas sus ventas:
  - # correlativo, Fecha, Producto, Costo, Precio Base, Precio Final, Sobreprecio
- Resumen de pago al final:
  - Total de ventas (suma de subtotales)
  - Comisión (2% del precio base)
  - Sobreprecio total
  - 50% del sobreprecio para el vendedor
  - Sueldo fijo (S/ 350)
  - **Total a pagar al vendedor**
- Colores corporativos, diseño profesional

### Reporte General
- Todas las ventas del sistema (con filtro por fechas)
- Resumen por vendedor:
  - Nombre, cantidad de ventas, monto total, comisión, total a pagar

### Reporte de Inventario
- Listado de productos con código, nombre, costo, stock
- Alertas visuales de stock bajo (en rojo)
- Productos activos solamente

---

## 8. FUNCIONAMIENTO EN TIEMPO REAL

### Arquitectura de tiempo real

El sistema funciona en tiempo real sin WebSockets, basado en:

1. **Base de datos centralizada** (MySQL en la nube): Todos los cambios son inmediatos y visibles para todos los usuarios
2. **API REST**: Cada acción (registrar venta, crear producto, etc.) es una petición HTTP que modifica la BD
3. **Refresco manual**: El usuario puede recargar datos con filtros o navegación

### Escenario: Vendedor en tienda, Jefe en casa

```
VENDEDOR (tienda)                    JEFE (casa)
       │                                │
       │ 1. Registra venta              │
       │    POST /api/ventas            │
       │       │                        │
       │       ▼                        │
       │  ┌──────────┐                  │
       │  │  MySQL   │                  │
       │  │  (Cloud) │                  │
       │  └──────────┘                  │
       │       │                        │
       │       │ 2. Datos actualizados  │
       │       │    en tiempo real      │
       │       │                        │
       │       └────────────────────────►
       │                                │
       │ 3. Ve confirmación             │ 4. Abre Dashboard
       │    de venta                    │    y ve la venta
       │                                │    reflejada
```

### Simultaneidad

- Múltiples vendedores pueden registrar ventas al mismo tiempo
- Las transacciones SQL garantizan que no haya condiciones de carrera
- El stock se actualiza atómicamente dentro de cada transacción
- El jefe puede generar reportes mientras se registran ventas

---

## 9. DESPLIEGUE PASO A PASO

### Requisitos previos

- Node.js 18+ instalado
- Cuenta en GitHub
- Cuenta en Vercel (gratis)
- Cuenta en Render (gratis)
- Cuenta en PlanetScale o Supabase (gratis)

### Paso 1: Base de datos (PlanetScale - MySQL)

```bash
# Opción A: PlanetScale (MySQL serverless)
1. Crear cuenta en https://planetscale.com
2. Crear un nuevo database "tienda_camas"
3. Región: us-east (o la más cercana)
4. En "Overview" → "Connect" → copiar el DSN
5. Guardar credenciales: host, username, password, database

# Opción B: Supabase (PostgreSQL + MySQL)
1. Crear cuenta en https://supabase.com
2. Crear nuevo proyecto
3. En Database → Connection string

# Ejecutar schema.sql desde MySQL Workbench o CLI
mysql -h HOST -u USER -p < backend/src/database/schema.sql
```

### Paso 2: Backend (Render)

```bash
1. Ir a https://render.com y crear cuenta
2. Click "New +" → "Web Service"
3. Conectar repositorio de GitHub
4. Configurar:
   - Name: tienda-camas-api
   - Root Directory: backend
   - Build Command: npm install
   - Start Command: npm start
   - Plan: Free
5. Variables de entorno:
   DB_HOST= (de PlanetScale)
   DB_PORT=3306
   DB_USER= (de PlanetScale)
   DB_PASSWORD= (de PlanetScale)
   DB_NAME=tienda_camas
   PORT=3000
   CORS_ORIGIN=https://tienda-camas.vercel.app
6. Deploy
```

### Paso 3: Frontend (Vercel)

```bash
1. Ir a https://vercel.com y crear cuenta
2. Click "Add New..." → "Project"
3. Importar repositorio de GitHub
4. Configurar:
   - Framework Preset: Vite
   - Root Directory: frontend
   - Build Command: npm run build
   - Output Directory: dist
5. Variables de entorno (ninguna necesaria con proxy)
6. Deploy

# IMPORTANTE: En producción, sin proxy, cambiar api.js:
const API_URL = 'https://tienda-camas-api.onrender.com/api';
```

### Paso 4: Variables de entorno en producción

```bash
# backend/.env (producción)
DB_HOST=aws.connect.psdb.cloud
DB_PORT=3306
DB_USER=xxxxxxxx
DB_PASSWORD=xxxxxxxx
DB_NAME=tienda_camas
PORT=3000
CORS_ORIGIN=https://tienda-camas.vercel.app
```

### Paso 5: Verificar funcionamiento

```bash
# Probe endpoints
curl https://tienda-camas-api.onrender.com/api/health
# → {"status":"ok","timestamp":"..."}

# Probar frontend
# Abrir https://tienda-camas.vercel.app
```

---

## 10. API ENDPOINTS

### Vendedores
| Método | Ruta | Descripción |
|---|---|---|
| GET | /api/vendedores | Listar todos |
| GET | /api/vendedores/:id | Obtener uno |
| POST | /api/vendedores | Crear |
| PUT | /api/vendedores/:id | Actualizar |
| DELETE | /api/vendedores/:id | Eliminar |

### Productos
| Método | Ruta | Descripción |
|---|---|---|
| GET | /api/productos | Listar (filtro: ?activo=true) |
| GET | /api/productos/:id | Obtener uno |
| POST | /api/productos | Crear (calcula precio_base) |
| PUT | /api/productos/:id | Actualizar |
| DELETE | /api/productos/:id | Eliminar |

### Ventas
| Método | Ruta | Descripción |
|---|---|---|
| GET | /api/ventas | Listar (filtros: vendedor_id, desde, hasta) |
| GET | /api/ventas/:id | Obtener con detalle |
| POST | /api/ventas | Registrar venta (transacción) |
| DELETE | /api/ventas/:id | Eliminar |

### Inventario
| Método | Ruta | Descripción |
|---|---|---|
| GET | /api/inventario/stock | Stock actual con alertas |
| GET | /api/inventario/movimientos | Historial de movimientos |
| POST | /api/inventario/entrada | Registrar entrada de stock |

### Reportes (PDF)
| Método | Ruta | Descripción |
|---|---|---|
| GET | /api/reportes/vendedor/:id | PDF por vendedor |
| GET | /api/reportes/general | PDF general |
| GET | /api/reportes/inventario | PDF inventario |

---

## 11. COMANDOS RÁPIDOS

```bash
# Iniciar backend (desarrollo)
cd backend
npm install
npm run dev

# Iniciar frontend (desarrollo)
cd frontend
npm install
npm run dev

# Abrir en navegador
http://localhost:5173
```

---

## 12. SEGURIDAD

- **Autenticación**: Basic Auth con usuarios predefinidos en `auth.js`
- **CORS**: Configurado para permitir solo el origen del frontend
- **SQL Injection**: Prevenido mediante consultas parametrizadas (mysql2)
- **Validación**: Los controladores validan datos requeridos
- **Transacciones**: Las operaciones críticas (ventas) usan transacciones SQL
- **Despliegue**: En producción, usar HTTPS y variables de entorno

---

## 13. POSIBLES MEJORAS FUTURAS

- [ ] Autenticación JWT en lugar de Basic Auth
- [ ] WebSockets para actualizaciones en tiempo real
- [ ] Roles y permisos más granulares
- [ ] Dashboard con gráficos (Chart.js o Recharts)
- [ ] Notificaciones de stock bajo por email
- [ ] Módulo de proveedores
- [ ] Historial de precios por producto
- [ ] Backup automático de base de datos
- [ ] App móvil con React Native
- [ ] Facturación electrónica y SUNAT
