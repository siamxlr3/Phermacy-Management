import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/apiService';

export const fetchSuppliers = createAsyncThunk(
  'supplier/fetchSuppliers',
  async (_, { rejectWithValue }) => {
    try {
      return await api.get('/suppliers');
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch suppliers');
    }
  }
);

const supplierSlice = createSlice({
  name: 'supplier',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSuppliers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchSuppliers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.data || [];
      })
      .addCase(fetchSuppliers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export default supplierSlice.reducer;
