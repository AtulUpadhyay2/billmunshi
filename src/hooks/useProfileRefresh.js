import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLazyGetProfileQuery } from '@/store/api/auth/authApiSlice';
import { setUser } from '@/store/api/auth/authSlice';

const useProfileRefresh = (intervalMinutes = 5) => {
  const dispatch = useDispatch();
  const { isAuth, accessToken, refreshToken } = useSelector((state) => state.auth);
  const [triggerGetProfile] = useLazyGetProfileQuery();

  useEffect(() => {
    if (!isAuth) return;

    const refreshProfile = async () => {
      try {
        const result = await triggerGetProfile();
        if (result.data && !result.error) {
          // Update user data in store with fresh profile data
          dispatch(setUser({
            user: result.data,
            access: accessToken,
            refresh: refreshToken
          }));
        }
      } catch (error) {
        console.log('Background profile refresh failed:', error);
        // Silent fail - don't disrupt user experience
      }
    };

    // Refresh immediately on mount, then set interval
    refreshProfile();
    
    const interval = setInterval(refreshProfile, intervalMinutes * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [isAuth, intervalMinutes, triggerGetProfile, dispatch, accessToken, refreshToken]);
};

export default useProfileRefresh;
