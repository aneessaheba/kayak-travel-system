const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');

router.get('/', hotelController.getHotels);
router.get('/:id', hotelController.getHotelById);
router.post('/', hotelController.createHotel);
router.put('/:id', hotelController.updateHotel);
router.delete('/:id', hotelController.deleteHotel);
router.post('/:id/reviews', hotelController.addReview);
router.put('/:id/rooms', hotelController.updateRooms);

module.exports = router;

