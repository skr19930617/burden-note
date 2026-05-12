"use client";

import { useMemo } from "react";
import { useAppSelector } from "./index";
import { useGetUsersQuery } from "./api";
import type { UserSummary } from "@/lib/contracts";

// Re-export for legacy callers. The wire shape includes more fields than this
// summary, but UI code only needs id/name/color.
function toSummary(u: { id: string; name: string; color: string | null }): UserSummary {
  return { id: u.id, name: u.name, color: u.color };
}

export function useUsers(): UserSummary[] {
  const { data } = useGetUsersQuery();
  return useMemo(() => (data ?? []).map(toSummary), [data]);
}

export function useUsersLoading(): boolean {
  const { isLoading } = useGetUsersQuery();
  return isLoading;
}

export function useMeId(): string | null {
  const stored = useAppSelector((s) => s.me.meId);
  const users = useUsers();
  // If nothing in store yet, fall back to the first known user so the UI
  // does not flicker between "no me" and "first user".
  return stored ?? users[0]?.id ?? null;
}

export function useMe(): UserSummary | null {
  const users = useUsers();
  const id = useMeId();
  return useMemo(() => users.find((u) => u.id === id) ?? null, [users, id]);
}

export function usePartner(): UserSummary | null {
  const users = useUsers();
  const id = useMeId();
  return useMemo(() => users.find((u) => u.id !== id) ?? null, [users, id]);
}
