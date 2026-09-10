import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { isAuthenticated, getUser } from "../utils/auth";

const ProtectedRoute = ({ allowedRoles }) => {
  // Check if user is logged in
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Get logged-in user
  const user = getUser();

  // If user information is missing, send them to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check user's role if allowedRoles is provided
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Send user to their correct dashboard
    if (user.role === "CITIZEN") {
      return <Navigate to="/user/dashboard" replace />;
    }

    if (user.role === "WORKER") {
      return <Navigate to="/worker/dashboard" replace />;
    }

    if (user.role === "MANAGER") {
      return <Navigate to="/dashboard" replace />;
    }

    // Unknown role
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;