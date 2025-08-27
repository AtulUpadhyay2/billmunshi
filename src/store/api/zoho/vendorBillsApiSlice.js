import { apiSlice } from "@/store/api/apiSlice";

export const vendorBillsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getVendorBills: builder.query({
      query: () => "zoho/1/vendor-bills/",
      providesTags: ['VendorBill'],
    }),
    getVendorBill: builder.query({
      query: (id) => `zoho/1/vendor-bills/${id}/`,
      providesTags: (result, error, id) => [{ type: 'VendorBill', id }],
    }),
    createVendorBill: builder.mutation({
      query: (newBill) => ({
        url: "zoho/1/vendor-bills/",
        method: "POST",
        body: newBill,
      }),
      invalidatesTags: ['VendorBill'],
    }),
    updateVendorBill: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `zoho/1/vendor-bills/${id}/`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'VendorBill', id }],
    }),
    deleteVendorBill: builder.mutation({
      query: (id) => ({
        url: `zoho/1/vendor-bills/${id}/`,
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
  useUpdateVendorBillMutation,
  useDeleteVendorBillMutation,
} = vendorBillsApi;
