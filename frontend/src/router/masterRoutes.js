import dashboardRoutes from "./routes/dashboard.routes";
import reportRoutes from "./routes/reports.routes";
import salesRoutes from "./routes/sales.routes";
import debtorRoutes from "./routes/debtor.routes";
import expenseRoutes from "./routes/expense.routes";
import cashRoutes from "./routes/cash.routes.jsx";
import userRoutes from "./routes/user.routes";
import searchRoutes from "./routes/search.routes";

const masterRoutes = [
  ...dashboardRoutes,
  ...reportRoutes,
  ...salesRoutes,
  ...debtorRoutes,
  ...expenseRoutes,
  ...cashRoutes,
  ...userRoutes,
  ...searchRoutes,
];

export default masterRoutes;
