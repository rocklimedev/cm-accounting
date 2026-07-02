import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../store/use-auth";
const PrivateRoute = ({
  children,
  adminOnly = false,
  superAdminOnly = false,
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-foreground/50">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateRoute;
