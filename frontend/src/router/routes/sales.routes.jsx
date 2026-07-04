import SalesReports from "@/concepts/sales/SalesReports";
import SalesReportForm from "@/concepts/sales/SalesReportForm";
import SalesDetail from "../../concepts/sales/SalesDetail";

const salesRoutes = [
  {
    path: "sales-reports",
    element: <SalesReports />,
  },
  {
    path: "sales-reports/new",
    element: <SalesReportForm />,
  },
  {
    path: "sales-reports/:reportId/edit",
    element: <SalesReportForm />,
  },
  {
    path: "sales-reports/:reportId",
    element: <SalesDetail />,
  },
];

export default salesRoutes;
