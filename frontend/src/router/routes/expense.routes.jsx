import ExpenseReports from "@/concepts/expense/ExpenseReports";
import ExpenseReportForm from "@/concepts/expense/ExpenseReportForm";

const expenseRoutes = [
  {
    path: "expense-reports",
    element: <ExpenseReports />,
  },
  {
    path: "expense-reports/new",
    element: <ExpenseReportForm />,
  },
  {
    path: "expense-reports/:reportId/edit",
    element: <ExpenseReportForm />,
  },
];

export default expenseRoutes;
