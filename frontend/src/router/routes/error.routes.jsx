import { Navigate } from "react-router-dom";

const errorRoutes = [
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
];

export default errorRoutes;
