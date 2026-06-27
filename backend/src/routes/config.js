const router = require('express').Router();
const controller = require('../controllers/configController');

router.get('/:clave', controller.get);
router.put('/:clave', controller.set);

module.exports = router;
