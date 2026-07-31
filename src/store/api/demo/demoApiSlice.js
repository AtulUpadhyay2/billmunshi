import { apiSlice } from "../apiSlice";

export const demoApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    bookDemo: builder.mutation({
      query: (data) => ({
        url: "book-demo/",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

export const { useBookDemoMutation } = demoApi;
