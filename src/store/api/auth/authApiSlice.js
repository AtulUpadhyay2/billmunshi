import { apiSlice } from "../apiSlice";

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    registerUser: builder.mutation({
      query: (user) => ({
        url: "register",
        method: "POST",
        body: user,
      }),
    }),
    login: builder.mutation({
      query: (data) => ({
        url: "auth/login/",
        method: "POST",
        body: data,
      }),
    }),
    getProfile: builder.query({
      query: () => ({
        url: "me/",
        method: "GET",
      }),
    }),
    changePassword: builder.mutation({
      query: (data) => ({
        url: "auth/password/change/",
        method: "POST",
        body: data,
      }),
    }),
    getOrganizations: builder.query({
      query: () => ({
        url: "org/",
        method: "GET",
      }),
    }),
  }),
});
export const {
  useRegisterUserMutation,
  useLoginMutation,
  useGetProfileQuery,
  useLazyGetProfileQuery,
  useChangePasswordMutation,
  useGetOrganizationsQuery,
  useLazyGetOrganizationsQuery,
} = authApi;
