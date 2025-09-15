import { apiSlice } from "@/store/api/apiSlice";

export const tallyApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTallyConfigs: builder.query({
      query: (organizationId) => ({
        url: `tally/org/${organizationId}/configs/`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      providesTags: ['TallyConfig'],
      transformErrorResponse: (response, meta, arg) => {
        console.error('Tally Configs API Error:', response);
        return response;
      },
    }),
    createTallyConfig: builder.mutation({
      query: ({ organizationId, ...newConfig }) => ({
        url: `tally/org/${organizationId}/configs/`,
        method: "POST",
        body: newConfig,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: ['TallyConfig'],
    }),
    updateTallyConfig: builder.mutation({
      query: ({ organizationId, id, ...patch }) => ({
        url: `tally/org/${organizationId}/configs/${id}/`,
        method: "PATCH",
        body: patch,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'TallyConfig', id }],
    }),
    deleteTallyConfig: builder.mutation({
      query: ({ organizationId, id }) => ({
        url: `tally/org/${organizationId}/configs/${id}/`,
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: ['TallyConfig'],
    }),
    getTallyLedgers: builder.query({
      query: (organizationId) => ({
        url: `tally/org/${organizationId}/ledgers/`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      providesTags: ['TallyLedgers'],
      transformErrorResponse: (response, meta, arg) => {
        console.error('Tally Ledgers API Error:', response);
        return response;
      },
    }),
    getTallyVendorLedgers: builder.query({
      query: (organizationId) => ({
        url: `tally/org/${organizationId}/configs/ledgers/?parent_type=vendor_parents`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      providesTags: ['TallyVendorLedgers'],
      transformErrorResponse: (response, meta, arg) => {
        console.error('Tally Vendor Ledgers API Error:', response);
        return response;
      },
    }),
  }),
});

export const {
  useGetTallyConfigsQuery,
  useCreateTallyConfigMutation,
  useUpdateTallyConfigMutation,
  useDeleteTallyConfigMutation,
  useGetTallyLedgersQuery,
  useGetTallyVendorLedgersQuery,
} = tallyApi;