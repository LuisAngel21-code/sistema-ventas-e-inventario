const router = require('express').Router();
const controller = require('../controllers/ventaController');

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id/anular', controller.anular);

module.exports = router;
