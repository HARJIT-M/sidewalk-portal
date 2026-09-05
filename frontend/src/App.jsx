
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LandingPage from "./pages/landing/landingpage";

import Layout from "./components/manager/layout";
import WorkerLayout from "./components/worker/WorkerLayout";
import UserLayout from "./components/user/userlayout";

import Login from "./pages/auth/login";
import ProtectedRoute from "./components/ProtectedRoute";
import Signup from "./pages/auth/signin";

// Manager Pages
import Dashboard from "./pages/manager/dashboard/new_dashboard";
import Complaint from "./pages/manager/complaints/new_complaint";
import WorkTracking from "./pages/manager/trackwork/new_track";
import Workers from "./pages/manager/workers/new_worker";

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
            AUTH ROUTES
        ========================= */}

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/landing" element={<LandingPage />} />


        {/* =========================
            USER PORTAL - PROTECTED
        ========================= */}

        <Route element={<ProtectedRoute />}>
          <Route path="/user" element={<UserLayout />}>

            {/* /user → /user/dashboard */}
            <Route
              index
              element={
                <Navigate
                  to="/user/dashboard"
                  replace
                />
              }
            />

            {/* /user/dashboard */}
            <Route
              path="dashboard"
              element={<UserDashboard />}
            />

            {/* /user/add-complaint */}
            <Route
              path="add-complaint"
              element={<ReportComplaint />}
            />

            {/* /user/view-complaint */}
            <Route
              path="view-complaint"
              element={<ViewComplaints />}
            />

            {/* /user/profile */}
            <Route
              path="profile"
              element={<UserProfile />}
            />

          </Route>
        </Route>


        {/* =========================
            MANAGER PORTAL - PROTECTED
        ========================= */}

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>

            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            <Route
              path="/complaints"
              element={<Complaint />}
            />

            <Route
              path="/work-tracking"
              element={<WorkTracking />}
            />

            <Route
              path="/workers"
              element={<Workers />}
            />

          </Route>
        </Route>


        {/* =========================
            WORKER PORTAL - PROTECTED
        ========================= */}

        <Route element={<ProtectedRoute />}>
          <Route path="/worker" element={<WorkerLayout />}>

            <Route
              index
              element={
                <Navigate
                  to="/worker/dashboard"
                  replace
                />
              }
            />

            <Route
              path="dashboard"
              element={<WorkerDashboard />}
            />

            <Route
              path="my-complaints"
              element={<MyComplaints />}
            />

            <Route
              path="complaints/:id"
              element={<WorkerComplaintDetails />}
            />

            <Route
              path="profile"
              element={<WorkerProfile />}
            />

            <Route
              path="notifications"
              element={<WorkerNotifications />}
            />

          </Route>
        </Route>


        {/* =========================
            WORKER ALIASES
        ========================= */}

        <Route
          path="/worker-dashboard"
          element={
            <Navigate
              to="/worker/dashboard"
              replace
            />
          }
        />

        <Route
          path="/my-complaints"
          element={
            <Navigate
              to="/worker/my-complaints"
              replace
            />
          }
        />


        {/* =========================
            DEFAULT ROUTE
        ========================= */}

        <Route
          path="/"
          element={
            <Navigate
              to="/landing"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;