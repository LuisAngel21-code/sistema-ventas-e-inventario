const router = require('express').Router();
const controller = require('../controllers/cajaController');

router.get('/sesion', controller.sesionActual);
router.post('/abrir', controller.abrir);
router.post('/cerrar', controller.cerrar);
router.get('/movimientos', controller.movimientos);
router.post('/movimientos', controller.registrar);
router.put('/movimientos/:id', controller.actualizar);
router.delete('/movimientos/:id', controller.eliminar);
router.get('/historial', controller.historial);

module.exports = router;
