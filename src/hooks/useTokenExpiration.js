import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { forceLogout } from '@/store/api/auth/authSlice';
import { globalToast } from '@/utils/toast';

/**
 * Hook to handle automatic logout when token expires
 * This can be used in components that need to handle token expiration gracefully
 */
export const useTokenExpiration = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuth } = useSelector((state) => state.auth);

  const handleTokenExpiration = (errorResponse) => {
    // Check if the error indicates token expiration
    if (errorResponse && errorResponse.status === 401) {
      const data = errorResponse.data;
      
      const isTokenExpired = 
        data?.code === "token_not_valid" ||
        data?.detail === "Given token not valid for any token type" ||
        (data?.messages && data.messages.some(msg => 
          msg.message === "Token is expired" || 
          msg.token_type === "access"
        ));

      if (isTokenExpired) {
        console.log("Token expired, logging out user");
        dispatch(forceLogout());
        globalToast.error("Your session has expired. Please login again.");
        navigate('/');
        return true;
      }
    }
    return false;
  };

  return { handleTokenExpiration };
};

/**
 * Higher-order component to wrap components with automatic token expiration handling
 */
export const withTokenExpiration = (WrappedComponent) => {
  return function TokenExpirationWrapper(props) {
    const { handleTokenExpiration } = useTokenExpiration();
    
    return (
      <WrappedComponent 
        {...props} 
        onTokenExpiration={handleTokenExpiration}
      />
    );
  };
};

export default useTokenExpiration;
