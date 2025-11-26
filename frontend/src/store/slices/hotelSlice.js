import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { hotelAPI } from '../../services/api';

export const fetchHotels = createAsyncThunk(
  'hotels/fetchHotels',
  async (params, { rejectWithValue }) => {
    try {
      const response = await hotelAPI.getHotels(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch hotels');
    }
  }
);

export const fetchHotel = createAsyncThunk(
  'hotels/fetchHotel',
  async (id, { rejectWithValue }) => {
    try {
      const response = await hotelAPI.getHotel(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch hotel');
    }
  }
);

const initialState = {
  hotels: [],
  currentHotel: null,
  pagination: null,
  loading: false,
  error: null,
};

const hotelSlice = createSlice({
  name: 'hotels',
  initialState,
  reducers: {
    clearHotels: (state) => {
      state.hotels = [];
      state.pagination = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHotels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHotels.fulfilled, (state, action) => {
        state.loading = false;
        // Handle both direct data array and wrapped response
        state.hotels = Array.isArray(action.payload.data) 
          ? action.payload.data 
          : Array.isArray(action.payload) 
            ? action.payload 
            : [];
        state.pagination = action.payload.pagination || null;
      })
      .addCase(fetchHotels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchHotel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHotel.fulfilled, (state, action) => {
        state.loading = false;
        state.currentHotel = action.payload.data;
      })
      .addCase(fetchHotel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearHotels, clearError } = hotelSlice.actions;
export default hotelSlice.reducer;

