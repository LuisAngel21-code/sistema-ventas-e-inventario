const router = require('express').Router();
const controller = require('../controllers/entregaController');
router.get('/', controller.getAll);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);
router.put('/:id/estado', controller.updateEstado);
module.exports = router;
