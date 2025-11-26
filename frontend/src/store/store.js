import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import flightReducer from './slices/flightSlice';
import hotelReducer from './slices/hotelSlice';
import carReducer from './slices/carSlice';
import bookingReducer from './slices/bookingSlice';
import adminReducer from './slices/adminSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    flights: flightReducer,
    hotels: hotelReducer,
    cars: carReducer,
    bookings: bookingReducer,
    admin: adminReducer,
  },
});

