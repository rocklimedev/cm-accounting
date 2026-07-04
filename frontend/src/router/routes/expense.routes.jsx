import ExpenseReports from "@/concepts/expense/ExpenseReports";
import ExpenseReportForm from "@/concepts/expense/ExpenseReportForm";
import ExpenseDetail from "../../concepts/expense/ExpenseDetail";

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
  {
    path: "expense-reports/:reportId",
    element: <ExpenseDetail />,
  },
];

export default expenseRoutes;
