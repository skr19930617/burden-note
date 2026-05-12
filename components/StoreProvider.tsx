"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { store, hydrateMeFromStorage } from "@/lib/store";

function Hydrator() {
  useEffect(() => {
    store.dispatch(hydrateMeFromStorage());
  }, []);
  return null;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <Hydrator />
      {children}
    </Provider>
  );
}
