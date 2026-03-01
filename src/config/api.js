// API Configuration — reads from .env (VITE_API_BASE_URL, VITE_API_TIMEOUT)
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || "https://billmunshi.com/api/v1",
  TIMEOUT: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
};

// Helper to get full URL
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
