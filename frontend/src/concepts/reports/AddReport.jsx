import React from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { TrendingUp, ReceiptText, ArrowRight, HandCoins } from "lucide-react";

export default function AddReport() {
  const navigate = useNavigate();
  const cards = [
    {
      test: "add-report-sales-card",
      to: "/sales-reports/new",
      icon: TrendingUp,
      title: "Add Sales Report",
      desc: "Record Gross Amount and Retail (Cash, UPI, Bank, Card). Debtor is auto-calculated.",
    },
    {
      test: "add-report-debtor-card",
      to: "/debtor-reports/new",
      icon: HandCoins,
      title: "Add Debtor Report",
      desc: "Add new debtor amounts or record debtor receipts against the outstanding balance.",
    },
    {
      test: "add-report-expense-card",
      to: "/expense-reports/new",
      icon: ReceiptText,
      title: "Add Expense Report",
      desc: "Add expenses using preset titles with amount and payment mode.",
    },
  ];
  return (
    <Layout title="Add Report">
      <div className="max-w-4xl space-y-4">
        <p className="text-sm text-foreground/60">
          Choose the type of report you want to create.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {cards.map((c) => (
            <Card
              key={c.test}
              data-testid={c.test}
              onClick={() => navigate(c.to)}
              className="border border-border rounded-md p-5 bg-card shadow-none cursor-pointer hover:bg-secondary transition-colors"
            >
              <div className="h-10 w-10 bg-primary/10 flex items-center justify-center rounded-sm mb-3">
                <c.icon className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-base font-semibold flex items-center gap-2">
                {c.title} <ArrowRight className="h-4 w-4" />
              </h2>
              <p className="text-sm text-foreground/60 mt-1">{c.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
