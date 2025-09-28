import { apiSlice } from "../apiSlice";

export const membersApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMembers: builder.query({
      query: (organizationId) => ({
        url: `org/${organizationId}/members/`,
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      providesTags: ['OrganizationMembers'],
      transformErrorResponse: (response, meta, arg) => {
        console.error('Members API Error:', response);
        return response;
      },
    }),
    inviteMember: builder.mutation({
      query: ({ organizationId, ...memberData }) => ({
        url: `org/${organizationId}/members/add/`,
        method: "POST",
        body: memberData,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: ['OrganizationMembers'],
      transformErrorResponse: (response, meta, arg) => {
        console.error('Invite Member API Error:', response);
        return response;
      },
    }),
  }),
});

export const {
  useGetMembersQuery,
  useInviteMemberMutation,
} = membersApiSlice;