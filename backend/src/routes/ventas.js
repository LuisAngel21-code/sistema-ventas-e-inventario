const router = require('express').Router();
const controller = require('../controllers/ventaController');
const upload = require('../middlewares/upload');

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', upload.fields([
  { name: 'comprobante', maxCount: 1 },
  { name: 'voucher', maxCount: 1 },
]), controller.create);
router.put('/:id/abonar', controller.abonar);
router.delete('/:id', controller.remove);

module.exports = router;
