import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_CONFIG } from "../../config/api";
import {
  refreshAccessToken,
  isTokenExpiredError,
} from "../../utils/tokenRefresh";

const baseQuery = fetchBaseQuery({
  baseUrl: API_CONFIG.BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    // Don't set Content-Type here at all - let individual endpoints handle it
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error) {
    const { status, data } = result.error;

    if (status === 401 && isTokenExpiredError(data)) {
      try {
        // Use the shared refresh — deduplicates across axios + RTK Query
        await refreshAccessToken();

        // Retry the original request with the new token
        result = await baseQuery(args, api, extraOptions);
      } catch (refreshError) {
        // refreshAccessToken already handles forceLogout + toast on failure
      }
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["ApiKeys"],
  endpoints: (builder) => ({}),
});
