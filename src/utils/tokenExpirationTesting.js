/**
 * Development utility to test token expiration handling
 * This should only be used in development/testing environments
 */

/**
 * Simulates a token expiration error response
 * @returns {Object} Mock error response matching the expected format
 */
export const createTokenExpiredError = () => ({
  status: 401,
  data: {
    detail: "Given token not valid for any token type",
    code: "token_not_valid",
    messages: [
      {
        token_class: "AccessToken",
        token_type: "access",
        message: "Token is expired"
      }
    ]
  }
});

/**
 * Manually trigger token expiration for testing
 * This will cause the app to logout the user as if their token expired
 */
export const simulateTokenExpiration = () => {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('simulateTokenExpiration should only be used in development');
    return;
  }

  // Import the error handler and simulate an expired token
  import('../utils/apiErrorHandler').then(({ handleApiError }) => {
    const mockError = createTokenExpiredError();
    console.log('Simulating token expiration with error:', mockError);
    handleApiError(mockError, 'Simulated token expiration');
  });
};

/**
 * Test helper to verify error detection
 * @param {Object} error - Error object to test
 * @returns {boolean} True if error would be detected as token expiration
 */
export const testTokenExpirationDetection = (error) => {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('testTokenExpirationDetection should only be used in development');
    return false;
  }

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

/**
 * Clear all tokens from localStorage (for testing)
 */
export const clearAllTokens = () => {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('clearAllTokens should only be used in development');
    return;
  }

  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  localStorage.removeItem("selected_org");
  console.log('All tokens cleared from localStorage');
};

/**
 * Add expired token to localStorage (for testing API calls with expired tokens)
 */
export const setExpiredToken = () => {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('setExpiredToken should only be used in development');
    return;
  }

  // Set a clearly expired/invalid token
  localStorage.setItem("access_token", "expired_token_for_testing");
  console.log('Set expired token in localStorage');
};

// Make functions available in browser console for manual testing
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.testTokenExpiration = {
    simulate: simulateTokenExpiration,
    createError: createTokenExpiredError,
    testDetection: testTokenExpirationDetection,
    clearTokens: clearAllTokens,
    setExpiredToken: setExpiredToken
  };
  
  console.log('Token expiration test utilities available:');
  console.log('- window.testTokenExpiration.simulate() - Simulate token expiration');
  console.log('- window.testTokenExpiration.clearTokens() - Clear all tokens');
  console.log('- window.testTokenExpiration.setExpiredToken() - Set expired token');
}
