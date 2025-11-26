import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminAPI } from '../../services/api';

// Async thunks
export const adminLogin = createAsyncThunk(
  'admin/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await adminAPI.login(credentials);
      if (response.data.success) {
        localStorage.setItem('adminToken', response.data.data.token);
        localStorage.setItem('admin', JSON.stringify(response.data.data.admin));
        return response.data.data;
      }
      return rejectWithValue(response.data.message);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const adminLogout = createAsyncThunk('admin/logout', async () => {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('admin');
});

export const fetchAnalytics = createAsyncThunk(
  'admin/fetchAnalytics',
  async (params, { rejectWithValue }) => {
    try {
      const response = await adminAPI.getAnalytics(params);
      if (response.data.success) {
        return response.data.data;
      }
      return rejectWithValue(response.data.message);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch analytics');
    }
  }
);

const initialState = {
  admin: JSON.parse(localStorage.getItem('admin')) || null,
  token: localStorage.getItem('adminToken') || null,
  isAuthenticated: !!localStorage.getItem('adminToken'),
  loading: false,
  error: null,
  analytics: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(adminLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(adminLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.admin = action.payload.admin;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(adminLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(adminLogout.fulfilled, (state) => {
        state.admin = null;
        state.token = null;
        state.isAuthenticated = false;
        state.analytics = null;
      })
      // Analytics
      .addCase(fetchAnalytics.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.analytics = action.payload;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = adminSlice.actions;
export default adminSlice.reducer;

