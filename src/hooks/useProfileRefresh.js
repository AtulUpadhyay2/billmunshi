import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLazyGetProfileQuery } from '@/store/api/auth/authApiSlice';
import { updateProfile } from '@/store/api/auth/authSlice';

const useProfileRefresh = (intervalMinutes = 5) => {
  const dispatch = useDispatch();
  const isAuth = useSelector((state) => state.auth.isAuth);
  const [triggerGetProfile] = useLazyGetProfileQuery();

  useEffect(() => {
    if (!isAuth) return;

    let cancelled = false;

    const refreshProfile = async () => {
      try {
        const result = await triggerGetProfile();
        if (cancelled) return;
        if (result.data && !result.error) {
          // updateProfile preserves tokens + selectedOrganization, so
          // periodic refresh cannot trigger a workspace switch or a redirect.
          dispatch(updateProfile(result.data));
        }
      } catch (error) {
        // Silent fail - don't disrupt user experience
      }
    };

    refreshProfile();
    const interval = setInterval(refreshProfile, intervalMinutes * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // Tokens are deliberately NOT in this dep array. Token rotation must not
    // re-fire profile refresh — that caused a render storm post-login.
  }, [isAuth, intervalMinutes, triggerGetProfile, dispatch]);
};

export default useProfileRefresh;
