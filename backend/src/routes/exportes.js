const router = require('express').Router();
const controller = require('../controllers/exporteController');

router.get('/productos', controller.productos);
router.get('/ventas', controller.ventas);
router.get('/inventario', controller.inventario);
router.get('/vendedores', controller.vendedores);

module.exports = router;
