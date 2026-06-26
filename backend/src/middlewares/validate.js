const { z } = require('zod');

function validate(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map(e => ({
          campo: e.path.join('.'),
          mensaje: e.message,
        }));
        return res.status(400).json({ error: 'Datos inválidos', detalles: messages });
      }
      next(error);
    }
  };
}

const schemas = {
  login: z.object({
    username: z.string().min(1, 'Usuario requerido'),
    password: z.string().min(1, 'Contraseña requerida'),
  }),

  producto: z.object({
    codigo: z.string().min(1, 'Código requerido'),
    nombre: z.string().min(1, 'Nombre requerido'),
    descripcion: z.string().optional(),
    costo: z.number().positive('El costo debe ser positivo'),
    precio_venta: z.number().positive().optional(),
    stock: z.number().int().min(0).optional(),
    stock_minimo: z.number().int().min(0).optional(),
    categoria: z.string().optional(),
    categoria_id: z.number().int().positive().optional(),
    marca_id: z.number().int().positive().optional(),
  }),

  venta: z.object({
    vendedor_id: z.number().int().positive('Vendedor requerido'),
    productos: z.array(z.object({
      producto_id: z.number().int().positive(),
      cantidad: z.number().int().min(1, 'Cantidad mínima 1'),
      precio_final: z.number().positive().optional(),
    })).min(1, 'Debe incluir al menos un producto'),
  }),

  vendedor: z.object({
    nombre: z.string().min(1, 'Nombre requerido'),
    apellido: z.string().min(1, 'Apellido requerido'),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    telefono: z.string().optional(),
    sueldo_fijo: z.number().positive().optional(),
  }),
};

module.exports = { validate, schemas };
