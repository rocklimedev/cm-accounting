import DebtorReports from "@/concepts/debtor/DebtorReports";
import DebtorReportForm from "@/concepts/debtor/DebtorReportForm";

const debtorRoutes = [
  {
    path: "debtor-reports",
    element: <DebtorReports />,
  },
  {
    path: "debtor-reports/new",
    element: <DebtorReportForm />,
  },
  {
    path: "debtor-reports/:reportId/edit",
    element: <DebtorReportForm />,
  },
];

export default debtorRoutes;
