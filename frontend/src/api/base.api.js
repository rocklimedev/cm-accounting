import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BACKEND_URL } from "../lib/config";

export const baseApi = createApi({
  reducerPath: "api",

  baseQuery: fetchBaseQuery({
    baseUrl: BACKEND_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("erp_token");

      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      headers.set("Content-Type", "application/json");

      return headers;
    },
  }),

  tagTypes: [
    // Authentication
    "Auth",

    // Users & RBAC
    "User",
    "Role",

    // Banking
    "Bank",

    // Cash
    "Cash",
    "CashOpening",
    "CashAdjustment",
    "CashSummary",

    // Daily Closing
    "DailyClosing",

    // Debtors
    "Debtor",
    "DebtorReport",
    "DebtorEntry",

    // Expenses
    "Expense",
    "ExpenseTitle",

    // Draft Reports
    "Draft",

    // Ledger & Reconciliation
    "Ledger",
    "Reconciliation",

    // Payment Modes
    "PaymentMode",

    // Reports & Dashboard
    "Report",
    "Dashboard",

    // Sales
    "Sales",
    "Search",
    // Existing / Future Modules
    "Customer",
    "Supplier",
    "Inventory",
    "Product",
    "Purchase",
    "Setting",
  ],

  endpoints: () => ({}),
});
