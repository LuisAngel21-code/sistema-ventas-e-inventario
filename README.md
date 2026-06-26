# Mueblería Cams — Sistema de Gestión v3.0

Sistema de ventas e inventario para Mueblería Cams.

## Stack

- **Backend:** Node.js + Express + PostgreSQL
- **Frontend:** React 18 + Vite + TailwindCSS + Lucide Icons
- **Auth:** JWT + bcrypt
- **DB:** PostgreSQL con migraciones manuales

## Mejoras implementadas v3.0

- ✅ PostgreSQL (SQLite → Railway PostgreSQL)
- ✅ JWT Auth (Basic Auth hardcodeado → JWT con roles)
- ✅ bcrypt (contraseñas en texto plano → hash)
- ✅ Login por vendedor (admin y vendedor con credenciales propias)
- ✅ Categorías y Marcas como entidades separadas
- ✅ Diseño profesional con Outfit + DM Sans, paleta corporativa
- ✅ Iconos Lucide con color del tema
- ✅ Componentes UI reutilizables
- ✅ Subida de imágenes para productos
- ✅ Validación con Zod (backend)
- ✅ Reportes PDF con comisiones y sobreprecio

## Instalación local

```bash
# Clonar
git clone <repo-url>
cd sistema-ventas-e-inventario

# Backend
cd backend
cp .env.example .env   # Configurar DATABASE_URL
npm install
npm run db:init        # Crear tablas
npm run db:seed        # Datos de ejemplo
npm run dev

# Frontend (otra terminal)
cd frontend
npm install
npm run dev
```

### Credenciales de prueba

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| admin | admin123 | Admin |
| maria | vendedor123 | Vendedor |
| carlos | vendedor123 | Vendedor |
| ana | vendedor123 | Vendedor |

## Deploy en Railway

### 1. Conectar el repo

```bash
railway login
railway init
railway link
```

### 2. Agregar PostgreSQL

```bash
railway add
# Seleccionar "PostgreSQL"
```

Railway asigna automáticamente `DATABASE_URL`.

### 3. Configurar variables de entorno

```bash
railway variables set JWT_SECRET=tu_secreto_seguro_aqui
railway variables set NODE_ENV=production
railway variables set CORS_ORIGIN=https://tudominio.railway.app
```

### 4. Desplegar

```bash
railway up
```

### 5. Inicializar BD

```bash
railway run cd backend && node src/database/init.js
railway run cd backend && node src/database/seed.js
```

Tu app estará en `https://sistema-ventas-e-inventario.up.railway.app`

## Estructura del proyecto

```
├── backend/
│   └── src/
│       ├── config/database.js      # PostgreSQL pool
│       ├── controllers/            # Lógica de negocio
│       ├── database/
│       │   ├── init.js             # Creación de tablas
│       │   └── seed.js             # Datos de ejemplo
│       ├── middlewares/
│       │   ├── auth.js             # JWT + adminOnly
│       │   ├── upload.js           # Multer (imágenes)
│       │   └── validate.js         # Zod schemas
│       ├── routes/                 # Rutas Express
│       ├── services/pdfService.js  # PDF generation
│       ├── utils/calculations.js   # Lógica de comisiones
│       └── server.js               # Entry point
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Layout.jsx          # Sidebar + header
│       │   └── ui/                 # Button, Input, Modal, etc.
│       ├── context/AuthContext.jsx # Auth con JWT
│       ├── pages/                  # Dashboard, Ventas, etc.
│       └── services/api.js         # HTTP client
└── railway.json                    # Deploy config
```
