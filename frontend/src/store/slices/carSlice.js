import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { carAPI } from '../../services/api';

export const fetchCars = createAsyncThunk(
  'cars/fetchCars',
  async (params, { rejectWithValue }) => {
    try {
      const response = await carAPI.getCars(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch cars');
    }
  }
);

export const fetchCar = createAsyncThunk(
  'cars/fetchCar',
  async (id, { rejectWithValue }) => {
    try {
      const response = await carAPI.getCar(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch car');
    }
  }
);

const initialState = {
  cars: [],
  currentCar: null,
  pagination: null,
  loading: false,
  error: null,
};

const carSlice = createSlice({
  name: 'cars',
  initialState,
  reducers: {
    clearCars: (state) => {
      state.cars = [];
      state.pagination = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCars.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCars.fulfilled, (state, action) => {
        state.loading = false;
        // Handle both direct data array and wrapped response
        state.cars = Array.isArray(action.payload.data) 
          ? action.payload.data 
          : Array.isArray(action.payload) 
            ? action.payload 
            : [];
        state.pagination = action.payload.pagination || null;
      })
      .addCase(fetchCars.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchCar.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCar.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCar = action.payload.data;
      })
      .addCase(fetchCar.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCars, clearError } = carSlice.actions;
export default carSlice.reducer;

