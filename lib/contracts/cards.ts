import { z } from "zod";
import { userSummarySchema } from "./users";
import {
  bearerSchema,
  categorySchema,
  depletedSchema,
  isoDateString,
  loadTypeSchema,
  needSchema,
  sharingSchema,
  visibilitySchema,
  weightSchema,
} from "./values";

// Canonical card shape that flies over the wire (arrays expanded, author included,
// dates serialized to ISO strings).
export const cardSchema = z.object({
  id: z.string().min(1),
  authorId: z.string().min(1),
  author: userSummarySchema,
  title: z.string().min(1),
  category: categorySchema,
  privateText: z.string().nullable(),
  loadTypes: z.array(loadTypeSchema),
  bearer: bearerSchema,
  weight: weightSchema,
  depleted: z.array(depletedSchema),
  visibility: visibilitySchema,
  needs: z.array(needSchema),
  sharing: sharingSchema,
  shareText: z.string().nullable(),
  rephrasedAt: isoDateString.nullable(),
  appreciation: z.string().nullable(),
  selfCare: z.string().nullable(),
  adviceTip: z.string().nullable(),
  occurredAt: isoDateString,
  createdAt: isoDateString,
  updatedAt: isoDateString,
});

export const cardListResponseSchema = z.object({
  cards: z.array(cardSchema),
});

export const cardSingleResponseSchema = z.object({
  card: cardSchema,
});

export const cardCreateRequestSchema = z.object({
  authorId: z.string().min(1),
  title: z.string().min(1).max(200),
  category: categorySchema,
  privateText: z.string().max(4000).nullable().optional(),
  loadTypes: z.array(loadTypeSchema).default([]),
  bearer: bearerSchema,
  weight: weightSchema,
  depleted: z.array(depletedSchema).default([]),
  visibility: visibilitySchema,
  needs: z.array(needSchema).default([]),
  sharing: sharingSchema.default("private"),
  occurredAt: isoDateString.optional(),
});

export const cardPatchRequestSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  category: categorySchema.optional(),
  privateText: z.string().max(4000).nullable().optional(),
  loadTypes: z.array(loadTypeSchema).optional(),
  bearer: bearerSchema.optional(),
  weight: weightSchema.optional(),
  depleted: z.array(depletedSchema).optional(),
  visibility: visibilitySchema.optional(),
  needs: z.array(needSchema).optional(),
  sharing: sharingSchema.optional(),
  shareText: z.string().nullable().optional(),
  occurredAt: isoDateString.optional(),
});

// /api/cards/[id]/rephrase response
export const rephraseResponseSchema = z.object({
  adapter: z.string().min(1),
  sharedText: z.string(),
  oneLineInsight: z.string(),
  appreciation: z.string(),
  selfCare: z.string(),
  adviceTip: z.string(),
});

// /api/cards/[id]/send-appreciation request
export const sendAppreciationRequestSchema = z.object({
  text: z.string().min(1).max(400),
});

export type Card = z.infer<typeof cardSchema>;
export type CardCreateRequest = z.infer<typeof cardCreateRequestSchema>;
export type CardPatchRequest = z.infer<typeof cardPatchRequestSchema>;
export type RephraseResponse = z.infer<typeof rephraseResponseSchema>;
