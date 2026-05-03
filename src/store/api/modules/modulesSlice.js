import { apiSlice } from "../apiSlice";

// API endpoints for modules
export const modulesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getOrganizationModules: builder.query({
      query: (organizationId) => ({
        url: `org/${organizationId}/modules/`,
        method: 'GET',
      }),
      providesTags: ['Modules'],
    }),
  }),
});

export const { useGetOrganizationModulesQuery } = modulesApiSlice;
