const router = require('express').Router();
const controller = require('../controllers/productoController');

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.put('/:id/activar', controller.activar);
router.delete('/:id', controller.remove);

module.exports = router;
