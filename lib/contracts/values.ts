// Derive Zod enums from the human-facing vocabulary in lib/constants.ts so the
// constant arrays remain the single source of truth. Adding a new option in
// constants.ts immediately tightens both client and server validation.

import { z } from "zod";
import {
  BEARERS,
  CATEGORIES,
  DEPLETED,
  LOAD_TYPES,
  NEEDS,
  NEXT_ACTIONS,
  REDUCE_TARGETS,
  VISIBILITY,
  WEIGHTS,
} from "@/lib/constants";

type WithValue = { readonly value: string };

function valueEnum<T extends readonly WithValue[]>(arr: T) {
  const values = arr.map((x) => x.value) as [T[number]["value"], ...T[number]["value"][]];
  return z.enum(values);
}

export const categorySchema = valueEnum(CATEGORIES);
export const loadTypeSchema = valueEnum(LOAD_TYPES);
export const bearerSchema = valueEnum(BEARERS);
export const weightSchema = valueEnum(WEIGHTS);
export const depletedSchema = valueEnum(DEPLETED);
export const visibilitySchema = valueEnum(VISIBILITY);
export const needSchema = valueEnum(NEEDS);
export const reduceTargetSchema = valueEnum(REDUCE_TARGETS);
export const nextActionSchema = valueEnum(NEXT_ACTIONS);

export const sharingSchema = z.enum(["private", "candidate", "shared"]);
export const feltAcknowledgedSchema = z.enum(["none", "a_little", "yes"]);
export const gratitudeSourceSchema = z.enum(["button", "ai_draft", "manual"]);

// ISO-8601 date string. Use this everywhere we serialize a Date through JSON.
export const isoDateString = z.string().datetime();

export type Sharing = z.infer<typeof sharingSchema>;
export type Category = z.infer<typeof categorySchema>;
export type LoadType = z.infer<typeof loadTypeSchema>;
export type Bearer = z.infer<typeof bearerSchema>;
export type Weight = z.infer<typeof weightSchema>;
export type Depleted = z.infer<typeof depletedSchema>;
export type Visibility = z.infer<typeof visibilitySchema>;
export type NeedKey = z.infer<typeof needSchema>;
export type ReduceTarget = z.infer<typeof reduceTargetSchema>;
export type NextAction = z.infer<typeof nextActionSchema>;
export type FeltAcknowledged = z.infer<typeof feltAcknowledgedSchema>;
export type GratitudeSource = z.infer<typeof gratitudeSourceSchema>;
