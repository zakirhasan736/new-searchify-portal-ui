import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { authHeaders } from "@/utils/users/Helpers";

const HOUR = 60 * 60;

export const researchApi = createApi({
  reducerPath: "researchApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/v1/research",
    prepareHeaders: (headers) => {
      Object.entries(authHeaders()).forEach(([key, value]) => headers.set(key, value));
      return headers;
    },
  }),
  tagTypes: ["Usage"],
  keepUnusedDataFor: 6 * HOUR,
  refetchOnMountOrArgChange: false,
  refetchOnFocus: false,
  refetchOnReconnect: false,
  endpoints: (build) => ({
    usage: build.query({
      query: () => "/usage",
      providesTags: ["Usage"],
      keepUnusedDataFor: 300,
    }),
    keywords: build.query({
      query: (args) => ({ url: "/keywords", method: "POST", body: { ...args, force: false } }),
    }),
    refreshKeywords: build.mutation({
      query: (args) => ({ url: "/keywords", method: "POST", body: { ...args, force: true } }),
      invalidatesTags: ["Usage"],
    }),
    backlinks: build.query({
      query: (args) => ({ url: "/backlinks", method: "POST", body: { ...args, force: false } }),
    }),
    refreshBacklinks: build.mutation({
      query: (args) => ({ url: "/backlinks", method: "POST", body: { ...args, force: true } }),
      invalidatesTags: ["Usage"],
    }),
    audit: build.query({
      query: (args) => ({ url: "/audit", method: "POST", body: { ...args, force: false } }),
    }),
    refreshAudit: build.mutation({
      query: (args) => ({ url: "/audit", method: "POST", body: { ...args, force: true } }),
      invalidatesTags: ["Usage"],
    }),
  }),
});

export const {
  useUsageQuery,
  useKeywordsQuery,
  useRefreshKeywordsMutation,
  useBacklinksQuery,
  useRefreshBacklinksMutation,
  useAuditQuery,
  useRefreshAuditMutation,
} = researchApi;

export function rtkErrorText(error, fallback = "Something went wrong.") {
  const detail = error?.data?.detail;
  if (typeof detail === "string" && detail) return detail;
  if (detail && typeof detail.message === "string") return detail.message;
  if (error?.status === "FETCH_ERROR") return "Could not reach Searchify. Check the connection and try again.";
  return fallback;
}

export function rtkErrorCode(error) {
  const detail = error?.data?.detail;
  return detail && typeof detail === "object" && !Array.isArray(detail) ? detail.code || "" : "";
}
