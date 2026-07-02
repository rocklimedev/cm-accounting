import CashManagement from "@/concepts/cash-management/CashManagement";

const cashRoutes = [
  {
    path: "cash-management",
    adminOnly: true,
    element: <CashManagement />,
  },
];

export default cashRoutes;
