import DebtorReports from "@/concepts/debtor/DebtorReports";
import DebtorReportForm from "@/concepts/debtor/DebtorReportForm";
import DebtorDetail from "@/concepts/debtor/DebtorDetail";
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
  {
    path: "debtor-reports/:reportId",
    element: <DebtorDetail />,
  },
];

export default debtorRoutes;
