import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Layout from "./components/layout";

import Login from "./pages/auth/login";
import Signup from "./pages/auth/signin";

import Dashboard from "./pages/manager/dashboard/new_dashboard";
import Complaint from "./pages/manager/complaints/new_complaint";
import WorkTracking from "./pages/manager/trackwork/new_track";
import Workers from "./pages/manager/workers/new_worker";

import UserDashboard from "./pages/user/dashboard/userdashboard";
import ReportComplaint from "./pages/user/complaintreport/addcomplaint";
import ViewComplaints from "./pages/user/complaintstatus/viewcomplaint";


function App() {

    return (

        <BrowserRouter>

            <Routes>

                {/* Auth routes — no sidebar */}
                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/signup"
                    element={<Signup />}
                />

                {/* user */}
                    <Route
                        path="/user-dashboard"
                        element={<UserDashboard />}
                    />

                    <Route
                        path="/add-complaint"
                        element={<ReportComplaint />}
                    />

                    <Route
                        path="/view-complaint"
                        element={<ViewComplaints />}
                    />

                {/* Layout contains the Sidebar */}
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


                {/* Default route */}
                <Route
                    path="/"
                    element={<Navigate to="/login" replace />}
                />

            </Routes>

        </BrowserRouter>

    );

}

export default App;