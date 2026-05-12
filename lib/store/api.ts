import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { z } from "zod";
import {
  cardListResponseSchema,
  cardSingleResponseSchema,
  gratitudeListResponseSchema,
  gratitudeSingleResponseSchema,
  insightsResponseSchema,
  rephraseResponseSchema,
  userListResponseSchema,
  userSingleResponseSchema,
  weeklyFeedbackBundleSchema,
  weeklyFeedbackPatchResponseSchema,
  weeklyFeedbackTriggerResponseSchema,
  weeklyPickListResponseSchema,
  weeklyPickSingleResponseSchema,
  type Card,
  type CardCreateRequest,
  type CardPatchRequest,
  type Gratitude,
  type GratitudeCreateRequest,
  type InsightsResponse,
  type RephraseResponse,
  type Sharing,
  type User,
  type UserCreateRequest,
  type UserPatchRequest,
  type WeeklyFeedback,
  type WeeklyFeedbackBundle,
  type WeeklyPick,
} from "@/lib/contracts";

// Generic helper: parse server JSON through a Zod schema so we never trust
// the wire shape. The mutations and queries below all funnel through this.
function parsed<T>(schema: z.ZodType<T>) {
  return (raw: unknown): T => schema.parse(raw);
}

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: [
    "Users",
    "Cards",
    "Card",
    "Gratitudes",
    "WeeklyPicks",
    "WeeklyFeedback",
    "Insights",
  ],
  endpoints: (build) => ({
    // ---------------- users ----------------
    getUsers: build.query<User[], void>({
      query: () => "/users",
      transformResponse: (raw: unknown) =>
        parsed(userListResponseSchema)(raw).users,
      providesTags: ["Users"],
    }),
    createUser: build.mutation<User, UserCreateRequest>({
      query: (body) => ({ url: "/users", method: "POST", body }),
      transformResponse: (raw: unknown) =>
        parsed(userSingleResponseSchema)(raw).user,
      invalidatesTags: ["Users"],
    }),
    updateUser: build.mutation<User, { id: string; patch: UserPatchRequest }>({
      query: ({ id, patch }) => ({
        url: `/users/${id}`,
        method: "PATCH",
        body: patch,
      }),
      transformResponse: (raw: unknown) =>
        parsed(userSingleResponseSchema)(raw).user,
      invalidatesTags: ["Users"],
    }),

    // ---------------- cards ----------------
    getCards: build.query<
      Card[],
      { authorId?: string; sharing?: Sharing; since?: string } | void
    >({
      query: (params) => {
        const qs = new URLSearchParams();
        if (params?.authorId) qs.set("authorId", params.authorId);
        if (params?.sharing) qs.set("sharing", params.sharing);
        if (params?.since) qs.set("since", params.since);
        const s = qs.toString();
        return s ? `/cards?${s}` : "/cards";
      },
      transformResponse: (raw: unknown) =>
        parsed(cardListResponseSchema)(raw).cards,
      providesTags: (result) =>
        result
          ? [
              ...result.map((c) => ({ type: "Card" as const, id: c.id })),
              { type: "Cards" as const, id: "LIST" },
            ]
          : [{ type: "Cards" as const, id: "LIST" }],
    }),
    getCard: build.query<Card, string>({
      query: (id) => `/cards/${id}`,
      transformResponse: (raw: unknown) =>
        parsed(cardSingleResponseSchema)(raw).card,
      providesTags: (_r, _e, id) => [{ type: "Card", id }],
    }),
    createCard: build.mutation<Card, CardCreateRequest>({
      query: (body) => ({ url: "/cards", method: "POST", body }),
      transformResponse: (raw: unknown) =>
        parsed(cardSingleResponseSchema)(raw).card,
      invalidatesTags: [{ type: "Cards", id: "LIST" }, "Insights"],
    }),
    updateCard: build.mutation<Card, { id: string; patch: CardPatchRequest }>({
      query: ({ id, patch }) => ({
        url: `/cards/${id}`,
        method: "PATCH",
        body: patch,
      }),
      transformResponse: (raw: unknown) =>
        parsed(cardSingleResponseSchema)(raw).card,
      invalidatesTags: (_r, _e, arg) => [
        { type: "Card", id: arg.id },
        { type: "Cards", id: "LIST" },
        "Insights",
      ],
    }),
    deleteCard: build.mutation<void, string>({
      query: (id) => ({ url: `/cards/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, id) => [
        { type: "Card", id },
        { type: "Cards", id: "LIST" },
        "Insights",
      ],
    }),
    rephraseCard: build.mutation<RephraseResponse, string>({
      query: (id) => ({ url: `/cards/${id}/rephrase`, method: "POST" }),
      transformResponse: (raw: unknown) => parsed(rephraseResponseSchema)(raw),
      invalidatesTags: (_r, _e, id) => [{ type: "Card", id }],
    }),
    sendAppreciation: build.mutation<
      Gratitude,
      { cardId: string; text: string }
    >({
      query: ({ cardId, text }) => ({
        url: `/cards/${cardId}/send-appreciation`,
        method: "POST",
        body: { text },
      }),
      transformResponse: (raw: unknown) =>
        parsed(gratitudeSingleResponseSchema)(raw).gratitude,
      invalidatesTags: ["Gratitudes"],
    }),

    // ---------------- gratitudes ----------------
    getGratitudes: build.query<Gratitude[], { since?: string } | void>({
      query: (params) => {
        const qs = new URLSearchParams();
        if (params?.since) qs.set("since", params.since);
        const s = qs.toString();
        return s ? `/gratitudes?${s}` : "/gratitudes";
      },
      transformResponse: (raw: unknown) =>
        parsed(gratitudeListResponseSchema)(raw).gratitudes,
      providesTags: ["Gratitudes"],
    }),
    createGratitude: build.mutation<Gratitude, GratitudeCreateRequest>({
      query: (body) => ({ url: "/gratitudes", method: "POST", body }),
      transformResponse: (raw: unknown) =>
        parsed(gratitudeSingleResponseSchema)(raw).gratitude,
      invalidatesTags: ["Gratitudes"],
    }),
    acknowledgeGratitude: build.mutation<
      Gratitude,
      { id: string; acked: boolean }
    >({
      query: ({ id, acked }) => ({
        url: `/gratitudes/${id}/acknowledge`,
        method: "POST",
        body: { acked },
      }),
      transformResponse: (raw: unknown) =>
        parsed(gratitudeSingleResponseSchema)(raw).gratitude,
      invalidatesTags: ["Gratitudes", "Insights"],
    }),

    // ---------------- weekly pick ----------------
    getWeeklyPicks: build.query<WeeklyPick[], void>({
      query: () => "/weekly",
      transformResponse: (raw: unknown) =>
        parsed(weeklyPickListResponseSchema)(raw).picks,
      providesTags: ["WeeklyPicks"],
    }),
    upsertWeeklyPick: build.mutation<
      WeeklyPick,
      {
        weekStart: string;
        pickedBurden: string;
        nextAction?: string | null;
        note?: string | null;
      }
    >({
      query: (body) => ({ url: "/weekly", method: "POST", body }),
      transformResponse: (raw: unknown) =>
        parsed(weeklyPickSingleResponseSchema)(raw).pick,
      invalidatesTags: ["WeeklyPicks", "Insights"],
    }),

    // ---------------- weekly feedback ----------------
    getWeeklyFeedback: build.query<WeeklyFeedbackBundle, string>({
      query: (weekStart) =>
        `/weekly/feedback?week=${encodeURIComponent(weekStart)}`,
      transformResponse: (raw: unknown) =>
        parsed(weeklyFeedbackBundleSchema)(raw),
      providesTags: (_r, _e, weekStart) => [
        { type: "WeeklyFeedback", id: weekStart },
      ],
    }),
    generateWeeklyFeedback: build.mutation<
      { weekStart: string; perUser: WeeklyFeedback[]; pick: WeeklyPick | null; adapter: string },
      { weekStart: string }
    >({
      query: (body) => ({
        url: "/weekly/feedback",
        method: "POST",
        body,
      }),
      transformResponse: (raw: unknown) =>
        parsed(weeklyFeedbackTriggerResponseSchema)(raw),
      invalidatesTags: (_r, _e, arg) => [
        { type: "WeeklyFeedback", id: arg.weekStart },
      ],
    }),
    setFeltAcknowledged: build.mutation<
      WeeklyFeedback,
      {
        userId: string;
        weekStart: string;
        feltAcknowledged: "yes" | "a_little" | "none" | null;
      }
    >({
      query: ({ userId, weekStart, feltAcknowledged }) => ({
        url: `/weekly/feedback/${userId}?week=${encodeURIComponent(weekStart)}`,
        method: "PATCH",
        body: { feltAcknowledged },
      }),
      transformResponse: (raw: unknown) =>
        parsed(weeklyFeedbackPatchResponseSchema)(raw).feedback,
      invalidatesTags: (_r, _e, arg) => [
        { type: "WeeklyFeedback", id: arg.weekStart },
      ],
    }),

    // ---------------- insights ----------------
    getInsights: build.query<InsightsResponse, { weeks?: number } | void>({
      query: (params) => {
        const weeks = params?.weeks ?? 8;
        return `/insights/weekly?weeks=${weeks}`;
      },
      transformResponse: (raw: unknown) =>
        parsed(insightsResponseSchema)(raw),
      providesTags: ["Insights"],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useGetCardsQuery,
  useGetCardQuery,
  useCreateCardMutation,
  useUpdateCardMutation,
  useDeleteCardMutation,
  useRephraseCardMutation,
  useSendAppreciationMutation,
  useGetGratitudesQuery,
  useCreateGratitudeMutation,
  useAcknowledgeGratitudeMutation,
  useGetWeeklyPicksQuery,
  useUpsertWeeklyPickMutation,
  useGetWeeklyFeedbackQuery,
  useGenerateWeeklyFeedbackMutation,
  useSetFeltAcknowledgedMutation,
  useGetInsightsQuery,
} = api;
