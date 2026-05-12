import { z } from "zod";
import { isoDateString } from "./values";

export const userSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  color: z.string().nullable(),
});

export const userSchema = userSummarySchema.extend({
  createdAt: isoDateString,
});

export const userListResponseSchema = z.object({
  users: z.array(userSchema),
});

export const userCreateRequestSchema = z.object({
  name: z.string().min(1).max(40),
  color: z.string().nullable().optional(),
});

export const userPatchRequestSchema = userCreateRequestSchema.partial();

export const userSingleResponseSchema = z.object({
  user: userSchema,
});

export type UserSummary = z.infer<typeof userSummarySchema>;
export type User = z.infer<typeof userSchema>;
export type UserCreateRequest = z.infer<typeof userCreateRequestSchema>;
export type UserPatchRequest = z.infer<typeof userPatchRequestSchema>;
