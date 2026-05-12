"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  userListResponseSchema,
  userSingleResponseSchema,
  type User,
} from "@/lib/contracts";

// The bits of a user the UI cares about. Keep the shape minimal and explicit.
export type UserSummary = Pick<User, "id" | "name" | "color">;

type State = {
  users: UserSummary[];
  meId: string | null;
  loading: boolean;
};

type Actions = {
  refresh: () => Promise<void>;
  setMe: (id: string) => void;
  renameMe: (name: string) => Promise<void>;
  createUser: (name: string) => Promise<UserSummary>;
};

const Ctx = createContext<(State & Actions) | null>(null);

const LS_KEY = "burden-note:me";

export function UserContextProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [meId, setMeIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/users", { cache: "no-store" });
    const raw: unknown = await res.json();
    const data = userListResponseSchema.parse(raw);
    setUsers(data.users.map((u) => ({ id: u.id, name: u.name, color: u.color })));
    // Resolve "me" from localStorage; fall back to the first user.
    const stored = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
    const meFromStore = stored && data.users.find((u) => u.id === stored)?.id;
    setMeIdState(meFromStore ?? data.users[0]?.id ?? null);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const setMe = useCallback((id: string) => {
    setMeIdState(id);
    if (typeof window !== "undefined") localStorage.setItem(LS_KEY, id);
  }, []);

  const renameMe = useCallback(
    async (name: string) => {
      if (!meId) return;
      await fetch(`/api/users/${meId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      await refresh();
    },
    [meId, refresh],
  );

  const createUser = useCallback(
    async (name: string): Promise<UserSummary> => {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const raw: unknown = await res.json();
      const data = userSingleResponseSchema.parse(raw);
      await refresh();
      return { id: data.user.id, name: data.user.name, color: data.user.color };
    },
    [refresh],
  );

  const value = useMemo<State & Actions>(
    () => ({ users, meId, loading, refresh, setMe, renameMe, createUser }),
    [users, meId, loading, refresh, setMe, renameMe, createUser],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUserContext() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useUserContext must be used within UserContextProvider");
  return ctx;
}

export function useMe(): UserSummary | null {
  const { users, meId } = useUserContext();
  return users.find((u) => u.id === meId) ?? null;
}

export function usePartner(): UserSummary | null {
  const { users, meId } = useUserContext();
  return users.find((u) => u.id !== meId) ?? null;
}
