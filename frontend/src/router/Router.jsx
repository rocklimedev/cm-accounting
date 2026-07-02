import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "@/concepts/auth/Login";
import Layout from "@/components/Layout";

import masterRoutes from "./masterRoutes";
import errorRoutes from "./routes/error.routes";
import PrivateRoute from "./PrivateRoute";

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Protected */}
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <Routes>
                {masterRoutes.map((route, index) => (
                  <Route
                    key={index}
                    path={route.path}
                    element={
                      route.adminOnly ? (
                        <PrivateRoute adminOnly>{route.element}</PrivateRoute>
                      ) : route.superAdminOnly ? (
                        <PrivateRoute superAdminOnly>
                          {route.element}
                        </PrivateRoute>
                      ) : (
                        route.element
                      )
                    }
                  />
                ))}

                {errorRoutes.map((route, index) => (
                  <Route
                    key={`error-${index}`}
                    path={route.path}
                    element={route.element}
                  />
                ))}
              </Routes>
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
