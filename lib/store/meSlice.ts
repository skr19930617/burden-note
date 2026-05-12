import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

const LS_KEY = "burden-note:me";

type MeState = {
  meId: string | null;
};

const initialState: MeState = { meId: null };

export const meSlice = createSlice({
  name: "me",
  initialState,
  reducers: {
    setMe(state, action: PayloadAction<string | null>) {
      state.meId = action.payload;
      if (typeof window !== "undefined") {
        if (action.payload) localStorage.setItem(LS_KEY, action.payload);
        else localStorage.removeItem(LS_KEY);
      }
    },
    hydrateMeFromStorage(state) {
      if (typeof window === "undefined") return;
      const stored = localStorage.getItem(LS_KEY);
      if (stored) state.meId = stored;
    },
  },
});

export const { setMe, hydrateMeFromStorage } = meSlice.actions;
export default meSlice.reducer;
