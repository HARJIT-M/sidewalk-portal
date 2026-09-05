import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const workerApi = axios.create({
  baseURL: API_BASE_URL,
});

// Attach Authorization header if token is present
workerApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token") || localStorage.getItem("worker_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response interceptor
workerApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized or expired session. Please log in again.");
    }
    return Promise.reject(error);
  }
);

// ==========================================
// 1. DASHBOARD API
// ==========================================
export const getWorkerDashboard = async () => {
  const response = await workerApi.get("/api/dashboard/worker");
  return response.data;
};

// ==========================================
// 2. PROFILE APIS
// ==========================================
export const getWorkerProfile = async () => {
  const response = await workerApi.get("/api/worker/profile");
  return response.data;
};

export const updateWorkerProfile = async (profileData) => {
  const response = await workerApi.put("/api/worker/profile", profileData);
  return response.data;
};

export const changeWorkerPassword = async (passwords) => {
  const response = await workerApi.put("/api/worker/change-password", passwords);
  return response.data;
};

// ==========================================
// 3. COMPLAINTS APIS
// ==========================================
export const getWorkerComplaints = async (params = {}) => {
  const response = await workerApi.get("/api/complaints/assigned", { params });
  return response.data;
};

export const getWorkerComplaintDetails = async (id) => {
  const response = await workerApi.get(`/api/complaints/${id}`);
  return response.data;
};

// ==========================================
// 4. WORK TRACKING APIS
// ==========================================
export const startComplaintWork = async (id) => {
  const response = await workerApi.post(`/api/work-tracking/${id}/start`);
  return response.data;
};

export const submitWorkUpdate = async (id, workData) => {
  const response = await workerApi.post(`/api/work-tracking/${id}/update-work`, workData);
  return response.data;
};

// ==========================================
// 5. NOTIFICATIONS APIS
// ==========================================
export const getWorkerNotifications = async () => {
  const response = await workerApi.get("/api/notifications");
  return response.data;
};

export const markNotificationRead = async (id) => {
  const response = await workerApi.put(`/api/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await workerApi.put("/api/notifications/mark-all-read");
  return response.data;
};

export const deleteWorkerNotification = async (id) => {
  const response = await workerApi.delete(`/api/notifications/${id}`);
  return response.data;
};

export default workerApi;
