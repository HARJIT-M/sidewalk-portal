import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Layout from "./components/layout";
import WorkerLayout from "./components/WorkerLayout";

import Login from "./pages/auth/login";
import Signup from "./pages/auth/signin";

import Dashboard from "./pages/manager/dashboard/new_dashboard";
import Complaint from "./pages/manager/complaints/new_complaint";
import WorkTracking from "./pages/manager/trackwork/new_track";
import Workers from "./pages/manager/workers/new_worker";

import UserDashboard from "./pages/user/dashboard/userdashboard";
import ReportComplaint from "./pages/user/complaintreport/addcomplaint";
import ViewComplaints from "./pages/user/complaintstatus/viewcomplaint";

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
        {/* Auth routes — no sidebar */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* User Portal */}
        <Route path="/user-dashboard" element={<UserDashboard />} />
        <Route path="/add-complaint" element={<ReportComplaint />} />
        <Route path="/view-complaint" element={<ViewComplaints />} />

        {/* Manager Portal — Layout contains the Manager Sidebar */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/complaints" element={<Complaint />} />
          <Route path="/work-tracking" element={<WorkTracking />} />
          <Route path="/workers" element={<Workers />} />
        </Route>

        {/* Worker / Staff Portal — WorkerLayout contains the Worker Sidebar */}
        <Route path="/worker" element={<WorkerLayout />}>
          <Route index element={<Navigate to="/worker/dashboard" replace />} />
          <Route path="dashboard" element={<WorkerDashboard />} />
          <Route path="my-complaints" element={<MyComplaints />} />
          <Route path="complaints/:id" element={<WorkerComplaintDetails />} />
          <Route path="profile" element={<WorkerProfile />} />
          <Route path="notifications" element={<WorkerNotifications />} />
        </Route>

        {/* Worker Aliases for convenience */}
        <Route path="/worker-dashboard" element={<Navigate to="/worker/dashboard" replace />} />
        <Route path="/my-complaints" element={<Navigate to="/worker/my-complaints" replace />} />

        {/* Default route */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;