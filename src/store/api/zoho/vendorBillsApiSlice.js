import { apiSlice } from "@/store/api/apiSlice";

export const vendorBillsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getVendorBills: builder.query({
      query: (organizationId) => ({
        url: `zoho/org/${organizationId}/vendor-bills/`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      providesTags: ['VendorBill'],
      transformErrorResponse: (response, meta, arg) => {
        console.error('Vendor Bills API Error:', response);
        return response;
      },
    }),
    getVendorBill: builder.query({
      query: ({ organizationId, billId }) => ({
        url: `zoho/org/${organizationId}/vendor-bills/${billId}/details/`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      providesTags: (result, error, { billId }) => [{ type: 'VendorBill', id: billId }],
    }),
    createVendorBill: builder.mutation({
      query: ({ organizationId, ...newBill }) => ({
        url: `zoho/org/${organizationId}/vendor-bills/`,
        method: "POST",
        body: newBill,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: ['VendorBill'],
    }),
    uploadVendorBills: builder.mutation({
      query: ({ organizationId, formData }) => ({
        url: `zoho/org/${organizationId}/vendor-bills/upload/`,
        method: "POST",
        body: formData,
        // Don't set any Content-Type header for FormData uploads
      }),
      invalidatesTags: ['VendorBill'],
    }),
    updateVendorBill: builder.mutation({
      query: ({ organizationId, id, ...patch }) => ({
        url: `zoho/org/${organizationId}/vendor-bills/${id}/`,
        method: "PATCH",
        body: patch,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'VendorBill', id }],
    }),
    deleteVendorBill: builder.mutation({
      query: ({ organizationId, id }) => ({
        url: `zoho/org/${organizationId}/vendor-bills/${id}/delete/`,
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: ['VendorBill'],
    }),
    analyzeVendorBill: builder.mutation({
      query: ({ organizationId, billId }) => ({
        url: `zoho/org/${organizationId}/vendor-bills/${billId}/analyze/`,
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: (result, error, { billId }) => [{ type: 'VendorBill', id: billId }],
    }),
  }),
});

export const {
  useGetVendorBillsQuery,
  useGetVendorBillQuery,
  useCreateVendorBillMutation,
  useUploadVendorBillsMutation,
  useUpdateVendorBillMutation,
  useDeleteVendorBillMutation,
  useAnalyzeVendorBillMutation,
} = vendorBillsApi;
