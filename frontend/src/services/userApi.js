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
  getDashboard: async () => {
    const response = await API.get("/api/dashboard/user");
    return response.data;
  },

  getProfile: async () => {
    const response = await API.get("/api/users/profile");
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await API.put("/api/users/profile", profileData);
    return response.data;
  },

  resolveArea: async (lat, lng, location = {}) => {
    const response = await API.get("/api/areas/resolve", {
      params: { lat, lng, ...location },
    });
    return response.data;
  },

  submitComplaint: async (complaintData) => {
    try {
      const response = await API.post("/api/complaints", complaintData);
      return response.data;
    } catch (error) {
      console.error("Submit Complaint Error:", error.response?.data || error.message);
      throw error;
    }
  },

  getUserComplaints: async (status = "All") => {
    const response = await API.get("/api/complaints/user", { params: { status } });
    return response.data;
  },

  getComplaintDetails: async (id) => {
    const response = await API.get(`/api/complaints/${id}`);
    return response.data;
  },
};

export default userApi;
