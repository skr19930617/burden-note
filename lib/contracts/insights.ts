import { z } from "zod";
import {
  isoDateString,
  reduceTargetSchema,
} from "./values";

export const reducePointSchema = z.object({
  weekStart: isoDateString,
  pickedBurden: z.union([reduceTargetSchema, z.string()]).nullable(),
  pickedBurdenLabel: z.string().nullable(),
  intensity: z.number().int().nonnegative(),
});

export const visibilityPointSchema = z.object({
  weekStart: isoDateString,
  total: z.number().int().nonnegative(),
  invisible: z.number().int().nonnegative(),
  ratio: z.number().min(0).max(1).nullable(),
});

export const gratitudeWeeklyEntrySchema = z.object({
  sent: z.number().int().nonnegative(),
  ackReceived: z.number().int().nonnegative(),
});

export const gratitudePointSchema = z.object({
  weekStart: isoDateString,
  perUser: z.record(z.string(), gratitudeWeeklyEntrySchema),
});

export const referenceOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export const insightsResponseSchema = z.object({
  weeks: z.array(isoDateString),
  users: z.array(z.object({ id: z.string(), name: z.string() })),
  reduceSeries: z.array(reducePointSchema),
  visibilitySeries: z.array(visibilityPointSchema),
  gratitudeSeries: z.array(gratitudePointSchema),
  referenceLabels: z.object({
    categories: z.array(referenceOptionSchema),
    loadTypes: z.array(referenceOptionSchema),
  }),
});

export type ReducePoint = z.infer<typeof reducePointSchema>;
export type VisibilityPoint = z.infer<typeof visibilityPointSchema>;
export type GratitudePoint = z.infer<typeof gratitudePointSchema>;
export type InsightsResponse = z.infer<typeof insightsResponseSchema>;
