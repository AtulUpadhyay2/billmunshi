import { apiSlice } from "../apiSlice";

export const helpApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getHelpData: builder.query({
      query: (organizationId) => ({
        url: `tally/org/${organizationId}/help/`,
        method: "GET",
      }),
      providesTags: ["Help"],
    }),
  }),
});

export const {
  useGetHelpDataQuery,
} = helpApiSlice;