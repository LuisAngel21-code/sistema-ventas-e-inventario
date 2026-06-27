const router = require('express').Router();
const controller = require('../controllers/pagoController');

router.get('/', controller.listar);
router.post('/calcular', controller.calcular);
router.put('/:id/pagar', controller.marcarPagado);

module.exports = router;
