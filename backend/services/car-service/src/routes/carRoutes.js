const express = require('express');
const router = express.Router();
const carController = require('../controllers/carController');

router.get('/', carController.getCars);
router.get('/:id', carController.getCarById);
router.post('/', carController.createCar);
router.put('/:id', carController.updateCar);
router.delete('/:id', carController.deleteCar);
router.post('/:id/reviews', carController.addReview);
router.post('/:id/bookings', carController.addBooking);

module.exports = router;

