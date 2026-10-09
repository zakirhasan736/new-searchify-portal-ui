import { createSlice } from "@reduxjs/toolkit";

export const PAGE_SIZES = [10, 15, 20, 50, 100];
const KEY = "sf_page_sizes";

export function loadPageSizes() {
  if (typeof window === "undefined") return {};
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
    return Object.fromEntries(Object.entries(raw).filter(([, size]) => PAGE_SIZES.includes(size)));
  } catch {
    return {};
  }
}

const uiSlice = createSlice({
  name: "ui",
  initialState: { pageSizes: {} },
  reducers: {
    hydratePageSizes(state, action) {
      state.pageSizes = { ...action.payload, ...state.pageSizes };
    },
    setPageSize(state, action) {
      const { table, size } = action.payload;
      if (!PAGE_SIZES.includes(size)) return;
      state.pageSizes[table] = size;
      try {
        localStorage.setItem(KEY, JSON.stringify(state.pageSizes));
      } catch {
        /* storage full or blocked */
      }
    },
  },
});

export const { hydratePageSizes, setPageSize } = uiSlice.actions;
export const selectPageSize = (table) => (state) => state.ui.pageSizes[table] || PAGE_SIZES[0];
export default uiSlice.reducer;
