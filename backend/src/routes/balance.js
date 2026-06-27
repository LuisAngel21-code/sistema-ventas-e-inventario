const router = require('express').Router();
const controller = require('../controllers/balanceController');

router.get('/', controller.getBalance);

module.exports = router;
