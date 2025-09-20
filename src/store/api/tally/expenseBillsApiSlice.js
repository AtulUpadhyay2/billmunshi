import { apiSlice } from "@/store/api/apiSlice";

export const tallyExpenseBillsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTallyExpenseBills: builder.query({
      query: (organizationId) => ({
        url: `tally/org/${organizationId}/expense-bills/`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      providesTags: ['TallyExpenseBill'],
      transformErrorResponse: (response, meta, arg) => {
        console.error('Tally Expense Bills API Error:', response);
        return response;
      },
    }),
    getTallyExpenseBill: builder.query({
      query: ({ organizationId, billId }) => ({
        url: `tally/org/${organizationId}/expense-bills/${billId}/`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      providesTags: (result, error, { billId }) => [{ type: 'TallyExpenseBill', id: billId }],
    }),
    getTallyExpenseBillDetails: builder.query({
      query: ({ organizationId, billId }) => ({
        url: `tally/org/${organizationId}/expense-bills/${billId}/details/`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      providesTags: (result, error, { billId }) => [{ type: 'TallyExpenseBillDetails', id: billId }],
    }),
    createTallyExpenseBill: builder.mutation({
      query: ({ organizationId, ...newBill }) => ({
        url: `tally/org/${organizationId}/expense-bills/`,
        method: "POST",
        body: newBill,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: ['TallyExpenseBill'],
    }),
    uploadTallyExpenseBills: builder.mutation({
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
          url: `tally/org/${organizationId}/expense-bills/upload/`,
          method: "POST",
          body: tallyFormData,
          // Don't set any Content-Type header for FormData uploads
        };
      },
      invalidatesTags: ['TallyExpenseBill'],
    }),
    updateTallyExpenseBill: builder.mutation({
      query: ({ organizationId, id, ...patch }) => ({
        url: `tally/org/${organizationId}/expense-bills/${id}/`,
        method: "PATCH",
        body: patch,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'TallyExpenseBill', id }],
    }),
    deleteTallyExpenseBill: builder.mutation({
      query: ({ organizationId, id }) => ({
        url: `tally/org/${organizationId}/expense-bills/${id}/delete/`,
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: ['TallyExpenseBill'],
    }),
    analyzeTallyExpenseBill: builder.mutation({
      query: ({ organizationId, billId }) => {
        const formData = new FormData();
        formData.append('bill_id', billId);
        
        return {
          url: `tally/org/${organizationId}/expense-bills/analyze/`,
          method: "POST",
          body: formData,
          // Don't set Content-Type header for FormData uploads
        };
      },
      invalidatesTags: (result, error, { billId }) => [{ type: 'TallyExpenseBill', id: billId }],
    }),
    verifyTallyExpenseBill: builder.mutation({
      query: ({ organizationId, ...verifyData }) => ({
        url: `tally/org/${organizationId}/expense-bills/verify/`,
        method: "POST",
        body: verifyData,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: (result, error, { bill_id }) => [
        { type: 'TallyExpenseBill', id: bill_id },
        { type: 'TallyExpenseBillDetails', id: bill_id }
      ],
    }),
    syncTallyExpenseBill: builder.mutation({
      query: ({ organizationId, billId }) => ({
        url: `tally/org/${organizationId}/expense-bills/sync/`,
        method: "POST",
        body: {
          bill_id: billId
        },
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: (result, error, { billId }) => [
        { type: 'TallyExpenseBill', id: billId },
        { type: 'TallyExpenseBillDetails', id: billId }
      ],
    }),
  }),
});

export const {
  useGetTallyExpenseBillsQuery,
  useGetTallyExpenseBillQuery,
  useGetTallyExpenseBillDetailsQuery,
  useCreateTallyExpenseBillMutation,
  useUploadTallyExpenseBillsMutation,
  useUpdateTallyExpenseBillMutation,
  useDeleteTallyExpenseBillMutation,
  useAnalyzeTallyExpenseBillMutation,
  useVerifyTallyExpenseBillMutation,
  useSyncTallyExpenseBillMutation,
} = tallyExpenseBillsApi;