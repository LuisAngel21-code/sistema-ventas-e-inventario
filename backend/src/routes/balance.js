const router = require('express').Router();
const controller = require('../controllers/balanceController');

router.get('/', controller.getBalance);
router.get('/pdf', controller.exportPdf);

module.exports = router;
