import { apiSlice } from "../apiSlice";

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    registerUser: builder.mutation({
      // The signup form collects a single "Full name" and "phone", but the
      // API takes first_name/last_name/phone_number and a confirm_password,
      // so the payload is reshaped here rather than in the form.
      query: ({ name, email, password, phone, recaptcha_token }) => {
        // Split on the first space: "Snashank Sharma" -> "Snashank" + "Sharma",
        // and a double-barrelled surname stays intact. last_name accepts a
        // blank value, which is what a mononym lands on.
        const fullName = (name || "").trim();
        const split = fullName.indexOf(" ");

        return {
          url: "auth/register/",
          method: "POST",
          body: {
            email,
            password,
            // No confirm field on the form; the serializer only checks the
            // two match, so mirroring the password satisfies it.
            confirm_password: password,
            first_name: split === -1 ? fullName : fullName.slice(0, split),
            last_name: split === -1 ? "" : fullName.slice(split + 1).trim(),
            phone_number: phone,
            recaptcha_token,
          },
        };
      },
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
