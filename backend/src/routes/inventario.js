const router = require('express').Router();
const controller = require('../controllers/inventarioController');

router.get('/movimientos', controller.getMovimientos);
router.get('/stock', controller.getStock);
router.post('/entrada', controller.entradaStock);

module.exports = router;
