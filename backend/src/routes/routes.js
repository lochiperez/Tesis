const express = require('express');
const router = express.Router();
const {
    saveRouteQuery,
    getRoutes,
    deleteRouteQuery
} = require('../controllers/routesController');

// Rutas para consultas de rutas
router.post('/', saveRouteQuery);
router.get('/', getRoutes);
router.delete('/:id', deleteRouteQuery);

module.exports = router;
