import { configureStore } from "@reduxjs/toolkit";

import { authApi } from "../api/auth.api";
import { bankApi } from "../api/bank.api";
import { cashApi } from "../api/cash.api";
import { dailyClosingApi } from "../api/daily-closing.api";
import { debtorApi } from "../api/debtor.api";
import { expenseApi } from "../api/expense.api";
import { ledgerApi } from "../api/ledger.api";
import { rbacApi } from "../api/rbac.api";
import { salesApi } from "../api/sales.api";
import { usersApi } from "../api/users.api";
import { reportsApi } from "../api/reports.api"; // Import the reportsApi
import { paymentModeApi } from "../api/payment-mode.api";
export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [bankApi.reducerPath]: bankApi.reducer,
    [cashApi.reducerPath]: cashApi.reducer,
    [dailyClosingApi.reducerPath]: dailyClosingApi.reducer,
    [debtorApi.reducerPath]: debtorApi.reducer,
    [expenseApi.reducerPath]: expenseApi.reducer,
    [ledgerApi.reducerPath]: ledgerApi.reducer,
    [rbacApi.reducerPath]: rbacApi.reducer,
    [salesApi.reducerPath]: salesApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [reportsApi.reducerPath]: reportsApi.reducer, // Add this line for reportsApi
    [paymentModeApi.reducerPath]: paymentModeApi.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      bankApi.middleware,
      cashApi.middleware,
      dailyClosingApi.middleware,
      debtorApi.middleware,
      expenseApi.middleware,
      ledgerApi.middleware,
      rbacApi.middleware,
      reportsApi.middleware, // Add this line for reportsApi
      salesApi.middleware,
      usersApi.middleware,
      paymentModeApi.middleware,
    ),

  devTools: import.meta.env.DEV,
});
