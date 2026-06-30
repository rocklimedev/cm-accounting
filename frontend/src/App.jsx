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
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import AddReport from "@/pages/AddReport";
import SalesReportForm from "@/pages/SalesReportForm";
import DebtorReportForm from "@/pages/DebtorReportForm";
import ExpenseReportForm from "@/pages/ExpenseReportForm";
import AllReports from "@/pages/AllReports";
import SalesReports from "@/pages/SalesReports";
import DebtorReports from "@/pages/DebtorReports";
import ExpenseReports from "@/pages/ExpenseReports";
import PaymentModeReport from "@/pages/PaymentModeReport";
import CashManagement from "@/pages/CashManagement";
import Drafts from "@/pages/Drafts";
import ReportDetail from "@/pages/ReportDetail";
import Users from "@/pages/Users";
import ExportReports from "@/pages/ExportReports";
import SearchResults from "@/pages/SearchResults";

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
