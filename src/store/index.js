import { configureStore } from "@reduxjs/toolkit";
import { researchApi } from "@/store/researchApi";
import ui from "@/store/uiSlice";

export function makeStore() {
  return configureStore({
    reducer: {
      ui,
      [researchApi.reducerPath]: researchApi.reducer,
    },
    middleware: (getDefault) => getDefault().concat(researchApi.middleware),
  });
}
