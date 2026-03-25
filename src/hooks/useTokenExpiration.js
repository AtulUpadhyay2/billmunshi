import { useSelector } from "react-redux";
import { isTokenExpiredError } from "@/utils/tokenRefresh";

/**
 * Hook to check whether an error is a token-expiration error.
 *
 * NOTE: Actual refresh & logout are handled centrally by the shared
 * tokenRefresh module (used in apiClient + apiSlice interceptors).
 * This hook only returns whether the error was a token error so callers
 * can decide how to render.
 */
export const useTokenExpiration = () => {
  const { isAuth } = useSelector((state) => state.auth);

  const handleTokenExpiration = (errorResponse) => {
    if (errorResponse && errorResponse.status === 401) {
      return isTokenExpiredError(errorResponse.data);
    }
    return false;
  };

  return { handleTokenExpiration, isAuth };
};

/**
 * Higher-order component to wrap components with token expiration awareness.
 */
export const withTokenExpiration = (WrappedComponent) => {
  return function TokenExpirationWrapper(props) {
    const { handleTokenExpiration } = useTokenExpiration();

    return (
      <WrappedComponent {...props} onTokenExpiration={handleTokenExpiration} />
    );
  };
};

export default useTokenExpiration;
