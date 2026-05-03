import { createSlice } from "@reduxjs/toolkit";

const storedUser = JSON.parse(localStorage.getItem("user") || 'null');
const storedToken = localStorage.getItem("access_token");
const storedSelectedOrg = JSON.parse(localStorage.getItem("selected_org") || 'null');
// `storedSelectedOrg` is only used to seed the slice's initial state.
// Do not reference it after first render — read localStorage live instead.

export const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: storedUser || null,
    isAuth: !!(storedUser && storedToken),
    accessToken: storedToken || null,
    refreshToken: localStorage.getItem("refresh_token") || null,
    selectedOrganization: storedSelectedOrg || null,
  },
  reducers: {
    setUser: (state, action) => {
      const { user, access, refresh } = action.payload;
      state.user = user;
      state.accessToken = access;
      state.refreshToken = refresh;
      state.isAuth = true;
      // Initialize selected organization. Prefer the org currently in state
      // (the user may have switched workspaces during this session), then the
      // value persisted in localStorage. Only fall back to organizations[0]
      // when no prior selection exists at all — never silently switch the
      // user out of their current workspace.
      const organizations = Array.isArray(user?.organizations)
        ? user.organizations
        : [];
      const persistedRaw = localStorage.getItem("selected_org");
      const persisted = persistedRaw ? JSON.parse(persistedRaw) : null;
      let nextSelected = null;
      if (organizations.length > 0) {
        const candidate = state.selectedOrganization || persisted;
        if (candidate) {
          nextSelected =
            organizations.find((o) => o.id === candidate.id) ||
            // Candidate org was deleted/revoked — fall back to first.
            organizations[0];
        } else {
          nextSelected = organizations[0];
        }
      }
      state.selectedOrganization = nextSelected;

      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      if (nextSelected) {
        localStorage.setItem("selected_org", JSON.stringify(nextSelected));
      } else {
        localStorage.removeItem("selected_org");
      }
    },
    /**
     * Replace just the access/refresh token pair after a silent token
     * refresh. Does NOT touch user/selectedOrganization so subscribed
     * components do not re-render or re-run navigation effects.
     */
    setTokens: (state, action) => {
      const { access, refresh } = action.payload || {};
      if (access) state.accessToken = access;
      if (refresh) state.refreshToken = refresh;
    },
    /**
     * Refresh just the user profile (e.g. periodic profile poll, response
     * from token refresh). Does NOT touch tokens or `selectedOrganization`,
     * so it cannot trigger spurious workspace switches or re-render storms.
     */
    updateProfile: (state, action) => {
      const user = action.payload;
      if (!user) return;
      state.user = user;
      // Keep the selected org reference fresh if the same org is still in
      // the user's org list (e.g. its name was edited). Do not switch.
      if (state.selectedOrganization && Array.isArray(user.organizations)) {
        const match = user.organizations.find(
          (o) => o.id === state.selectedOrganization.id,
        );
        if (match) {
          state.selectedOrganization = match;
          localStorage.setItem("selected_org", JSON.stringify(match));
        }
      }
      localStorage.setItem("user", JSON.stringify(user));
    },
    setSelectedOrganization: (state, action) => {
      const org = action.payload; // {id, name, ...}
      state.selectedOrganization = org;
      localStorage.setItem("selected_org", JSON.stringify(org));
    },
    updateUserOrganizations: (state, action) => {
      // This action allows updating user organizations without a full login
      const organizations = action.payload;
      if (state.user) {
        state.user.organizations = organizations;
        localStorage.setItem("user", JSON.stringify(state.user));
        
        // Update selected organization if needed
        if (organizations.length === 0) {
          state.selectedOrganization = null;
          localStorage.removeItem("selected_org");
        } else if (state.selectedOrganization) {
          const match = organizations.find(o => o.id === state.selectedOrganization.id);
          if (!match) {
            state.selectedOrganization = organizations[0];
            localStorage.setItem("selected_org", JSON.stringify(organizations[0]));
          }
        }
      }
    },
    logOut: (state, action) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuth = false;
      state.selectedOrganization = null;
      
      // Clear from localStorage
      localStorage.removeItem("user");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("selected_org");
    },
    forceLogout: (state, action) => {
      // Similar to logOut but can carry additional metadata for forced logouts
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuth = false;
      state.selectedOrganization = null;
      
      // Clear from localStorage
      localStorage.removeItem("user");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("selected_org");
      
      // Could redirect to login page with a message
      if (typeof window !== 'undefined' && window.location) {
        setTimeout(() => {
          window.location.href = '/';
        }, 100);
      }
    },
  },
});

export const {
  setUser,
  setTokens,
  updateProfile,
  setSelectedOrganization,
  updateUserOrganizations,
  logOut,
  forceLogout,
} = authSlice.actions;
export default authSlice.reducer;
