import SalesReports from "@/concepts/sales/SalesReports";
import SalesReportForm from "@/concepts/sales/SalesReportForm";

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
];

export default salesRoutes;
