import { Navigate, Outlet } from "react-router-dom";

export const ProtectedRoute = ({ allowedRoles = [] }) => {
  const token = localStorage.getItem("token");
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    if (user.role === "WORKER") return <Navigate to="/worker/dashboard" replace />;
    if (user.role === "CITIZEN") return <Navigate to="/user/dashboard" replace />;
    if (user.role === "MANAGER") return <Navigate to="/dashboard" replace />;
    if (user.role === "ADMIN") return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export const PublicOnlyRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  if (token && user?.role) {
    if (user.role === "WORKER") return <Navigate to="/worker/dashboard" replace />;
    if (user.role === "CITIZEN") return <Navigate to="/user/dashboard" replace />;
    if (user.role === "MANAGER") return <Navigate to="/dashboard" replace />;
    if (user.role === "ADMIN") return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

