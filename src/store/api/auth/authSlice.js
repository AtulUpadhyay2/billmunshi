import { createSlice } from "@reduxjs/toolkit";

const storedUser = JSON.parse(localStorage.getItem("user") || 'null');
const storedToken = localStorage.getItem("access_token");
const storedSelectedOrg = JSON.parse(localStorage.getItem("selected_org") || 'null');

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
      // initialize selected organization
      const organizations = Array.isArray(user?.organizations)
        ? user.organizations
        : [];
      // If there's a stored org matching the new user's orgs, keep it; otherwise default to first
      let nextSelected = null;
      if (organizations.length > 0) {
        if (state.selectedOrganization) {
          const match = organizations.find(
            (o) => o.id === state.selectedOrganization.id
          );
          nextSelected = match || organizations[0];
        } else if (storedSelectedOrg) {
          const match = organizations.find((o) => o.id === storedSelectedOrg.id);
          nextSelected = match || organizations[0];
        } else {
          nextSelected = organizations[0];
        }
      }
      state.selectedOrganization = nextSelected;
      
      // Store in localStorage
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      if (nextSelected) {
        localStorage.setItem("selected_org", JSON.stringify(nextSelected));
      } else {
        localStorage.removeItem("selected_org");
      }
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

export const { setUser, setSelectedOrganization, updateUserOrganizations, logOut, forceLogout } = authSlice.actions;
export default authSlice.reducer;
