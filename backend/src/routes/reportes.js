const router = require('express').Router();
const controller = require('../controllers/reporteController');

router.get('/vendedor/:id', controller.reportePorVendedor);
router.get('/general', controller.reporteGeneral);
router.get('/inventario', controller.reporteInventario);

module.exports = router;
