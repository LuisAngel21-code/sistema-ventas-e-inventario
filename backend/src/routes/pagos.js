const router = require('express').Router();
const controller = require('../controllers/pagoController');

router.get('/', controller.listar);
router.post('/calcular', controller.calcular);
router.delete('/:id', controller.remove);
router.put('/:id/adelanto', controller.adelanto);
router.put('/:id/pagar', controller.marcarPagado);

module.exports = router;
