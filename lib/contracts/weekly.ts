import { z } from "zod";
import { userSummarySchema } from "./users";
import {
  feltAcknowledgedSchema,
  isoDateString,
  nextActionSchema,
  reduceTargetSchema,
} from "./values";

// WeeklyPick stored in the DB. `pickedBurden` may be a known REDUCE_TARGETS value
// or a free-form custom string the user typed, so we accept either.
export const weeklyPickSchema = z.object({
  id: z.string().min(1),
  weekStart: isoDateString,
  pickedBurden: z.string(),
  nextAction: nextActionSchema.nullable(),
  note: z.string().nullable(),
  whatWorked: z.string().nullable(),
  nextMove: z.string().nullable(),
  createdAt: isoDateString,
});

export const weeklyPickListResponseSchema = z.object({
  picks: z.array(weeklyPickSchema),
});

export const weeklyPickSingleResponseSchema = z.object({
  pick: weeklyPickSchema,
});

export const weeklyPickRequestSchema = z.object({
  weekStart: isoDateString,
  pickedBurden: z.union([reduceTargetSchema, z.string().min(1)]),
  nextAction: nextActionSchema.nullable().optional(),
  note: z.string().max(1000).nullable().optional(),
});

// Per-user weekly LLM observation.
export const weeklyFeedbackSchema = z.object({
  id: z.string().min(1),
  weekStart: isoDateString,
  userId: z.string().min(1),
  observation: z.string(),
  gentleNotice: z.string(),
  feltAcknowledged: feltAcknowledgedSchema.nullable(),
  generatedAt: isoDateString,
  user: userSummarySchema.optional(),
});

export const weeklyFeedbackBundleSchema = z.object({
  weekStart: isoDateString,
  perUser: z.array(weeklyFeedbackSchema),
  pick: weeklyPickSchema.nullable(),
});

export const weeklyFeedbackTriggerResponseSchema = z.object({
  adapter: z.string().min(1),
  weekStart: isoDateString,
  perUser: z.array(weeklyFeedbackSchema),
  pick: weeklyPickSchema.nullable(),
});

export const weeklyFeedbackTriggerRequestSchema = z.object({
  weekStart: isoDateString,
});

export const weeklyFeedbackPatchRequestSchema = z.object({
  feltAcknowledged: feltAcknowledgedSchema.nullable().optional(),
});

export const weeklyFeedbackPatchResponseSchema = z.object({
  feedback: weeklyFeedbackSchema,
});

export type WeeklyPick = z.infer<typeof weeklyPickSchema>;
export type WeeklyFeedback = z.infer<typeof weeklyFeedbackSchema>;
export type WeeklyFeedbackBundle = z.infer<typeof weeklyFeedbackBundleSchema>;
