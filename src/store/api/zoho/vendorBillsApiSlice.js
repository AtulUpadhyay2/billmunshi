import { apiSlice } from "@/store/api/apiSlice";

export const vendorBillsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getVendorBills: builder.query({
      query: (organizationId) => ({
        url: `zoho/org/${organizationId}/vendor-bills/`,
        method: 'GET',
      }),
      providesTags: ['VendorBill'],
      transformErrorResponse: (response, meta, arg) => {
        console.error('Vendor Bills API Error:', response);
        return response;
      },
    }),
    getVendorBill: builder.query({
      query: ({ organizationId, billId }) => ({
        url: `zoho/${organizationId}/vendor-bills/${billId}/`,
        method: 'GET',
      }),
      providesTags: (result, error, { billId }) => [{ type: 'VendorBill', id: billId }],
    }),
    createVendorBill: builder.mutation({
      query: ({ organizationId, ...newBill }) => ({
        url: `zoho/${organizationId}/vendor-bills/`,
        method: "POST",
        body: newBill,
      }),
      invalidatesTags: ['VendorBill'],
    }),
    uploadVendorBills: builder.mutation({
      query: ({ organizationId, formData }) => ({
        url: `zoho/${organizationId}/vendor-bills/`,
        method: "POST",
        body: formData,
        // Don't set Content-Type header, let the browser set it for FormData
        prepareHeaders: (headers) => {
          headers.delete('Content-Type');
          return headers;
        },
      }),
      invalidatesTags: ['VendorBill'],
    }),
    updateVendorBill: builder.mutation({
      query: ({ organizationId, id, ...patch }) => ({
        url: `zoho/${organizationId}/vendor-bills/${id}/`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'VendorBill', id }],
    }),
    deleteVendorBill: builder.mutation({
      query: ({ organizationId, billId }) => ({
        url: `zoho/${organizationId}/vendor-bills/${billId}/`,
        method: "DELETE",
      }),
      invalidatesTags: ['VendorBill'],
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
} = vendorBillsApi;
