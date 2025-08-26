import { apiSlice } from "../apiSlice";

export const zohoApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getZohoCredentials: builder.query({
      query: (organizationId) => ({
        url: `zoho/${organizationId}/credentials/`,
        method: 'GET',
      }),
      providesTags: ['ZohoCredentials'],
      transformErrorResponse: (response, meta, arg) => {
        console.error('Zoho Credentials API Error:', response);
        return response;
      },
    }),
    syncZohoCredentials: builder.mutation({
      query: (organizationId) => ({
        url: `zoho/${organizationId}/credentials/sync/`,
        method: 'POST',
      }),
      invalidatesTags: ['ZohoCredentials'],
    }),
    getChartOfAccounts: builder.query({
      query: (organizationId) => ({
        url: `zoho/${organizationId}/chart-of-accounts/`,
        method: 'GET',
      }),
      providesTags: ['ChartOfAccounts'],
      transformErrorResponse: (response, meta, arg) => {
        console.error('Chart of Accounts API Error:', response);
        return response;
      },
    }),
    syncChartOfAccounts: builder.mutation({
      query: (organizationId) => ({
        url: `zoho/${organizationId}/chart-of-accounts/sync/`,
        method: 'POST',
      }),
      invalidatesTags: ['ChartOfAccounts'],
    }),
    getTaxes: builder.query({
      query: (organizationId) => ({
        url: `zoho/${organizationId}/taxes/`,
        method: 'GET',
      }),
      providesTags: ['Taxes'],
      transformErrorResponse: (response, meta, arg) => {
        console.error('Taxes API Error:', response);
        return response;
      },
    }),
    syncTaxes: builder.mutation({
      query: (organizationId) => ({
        url: `zoho/${organizationId}/taxes/sync/`,
        method: 'POST',
      }),
      invalidatesTags: ['Taxes'],
    }),
    getTdsTcs: builder.query({
      query: (organizationId) => ({
        url: `zoho/${organizationId}/tds-tcs/`,
        method: 'GET',
      }),
      providesTags: ['TdsTcs'],
      transformErrorResponse: (response, meta, arg) => {
        console.error('TDS/TCS API Error:', response);
        return response;
      },
    }),
    syncTdsTcs: builder.mutation({
      query: (organizationId) => ({
        url: `zoho/${organizationId}/tds-tcs/sync/`,
        method: 'POST',
      }),
      invalidatesTags: ['TdsTcs'],
    }),
    getVendors: builder.query({
      query: (organizationId) => ({
        url: `zoho/${organizationId}/vendors/`,
        method: 'GET',
      }),
      providesTags: ['Vendors'],
      transformErrorResponse: (response, meta, arg) => {
        console.error('Vendors API Error:', response);
        return response;
      },
    }),
    syncVendors: builder.mutation({
      query: (organizationId) => ({
        url: `zoho/${organizationId}/vendors/sync/`,
        method: 'POST',
      }),
      invalidatesTags: ['Vendors'],
    }),
    getVendorCredits: builder.query({
      query: (organizationId) => ({
        url: `zoho/${organizationId}/vendor-credits/`,
        method: 'GET',
      }),
      providesTags: ['VendorCredits'],
      transformErrorResponse: (response, meta, arg) => {
        console.error('Vendor Credits API Error:', response);
        return response;
      },
    }),
    syncVendorCredits: builder.mutation({
      query: (organizationId) => ({
        url: `zoho/${organizationId}/vendor-credits/sync/`,
        method: 'POST',
      }),
      invalidatesTags: ['VendorCredits'],
    }),
  }),
});

export const { 
  useGetZohoCredentialsQuery, 
  useSyncZohoCredentialsMutation,
  useGetChartOfAccountsQuery,
  useSyncChartOfAccountsMutation,
  useGetTaxesQuery,
  useSyncTaxesMutation,
  useGetTdsTcsQuery,
  useSyncTdsTcsMutation,
  useGetVendorsQuery,
  useSyncVendorsMutation,
  useGetVendorCreditsQuery,
  useSyncVendorCreditsMutation
} = zohoApi;
