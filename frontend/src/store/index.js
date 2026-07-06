import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "../api/base.api";
// Import all APIs so their endpoints are injected into baseApi
import "../api/auth.api";
import "../api/bank.api";
import "../api/cash.api";
import "../api/daily-closing.api";
import "../api/debtor.api";
import "../api/expense.api";
import "../api/ledger.api";
import "../api/payment-mode.api";
import "../api/rbac.api";
import "../api/reports.api";
import "../api/sales.api";
import "../api/users.api";

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),

  devTools: import.meta.env.DEV,
});
