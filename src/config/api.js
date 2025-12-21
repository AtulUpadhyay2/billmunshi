// API Configuration
export const API_CONFIG = {
  BASE_URL: "http://192.168.31.246:8000/api/v1",
  TIMEOUT: 30000, // 30 seconds
};

// Helper to get full URL
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
