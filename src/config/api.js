// API Configuration
export const API_CONFIG = {
  BASE_URL: "https://billmunshi.com/api/v1",
  TIMEOUT: 30000, // 30 seconds
};

// Helper to get full URL
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
