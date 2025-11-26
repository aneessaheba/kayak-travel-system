const express = require('express');
const router = express.Router();
const flightController = require('../controllers/flightController');

// Public routes
router.get('/', flightController.getFlights);
router.get('/flight/:flightId', flightController.getFlightByFlightId);
router.get('/:id', flightController.getFlightById);

// Admin routes (add authentication middleware later)
router.post('/', flightController.createFlight);
router.put('/:id', flightController.updateFlight);
router.delete('/:id', flightController.deleteFlight);
router.post('/:id/reviews', flightController.addReview);
router.put('/:id/seats', flightController.updateSeats);

module.exports = router;

