import { apiSlice } from "../apiSlice";

export const apiKeysApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getApiKeys: builder.query({
      query: (organizationId) => ({
        url: `org/${organizationId}/api-keys/`,
        method: "GET",
      }),
      providesTags: ["ApiKeys"],
    }),
    createApiKey: builder.mutation({
      query: ({ organizationId, ...data }) => ({
        url: `org/${organizationId}/api-keys/`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["ApiKeys"],
    }),
    deleteApiKey: builder.mutation({
      query: ({ organizationId, keyId }) => ({
        url: `org/${organizationId}/api-keys/${keyId}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["ApiKeys"],
    }),
    updateApiKey: builder.mutation({
      query: ({ organizationId, keyId, ...data }) => ({
        url: `org/${organizationId}/api-keys/${keyId}/`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ["ApiKeys"],
    }),
  }),
});

export const {
  useGetApiKeysQuery,
  useCreateApiKeyMutation,
  useDeleteApiKeyMutation,
  useUpdateApiKeyMutation,
} = apiKeysApiSlice;