import { z } from "zod";

export const cardCreateSchema = z.object({
  authorId: z.string().min(1),
  title: z.string().min(1).max(200),
  category: z.string().min(1),
  details: z.string().max(4000).optional().nullable(),
  bearer: z.string().min(1),
  weight: z.string().min(1),
  depleted: z.array(z.string()).default([]),
  visibility: z.string().min(1),
  need: z.string().min(1),
  sharing: z.enum(["private", "candidate", "shared"]).default("private"),
  occurredAt: z.string().datetime().optional(),
});

export type CardCreateInput = z.infer<typeof cardCreateSchema>;

export const cardPatchSchema = cardCreateSchema.partial().extend({
  rephrasedText: z.string().optional().nullable(),
});

export const userCreateSchema = z.object({
  name: z.string().min(1).max(40),
  color: z.string().optional().nullable(),
});

export const gratitudeSchema = z.object({
  fromUserId: z.string().min(1),
  toUserId: z.string().min(1),
  text: z.string().min(1).max(400),
  cardId: z.string().optional().nullable(),
});

export const weeklyPickSchema = z.object({
  weekStart: z.string().datetime(),
  pickedBurden: z.string().min(1),
  nextAction: z.string().optional().nullable(),
  note: z.string().max(1000).optional().nullable(),
});
