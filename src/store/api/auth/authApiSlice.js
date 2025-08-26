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
    refreshToken: builder.mutation({
      query: (refreshToken) => ({
        url: "auth/token/refresh/",
        method: "POST",
        body: { refresh: refreshToken },
      }),
    }),
  }),
});
export const { useRegisterUserMutation, useLoginMutation, useGetProfileQuery, useLazyGetProfileQuery, useRefreshTokenMutation } = authApi;
