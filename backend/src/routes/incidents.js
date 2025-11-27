const express = require('express');
const router = express.Router();
const {
    createIncident,
    getIncidents,
    getIncidentsByArea,
    upvoteIncident,
    downvoteIncident,
    removeVote,
    deleteIncident
} = require('../controllers/incidentsController');

// Rutas de incidentes
router.post('/', createIncident);
router.get('/', getIncidents);
router.get('/area', getIncidentsByArea);

// Rutas de votación
router.post('/:id/upvote', upvoteIncident);
router.post('/:id/downvote', downvoteIncident);
router.delete('/:id/vote', removeVote);
router.delete('/:id', deleteIncident);
module.exports = router;
