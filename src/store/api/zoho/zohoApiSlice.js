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
  }),
});

export const { 
  useGetZohoCredentialsQuery, 
  useSyncZohoCredentialsMutation 
} = zohoApi;
