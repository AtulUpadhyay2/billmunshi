import { createSlice } from "@reduxjs/toolkit";
import { apiSlice } from "../apiSlice";

// API endpoints for modules
export const modulesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getOrganizationModules: builder.query({
      query: (organizationId) => ({
        url: `organizations/${organizationId}/modules/`,
        method: 'GET',
      }),
      providesTags: ['Modules'],
      transformErrorResponse: (response, meta, arg) => {
        console.error('Modules API Error:', response);
        return response;
      },
    }),
  }),
});

export const { useGetOrganizationModulesQuery } = modulesApiSlice;

// Modules slice for local state management
const modulesSlice = createSlice({
  name: "modules",
  initialState: {
    enabledModules: [],
    loading: false,
    error: null,
  },
  reducers: {
    setEnabledModules: (state, action) => {
      state.enabledModules = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setEnabledModules, setLoading, setError } = modulesSlice.actions;
export default modulesSlice.reducer;
