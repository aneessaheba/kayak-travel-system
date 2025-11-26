import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { flightAPI } from '../../services/api';

export const fetchFlights = createAsyncThunk(
  'flights/fetchFlights',
  async (params, { rejectWithValue }) => {
    try {
      // Remove isReturn from API params (it's only for Redux state management)
      const { isReturn, ...apiParams } = params;
      const response = await flightAPI.getFlights(apiParams);
      return { ...response.data, isReturn: isReturn || false };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch flights');
    }
  }
);

export const fetchFlight = createAsyncThunk(
  'flights/fetchFlight',
  async (id, { rejectWithValue }) => {
    try {
      const response = await flightAPI.getFlight(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch flight');
    }
  }
);

const initialState = {
  flights: [],
  returnFlights: [],
  currentFlight: null,
  pagination: null,
  returnPagination: null,
  loading: false,
  returnLoading: false,
  error: null,
};

const flightSlice = createSlice({
  name: 'flights',
  initialState,
  reducers: {
    clearFlights: (state) => {
      state.flights = [];
      state.returnFlights = [];
      state.pagination = null;
      state.returnPagination = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFlights.pending, (state, action) => {
        const isReturn = action.meta.arg?.isReturn || false;
        if (isReturn) {
          state.returnLoading = true;
        } else {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchFlights.fulfilled, (state, action) => {
        const isReturn = action.payload.isReturn || action.meta.arg?.isReturn || false;
        const payload = action.payload;
        
        if (isReturn) {
          state.returnLoading = false;
          // Handle both direct data array and wrapped response
          state.returnFlights = Array.isArray(payload.data) 
            ? payload.data 
            : Array.isArray(payload) 
              ? payload 
              : [];
          state.returnPagination = payload.pagination || null;
        } else {
          state.loading = false;
          // Handle both direct data array and wrapped response
          state.flights = Array.isArray(payload.data) 
            ? payload.data 
            : Array.isArray(payload) 
              ? payload 
              : [];
          state.pagination = payload.pagination || null;
        }
      })
      .addCase(fetchFlights.rejected, (state, action) => {
        const isReturn = action.meta.arg?.isReturn || false;
        if (isReturn) {
          state.returnLoading = false;
        } else {
          state.loading = false;
        }
        state.error = action.payload;
      })
      .addCase(fetchFlight.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFlight.fulfilled, (state, action) => {
        state.loading = false;
        state.currentFlight = action.payload.data;
      })
      .addCase(fetchFlight.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearFlights, clearError } = flightSlice.actions;
export default flightSlice.reducer;

