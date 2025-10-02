import { apiSlice } from "../apiSlice";

export const zohoDashboardApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getZohoFunnel: builder.query({
      query: (organizationId) => ({
        url: `organizations/${organizationId}/zoho/funnel/`,
        method: 'GET',
      }),
      providesTags: ['ZohoFunnel'],
      transformErrorResponse: (response, meta, arg) => {
        console.error('Zoho Funnel API Error:', response);
        return response;
      },
    }),
    getZohoOverview: builder.query({
      query: (organizationId) => ({
        url: `organizations/${organizationId}/zoho/overview/`,
        method: 'GET',
      }),
      providesTags: ['ZohoOverview'],
      transformErrorResponse: (response, meta, arg) => {
        console.error('Zoho Overview API Error:', response);
        return response;
      },
    }),
    getZohoUsage: builder.query({
      query: (organizationId) => ({
        url: `organizations/${organizationId}/zoho/usage/`,
        method: 'GET',
      }),
      providesTags: ['ZohoUsage'],
      transformErrorResponse: (response, meta, arg) => {
        console.error('Zoho Usage API Error:', response);
        return response;
      },
    }),
  }),
});

export const { 
  useGetZohoFunnelQuery,
  useGetZohoOverviewQuery,
  useGetZohoUsageQuery
} = zohoDashboardApi;