import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LandingPage from "./pages/landing/landingpage";

import Layout from "./components/manager/layout";
import WorkerLayout from "./components/worker/WorkerLayout";
import UserLayout from "./components/user/userlayout";
import AdminLayout from "./components/admin/layout";
import { ProtectedRoute, PublicOnlyRoute } from "./components/ProtectedRoute";

import Login from "./pages/auth/login";
import Signup from "./pages/auth/signin";

// Manager Pages
import Dashboard from "./pages/manager/dashboard/new_dashboard";
import Complaint from "./pages/manager/complaints/new_complaint";
import WorkTracking from "./pages/manager/trackwork/new_track";
import Workers from "./pages/manager/workers/new_worker";
import WorkerProductivity from "./pages/manager/productivity/WorkerProductivity";
import ManagerProfile from "./pages/manager/profile/ManagerProfile";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminManagement from "./pages/admin/AdminManagement";

// User Pages
import UserDashboard from "./pages/user/dashboard/userdashboard";
import ReportComplaint from "./pages/user/complaintreport/addcomplaint";
import ViewComplaints from "./pages/user/complaintstatus/viewcomplaint";
import UserProfile from "./pages/user/profile/userprofile";

// Worker Pages
import WorkerDashboard from "./pages/worker/WorkerDashboard";
import MyComplaints from "./pages/worker/MyComplaints";
import WorkerComplaintDetails from "./pages/worker/WorkerComplaintDetails";
import WorkerProfile from "./pages/worker/WorkerProfile";
import WorkerNotifications from "./pages/worker/WorkerNotifications";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =========================
            AUTH & PUBLIC ROUTES
        ========================= */}

        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnlyRoute>
              <Signup />
            </PublicOnlyRoute>
          }
        />
        <Route path="/landing" element={<LandingPage />} />

        {/* =========================
            USER / CITIZEN PORTAL
        ========================= */}

        <Route element={<ProtectedRoute allowedRoles={["CITIZEN"]} />}>
          <Route path="/user" element={<UserLayout />}>
            <Route index element={<Navigate to="/user/dashboard" replace />} />
            <Route path="dashboard" element={<UserDashboard />} />
            <Route path="add-complaint" element={<ReportComplaint />} />
            <Route path="view-complaint" element={<ViewComplaints />} />
            <Route path="profile" element={<UserProfile />} />
          </Route>
        </Route>

        {/* =========================
            MANAGER PORTAL
        ========================= */}

        <Route element={<ProtectedRoute allowedRoles={["MANAGER", "ADMIN"]} />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/complaints" element={<Complaint />} />
            <Route path="/work-tracking" element={<WorkTracking />} />
            <Route path="/workers" element={<Workers />} />
            <Route path="/productivity" element={<WorkerProductivity />} />
            <Route path="/manager/productivity" element={<WorkerProductivity />} />
            <Route path="/manager/profile" element={<ManagerProfile />} />
          </Route>
        </Route>

        {/* =========================
            ADMIN PORTAL
        ========================= */}

        <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin">
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="management" element={<AdminManagement />} />
            </Route>
          </Route>
        </Route>

        {/* =========================
            WORKER PORTAL
        ========================= */}

        <Route element={<ProtectedRoute allowedRoles={["WORKER"]} />}>
          <Route path="/worker" element={<WorkerLayout />}>
            <Route index element={<Navigate to="/worker/dashboard" replace />} />
            <Route path="dashboard" element={<WorkerDashboard />} />
            {/* <Route path="my-complaints" element={<MyComplaints />} /> */}
            <Route path="complaints" element={<MyComplaints />} />
            <Route path="complaints/:id" element={<WorkerComplaintDetails />} />
            <Route path="profile" element={<WorkerProfile />} />
            <Route path="notifications" element={<WorkerNotifications />} />
          </Route>
        </Route>

        {/* =========================
            WORKER ALIASES
        ========================= */}

        <Route
          path="/worker-dashboard"
          element={<Navigate to="/worker/dashboard" replace />}
        />

        <Route
          path="/my-complaints"
          element={<Navigate to="/worker/my-complaints" replace />}
        />

        {/* =========================
            DEFAULT ROUTE
        ========================= */}

        <Route path="/" element={<Navigate to="/landing" replace />} />
        <Route path="*" element={<Navigate to="/landing" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
