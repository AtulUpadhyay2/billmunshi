import { apiSlice } from "@/store/api/apiSlice";

export const zohoExpenseBillsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getZohoExpenseBills: builder.query({
      query: (organizationId) => ({
        url: `zoho/org/${organizationId}/expense-bills/`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      providesTags: ['ZohoExpenseBill'],
      transformErrorResponse: (response, meta, arg) => {
        console.error('Zoho Expense Bills API Error:', response);
        return response;
      },
    }),
    getZohoExpenseBill: builder.query({
      query: ({ organizationId, billId }) => ({
        url: `zoho/org/${organizationId}/expense-bills/${billId}/`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      providesTags: (result, error, { billId }) => [{ type: 'ZohoExpenseBill', id: billId }],
    }),
    getZohoExpenseBillDetails: builder.query({
      query: ({ organizationId, billId }) => ({
        url: `zoho/org/${organizationId}/expense-bills/${billId}/details/`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      providesTags: (result, error, { billId }) => [{ type: 'ZohoExpenseBillDetails', id: billId }],
    }),
    createZohoExpenseBill: builder.mutation({
      query: ({ organizationId, ...newBill }) => ({
        url: `zoho/org/${organizationId}/expense-bills/`,
        method: "POST",
        body: newBill,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: ['ZohoExpenseBill'],
    }),
    uploadZohoExpenseBills: builder.mutation({
      query: ({ organizationId, formData }) => {
        // The Zoho API expects 'file' field (same as what the modal sends)
        // Unlike Tally, we don't need to transform the field names for Zoho
        return {
          url: `zoho/org/${organizationId}/expense-bills/upload/`,
          method: "POST",
          body: formData, // Use the original formData without transformation
          // Don't set any Content-Type header for FormData uploads
        };
      },
      invalidatesTags: ['ZohoExpenseBill'],
    }),
    updateZohoExpenseBill: builder.mutation({
      query: ({ organizationId, id, ...patch }) => ({
        url: `zoho/org/${organizationId}/expense-bills/${id}/`,
        method: "PATCH",
        body: patch,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'ZohoExpenseBill', id }],
    }),
    deleteZohoExpenseBill: builder.mutation({
      query: ({ organizationId, id }) => ({
        url: `zoho/org/${organizationId}/expense-bills/${id}/delete/`,
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: ['ZohoExpenseBill'],
    }),
    analyzeZohoExpenseBill: builder.mutation({
      query: ({ organizationId, billId }) => ({
        url: `zoho/org/${organizationId}/expense-bills/${billId}/analyze/`,
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: (result, error, { billId }) => [{ type: 'ZohoExpenseBill', id: billId }],
    }),
    verifyZohoExpenseBill: builder.mutation({
      query: ({ organizationId, bill_id, ...verifyData }) => ({
        url: `zoho/org/${organizationId}/expense-bills/${bill_id}/verify/`,
        method: "POST",
        body: verifyData,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: (result, error, { bill_id }) => [
        { type: 'ZohoExpenseBill', id: bill_id },
        { type: 'ZohoExpenseBillDetails', id: bill_id }
      ],
    }),
    syncZohoExpenseBill: builder.mutation({
      query: ({ organizationId, billId }) => ({
        url: `zoho/org/${organizationId}/expense-bills/${billId}/sync/`,
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: (result, error, { billId }) => [
        { type: 'ZohoExpenseBill', id: billId },
        { type: 'ZohoExpenseBillDetails', id: billId }
      ],
    }),
  }),
});

export const {
  useGetZohoExpenseBillsQuery,
  useGetZohoExpenseBillQuery,
  useGetZohoExpenseBillDetailsQuery,
  useCreateZohoExpenseBillMutation,
  useUploadZohoExpenseBillsMutation,
  useUpdateZohoExpenseBillMutation,
  useDeleteZohoExpenseBillMutation,
  useAnalyzeZohoExpenseBillMutation,
  useVerifyZohoExpenseBillMutation,
  useSyncZohoExpenseBillMutation,
} = zohoExpenseBillsApi;