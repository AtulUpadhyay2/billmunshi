// API Client utility for TanStack Query
const BASE_URL = "https://billmunshi.com/api/v1/";

// Helper function to get authorization headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token");
  return {
    "Authorization": token ? `Bearer ${token}` : "",
  };
};

// Generic API fetch function
export const apiFetch = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: "An error occurred",
    }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};
