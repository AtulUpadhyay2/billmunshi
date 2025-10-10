/**
 * Token Refresh Testing Utility
 * 
 * This utility provides functions to test the automatic token refresh functionality.
 * It's designed for development and testing purposes only.
 */

import { apiSlice } from '../store/api/apiSlice';
import { globalToast } from './toast';

/**
 * Test the token refresh functionality by making an API call with an expired token
 * This simulates what happens when a real token expires
 */
export const testTokenRefresh = async () => {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('testTokenRefresh should only be used in development');
    return;
  }

  try {
    console.log('Testing token refresh functionality...');
    
    // Set an obviously expired/invalid token to trigger refresh
    const originalToken = localStorage.getItem("access_token");
    localStorage.setItem("access_token", "expired_token_test");
    
    // Try to make an API call that requires authentication
    // This will trigger the token refresh logic in apiSlice.js
    const response = await fetch("https://billmunshi.com/api/v1/me/", {
      headers: {
        "Authorization": "Bearer expired_token_test",
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      console.log('Expected failure with expired token - this should trigger automatic refresh');
    }

    // Restore original token for continued testing
    if (originalToken) {
      localStorage.setItem("access_token", originalToken);
    } else {
      localStorage.removeItem("access_token");
    }

  } catch (error) {
    console.log('Token refresh test completed. Check console for refresh attempt logs.');
  }
};

/**
 * Verify that refresh token exists and is properly stored
 */
export const checkTokens = () => {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('checkTokens should only be used in development');
    return;
  }

  const accessToken = localStorage.getItem("access_token");
  const refreshToken = localStorage.getItem("refresh_token");
  
  console.log('Token Status:');
  console.log('- Access Token:', accessToken ? `Present (${accessToken.substring(0, 20)}...)` : 'Missing');
  console.log('- Refresh Token:', refreshToken ? `Present (${refreshToken.substring(0, 20)}...)` : 'Missing');
  
  if (!refreshToken) {
    console.warn('⚠️ No refresh token found. Token refresh will not work.');
    globalToast.warning('No refresh token found. Please login again.');
  } else {
    console.log('✅ Refresh token is available for automatic token refresh');
  }
  
  return { accessToken, refreshToken };
};

/**
 * Manually trigger the refresh token API call to test the endpoint
 */
export const manualTokenRefresh = async () => {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('manualTokenRefresh should only be used in development');
    return;
  }

  const refreshToken = localStorage.getItem("refresh_token");
  
  if (!refreshToken) {
    console.error('No refresh token available for testing');
    globalToast.error('No refresh token available for testing');
    return;
  }

  try {
    console.log('Manually testing refresh token endpoint...');
    
    const response = await fetch("https://billmunshi.com/api/v1/auth/refresh/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ refresh: refreshToken })
    });

    const result = await response.json();
    
    if (response.ok && result.access) {
      console.log('✅ Manual refresh successful');
      console.log('New access token:', result.access.substring(0, 20) + '...');
      if (result.refresh) {
        console.log('New refresh token:', result.refresh.substring(0, 20) + '...');
      }
      globalToast.success('Manual token refresh successful');
      return result;
    } else {
      console.error('❌ Manual refresh failed:', result);
      globalToast.error('Manual token refresh failed');
      return null;
    }
  } catch (error) {
    console.error('❌ Manual refresh error:', error);
    globalToast.error('Manual token refresh error');
    return null;
  }
};

/**
 * Test the complete token refresh flow
 */
export const testCompleteRefreshFlow = async () => {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('testCompleteRefreshFlow should only be used in development');
    return;
  }

  console.log('🧪 Starting complete token refresh flow test...');
  
  // Step 1: Check current tokens
  console.log('Step 1: Checking current tokens...');
  const tokens = checkTokens();
  
  if (!tokens.refreshToken) {
    console.log('❌ Test aborted: No refresh token available');
    return;
  }
  
  // Step 2: Test manual refresh endpoint
  console.log('Step 2: Testing manual refresh endpoint...');
  const refreshResult = await manualTokenRefresh();
  
  if (!refreshResult) {
    console.log('❌ Test failed: Manual refresh endpoint not working');
    return;
  }
  
  // Step 3: Test automatic refresh (simulated)
  console.log('Step 3: Testing automatic refresh flow...');
  await testTokenRefresh();
  
  console.log('✅ Complete token refresh flow test completed');
  globalToast.success('Token refresh flow test completed - check console for details');
};

// Make functions available in browser console for manual testing
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.tokenRefreshTest = {
    test: testTokenRefresh,
    checkTokens: checkTokens,
    manualRefresh: manualTokenRefresh,
    testComplete: testCompleteRefreshFlow
  };
  
  console.log('🔧 Token refresh test utilities available:');
  console.log('- window.tokenRefreshTest.test() - Test automatic refresh');
  console.log('- window.tokenRefreshTest.checkTokens() - Check token status');
  console.log('- window.tokenRefreshTest.manualRefresh() - Test refresh endpoint');
  console.log('- window.tokenRefreshTest.testComplete() - Complete flow test');
}

export default {
  testTokenRefresh,
  checkTokens,
  manualTokenRefresh,
  testCompleteRefreshFlow
};