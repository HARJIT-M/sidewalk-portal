import axios from "axios";

// Base API configuration
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
});

// Add a request interceptor to inject the JWT token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const userApi = {
  // ==========================================
  // DASHBOARD & PROFILE
  // ==========================================

  // Get user dashboard data
  getDashboard: async () => {
    const response = await API.get("/api/dashboard/user");
    return response.data;
  },

  // Get user profile details
  getProfile: async () => {
    const response = await API.get("/api/users/profile");
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await API.put("/api/users/profile", profileData);
    return response.data;
  },

  // ==========================================
  // COMPLAINTS
  // ==========================================

  // Submit a new complaint
  submitComplaint: async (complaintData) => {
    try {
      const response = await API.post(
        "/api/complaints",
        complaintData
      );

      return response.data;
    } catch (error) {
      console.error(
        "Submit Complaint Error:",
        error.response?.data || error.message
      );

      throw error;
    }
  },

  // Get all complaints submitted by the user
  getUserComplaints: async (status = "All") => {
    const response = await API.get("/api/complaints/user", { params: { status } });
    return response.data;
  },

  // Get details of a single complaint
  getComplaintDetails: async (id) => {
    const response = await API.get(`/api/complaints/${id}`);
    return response.data;
  },
};

export default userApi;
