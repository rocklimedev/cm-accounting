import AddReport from "@/concepts/reports/AddReport";
import PaymentModeReport from "@/concepts/reports/PaymentModeReport";
import AllReports from "@/concepts/reports/AllReports";
import Drafts from "@/concepts/reports/Drafts";
import ReportDetail from "@/concepts/reports/ReportDetail";
import ExportReports from "@/concepts/reports/ExportReports";

const reportRoutes = [
  {
    path: "add-report",
    element: <AddReport />,
  },
  {
    path: "payment-mode-report",
    element: <PaymentModeReport />,
  },
  {
    path: "all-reports",
    adminOnly: true,
    element: <AllReports />,
  },
  {
    path: "reports/:reportId",
    element: <ReportDetail />,
  },
  {
    path: "drafts",
    element: <Drafts />,
  },
  {
    path: "export",
    adminOnly: true,
    element: <ExportReports />,
  },
];

export default reportRoutes;
