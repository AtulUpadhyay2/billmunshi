import { apiSlice } from "../apiSlice";

export const tallyDashboardApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTallyFunnel: builder.query({
      query: (organizationId) => ({
        url: `organizations/${organizationId}/tally/funnel/`,
        method: 'GET',
      }),
      providesTags: ['TallyFunnel'],
      transformErrorResponse: (response, meta, arg) => {
        console.error('Tally Funnel API Error:', response);
        return response;
      },
    }),
    getTallyOverview: builder.query({
      query: (organizationId) => ({
        url: `organizations/${organizationId}/tally/overview/`,
        method: 'GET',
      }),
      providesTags: ['TallyOverview'],
      transformErrorResponse: (response, meta, arg) => {
        console.error('Tally Overview API Error:', response);
        return response;
      },
    }),
    getTallyUsage: builder.query({
      query: (organizationId) => ({
        url: `organizations/${organizationId}/tally/usage/`,
        method: 'GET',
      }),
      providesTags: ['TallyUsage'],
      transformErrorResponse: (response, meta, arg) => {
        console.error('Tally Usage API Error:', response);
        return response;
      },
    }),
  }),
});

export const { 
  useGetTallyFunnelQuery,
  useGetTallyOverviewQuery,
  useGetTallyUsageQuery
} = tallyDashboardApi;