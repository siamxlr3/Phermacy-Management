import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  loading: false,
  error: null,
  toasts: [],
};

const globalSlice = createSlice({
  name: 'global',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    addToast: (state, action) => {
      state.toasts.push({
        id: Date.now(),
        message: action.payload.message,
        type: action.payload.type || 'success',
      });
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    },
  },
});

export const { setLoading, setError, addToast, removeToast } = globalSlice.actions;
export default globalSlice.reducer;
