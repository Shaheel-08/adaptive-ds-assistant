import axios from 'axios';

const api = axios.create({
  baseURL: 'https://adaptive-ds-backend.onrender.com/api',
  timeout: 120000, // 2 minutes — ML training can take time
});

// Request interceptor
api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor — unwrap error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

/**
 * Upload a CSV file for ML analysis.
 * @param {File} file
 * @param {function} onProgress - called with percent 0-100
 * @returns {Promise<Object>} analysis result
 */
export const analyzeDataset = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        if (onProgress) onProgress(percent);
      }
    },
  });

  return response.data;
};

/**
 * Check backend health
 */
export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
