import { z } from "zod";
import { gratitudeSourceSchema, isoDateString } from "./values";

export const gratitudeSchema = z.object({
  id: z.string().min(1),
  fromUserId: z.string().min(1),
  toUserId: z.string().min(1),
  text: z.string().min(1),
  cardId: z.string().nullable(),
  source: gratitudeSourceSchema,
  acknowledgedAt: isoDateString.nullable(),
  createdAt: isoDateString,
});

export const gratitudeListResponseSchema = z.object({
  gratitudes: z.array(gratitudeSchema),
});

export const gratitudeSingleResponseSchema = z.object({
  gratitude: gratitudeSchema,
});

export const gratitudeCreateRequestSchema = z.object({
  fromUserId: z.string().min(1),
  toUserId: z.string().min(1),
  text: z.string().min(1).max(400),
  cardId: z.string().nullable().optional(),
  source: gratitudeSourceSchema.default("button"),
});

export const gratitudeAckRequestSchema = z.object({
  acked: z.boolean().default(true),
});

export type Gratitude = z.infer<typeof gratitudeSchema>;
export type GratitudeCreateRequest = z.infer<typeof gratitudeCreateRequestSchema>;
