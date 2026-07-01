import "@/App.css";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Login } from "./concepts/auth/Login";
import Dashboard from "./concepts/dashboard/Dashboard";
import AddReport from "./concepts/reports/AddReport";
import SalesReportForm from "./concepts/sales/SalesReportForm";
import DebtorReportForm from "./concepts/debtor/DebtorReportForm";
import ExpenseReportForm from "./concepts/expense/ExpenseReportForm";
import AllReports from "./concepts/reports/AllReports";
import SalesReports from "./concepts/sales/SalesReports";
import DebtorReports from "./concepts/debtor/DebtorReports";
import ExpenseReports from "./concepts/expense/ExpenseReports";
import PaymentModeReport from "./concepts/reports/PaymentModeReport";
import CashManagement from "./concepts/cash-management/CashManagement";
import Drafts from "./concepts/reports/Drafts";
import ReportDetail from "./concepts/reports/ReportDetail";
import Users from "./concepts/users/Users";
import ExportReports from "./concepts/reports/ExportReports";
import SearchResults from "./concepts/search/SearchResults";

function Protected({ children, adminOnly, superAdminOnly }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-foreground/50">
        Loading...
      </div>
    );
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  const isAdminLevel = user.role === "super_admin" || user.role === "admin";
  if (superAdminOnly && user.role !== "super_admin")
    return <Navigate to="/dashboard" replace />;
  if (adminOnly && !isAdminLevel) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/dashboard"
        element={
          <Protected>
            <Dashboard />
          </Protected>
        }
      />
      <Route
        path="/add-report"
        element={
          <Protected>
            <AddReport />
          </Protected>
        }
      />

      <Route
        path="/sales-reports/new"
        element={
          <Protected>
            <SalesReportForm />
          </Protected>
        }
      />
      <Route
        path="/sales-reports/:reportId/edit"
        element={
          <Protected>
            <SalesReportForm />
          </Protected>
        }
      />
      <Route
        path="/sales-reports"
        element={
          <Protected>
            <SalesReports />
          </Protected>
        }
      />

      <Route
        path="/debtor-reports/new"
        element={
          <Protected>
            <DebtorReportForm />
          </Protected>
        }
      />
      <Route
        path="/debtor-reports/:reportId/edit"
        element={
          <Protected>
            <DebtorReportForm />
          </Protected>
        }
      />
      <Route
        path="/debtor-reports"
        element={
          <Protected>
            <DebtorReports />
          </Protected>
        }
      />

      <Route
        path="/expense-reports/new"
        element={
          <Protected>
            <ExpenseReportForm />
          </Protected>
        }
      />
      <Route
        path="/expense-reports/:reportId/edit"
        element={
          <Protected>
            <ExpenseReportForm />
          </Protected>
        }
      />
      <Route
        path="/expense-reports"
        element={
          <Protected>
            <ExpenseReports />
          </Protected>
        }
      />

      <Route
        path="/payment-mode-report"
        element={
          <Protected>
            <PaymentModeReport />
          </Protected>
        }
      />
      <Route
        path="/cash-management"
        element={
          <Protected adminOnly>
            <CashManagement />
          </Protected>
        }
      />

      <Route
        path="/all-reports"
        element={
          <Protected adminOnly>
            <AllReports />
          </Protected>
        }
      />
      <Route
        path="/reports/:reportId"
        element={
          <Protected>
            <ReportDetail />
          </Protected>
        }
      />
      <Route
        path="/drafts"
        element={
          <Protected>
            <Drafts />
          </Protected>
        }
      />
      <Route
        path="/users"
        element={
          <Protected superAdminOnly>
            <Users />
          </Protected>
        }
      />
      <Route
        path="/export"
        element={
          <Protected adminOnly>
            <ExportReports />
          </Protected>
        }
      />
      <Route
        path="/search"
        element={
          <Protected>
            <SearchResults />
          </Protected>
        }
      />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster position="top-right" />
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
