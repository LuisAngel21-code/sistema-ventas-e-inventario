const router = require('express').Router();
const controller = require('../controllers/marcaController');
const { adminOnly } = require('../middlewares/auth');

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', adminOnly, controller.create);
router.put('/:id', adminOnly, controller.update);
router.delete('/:id', adminOnly, controller.remove);

module.exports = router;
