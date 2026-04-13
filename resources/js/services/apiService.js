import axios from 'axios';
import { store } from '../store/store';
import { setLoading, setError, addToast } from '../store/slices/globalSlice';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    store.dispatch(setLoading(true));
    return config;
  },
  (error) => {
    store.dispatch(setLoading(false));
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    store.dispatch(setLoading(false));
    return response.data;
  },
  (error) => {
    store.dispatch(setLoading(false));
    
    const message = error.response?.data?.message || 'Something went wrong';
    
    store.dispatch(setError(message));
    store.dispatch(addToast({ message, type: 'error' }));
    
    return Promise.reject(error);
  }
);

export default api;
