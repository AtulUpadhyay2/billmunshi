import { apiSlice } from "@/store/api/apiSlice";

export const tallyVendorBillsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTallyVendorBills: builder.query({
      query: (organizationId) => ({
        url: `tally/org/${organizationId}/vendor-bills/`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      providesTags: ['TallyVendorBill'],
      transformErrorResponse: (response, meta, arg) => {
        console.error('Tally Vendor Bills API Error:', response);
        return response;
      },
    }),
    getTallyVendorBill: builder.query({
      query: ({ organizationId, billId }) => ({
        url: `tally/org/${organizationId}/vendor-bills/${billId}/`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      providesTags: (result, error, { billId }) => [{ type: 'TallyVendorBill', id: billId }],
    }),
    getTallyVendorBillDetails: builder.query({
      query: ({ organizationId, billId }) => ({
        url: `tally/org/${organizationId}/vendor-bills/${billId}/details/`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      providesTags: (result, error, { billId }) => [{ type: 'TallyVendorBillDetails', id: billId }],
    }),
    createTallyVendorBill: builder.mutation({
      query: ({ organizationId, ...newBill }) => ({
        url: `tally/org/${organizationId}/vendor-bills/`,
        method: "POST",
        body: newBill,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: ['TallyVendorBill'],
    }),
    uploadTallyVendorBills: builder.mutation({
      query: ({ organizationId, formData }) => {
        // Create a new FormData to ensure proper field naming for Tally API
        const tallyFormData = new FormData();
        
        // The Tally API expects 'files' field, but the modal sends 'file'
        // So we need to transform the FormData
        for (let [key, value] of formData.entries()) {
          if (key === 'file') {
            // Rename 'file' to 'files' for Tally API
            tallyFormData.append('files', value);
          } else {
            // Keep other fields as is
            tallyFormData.append(key, value);
          }
        }
        
        return {
          url: `tally/org/${organizationId}/vendor-bills/upload/`,
          method: "POST",
          body: tallyFormData,
          // Don't set any Content-Type header for FormData uploads
        };
      },
      invalidatesTags: ['TallyVendorBill'],
    }),
    updateTallyVendorBill: builder.mutation({
      query: ({ organizationId, id, ...patch }) => ({
        url: `tally/org/${organizationId}/vendor-bills/${id}/`,
        method: "PATCH",
        body: patch,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'TallyVendorBill', id }],
    }),
    deleteTallyVendorBill: builder.mutation({
      query: ({ organizationId, id }) => ({
        url: `tally/org/${organizationId}/vendor-bills/${id}/delete/`,
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: ['TallyVendorBill'],
    }),
    analyzeTallyVendorBill: builder.mutation({
      query: ({ organizationId, billId }) => {
        const formData = new FormData();
        formData.append('bill_id', billId);
        
        return {
          url: `tally/org/${organizationId}/vendor-bills/analyze/`,
          method: "POST",
          body: formData,
          // Don't set Content-Type header for FormData uploads
        };
      },
      invalidatesTags: (result, error, { billId }) => [{ type: 'TallyVendorBill', id: billId }],
    }),
    verifyTallyVendorBill: builder.mutation({
      query: ({ organizationId, ...verifyData }) => ({
        url: `tally/org/${organizationId}/vendor-bills/verify/`,
        method: "POST",
        body: verifyData,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: (result, error, { bill_id }) => [
        { type: 'TallyVendorBill', id: bill_id },
        { type: 'TallyVendorBillDetails', id: bill_id }
      ],
    }),
    syncTallyVendorBill: builder.mutation({
      query: ({ organizationId, billId }) => ({
        url: `tally/org/${organizationId}/vendor-bills/sync/`,
        method: "POST",
        body: {
          bill_id: billId
        },
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: (result, error, { billId }) => [
        { type: 'TallyVendorBill', id: billId },
        { type: 'TallyVendorBillDetails', id: billId }
      ],
    }),
  }),
});

export const {
  useGetTallyVendorBillsQuery,
  useGetTallyVendorBillQuery,
  useGetTallyVendorBillDetailsQuery,
  useCreateTallyVendorBillMutation,
  useUploadTallyVendorBillsMutation,
  useUpdateTallyVendorBillMutation,
  useDeleteTallyVendorBillMutation,
  useAnalyzeTallyVendorBillMutation,
  useVerifyTallyVendorBillMutation,
  useSyncTallyVendorBillMutation,
} = tallyVendorBillsApi;