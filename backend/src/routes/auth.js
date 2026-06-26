const router = require('express').Router();
const controller = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validate');

router.post('/login', validate(schemas.login), controller.login);
router.get('/me', authenticate, controller.me);
router.put('/password', authenticate, controller.cambiarPassword);

module.exports = router;
