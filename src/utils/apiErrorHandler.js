import { globalToast } from './toast';
import store from '../store';
import { forceLogout } from '../store/api/auth/authSlice';

/**
 * Centralized API error handler
 * @param {Object} error - The error object from API response
 * @param {string} defaultMessage - Default error message if none found
 * @returns {boolean} - Returns true if token expiration was handled
 */
export const handleApiError = (error, defaultMessage = "An error occurred") => {
  console.error('API Error:', error);

  // Handle token expiration errors
  if (error?.status === 401) {
    const data = error.data;
    
    const isTokenExpired = 
      data?.code === "token_not_valid" ||
      data?.detail === "Given token not valid for any token type" ||
      (data?.messages && data.messages.some(msg => 
        msg.message === "Token is expired" || 
        msg.token_type === "access"
      ));

    if (isTokenExpired) {
      console.log("Token expired detected in error handler - this should be handled by apiSlice automatically");
      // Note: Token refresh is handled automatically by apiSlice.js baseQueryWithReauth
      // This error handler should only be called for errors that weren't handled by the automatic refresh
      store.dispatch(forceLogout());
      globalToast.error("Your session has expired. Please login again.");
      return true; // Token expiration handled
    }
  }

  // Handle other common error cases
  let errorMessage = defaultMessage;
  
  if (error?.data) {
    if (typeof error.data === 'string') {
      errorMessage = error.data;
    } else if (error.data.message) {
      errorMessage = error.data.message;
    } else if (error.data.detail) {
      errorMessage = error.data.detail;
    } else if (error.data.error) {
      errorMessage = error.data.error;
    }
  } else if (error?.message) {
    errorMessage = error.message;
  }

  // Show error toast
  globalToast.error(errorMessage);
  
  return false; // Token expiration not handled
};

/**
 * Extract error message from API error response
 * @param {Object} error - The error object from API response
 * @param {string} defaultMessage - Default error message if none found
 * @returns {string} - Extracted error message
 */
export const extractErrorMessage = (error, defaultMessage = "An error occurred") => {
  if (error?.data) {
    if (typeof error.data === 'string') {
      return error.data;
    } else if (error.data.message) {
      return error.data.message;
    } else if (error.data.detail) {
      return error.data.detail;
    } else if (error.data.error) {
      return error.data.error;
    }
  } else if (error?.message) {
    return error.message;
  }
  
  return defaultMessage;
};

/**
 * Check if error is a token expiration error
 * @param {Object} error - The error object from API response
 * @returns {boolean} - True if token is expired
 */
export const isTokenExpiredError = (error) => {
  if (error?.status === 401 && error?.data) {
    const data = error.data;
    
    return (
      data?.code === "token_not_valid" ||
      data?.detail === "Given token not valid for any token type" ||
      (data?.messages && data.messages.some(msg => 
        msg.message === "Token is expired" || 
        msg.token_type === "access"
      ))
    );
  }
  
  return false;
};

export default handleApiError;
