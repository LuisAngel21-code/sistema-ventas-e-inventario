const router = require('express').Router();
const controller = require('../controllers/cuentaController');
router.get('/', controller.getAll);
router.post('/', controller.create);
router.post('/:id/pagar', controller.pagarCuota);
router.get('/:id/pagos', controller.pagos);
module.exports = router;
