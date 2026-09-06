import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const managerApi = axios.create({
  baseURL: API_BASE_URL,
});

// Attach JWT token from localStorage
managerApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==========================================
// 1. DASHBOARD & PROFILE
// ==========================================
export const getManagerDashboard = async () => {
  try {
    const response = await managerApi.get("/api/dashboard/manager");
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Failed to load manager dashboard."
    );
  }
};

export const getManagerProfile = async () => {
  try {
    const response = await managerApi.get("/api/manager/profile");
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Failed to load manager profile."
    );
  }
};

// ==========================================
// 2. COMPLAINTS MANAGEMENT
// ==========================================
export const getManagerComplaints = async (params = {}) => {
  try {
    const response = await managerApi.get("/api/complaints/manager", { params });
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Failed to load complaints."
    );
  }
};

export const getComplaintDetails = async (id) => {
  try {
    const response = await managerApi.get(`/api/complaints/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Failed to load complaint details."
    );
  }
};

export const updateComplaintPriority = async (id, priority) => {
  try {
    const response = await managerApi.put(`/api/complaints/${id}/priority`, {
      priority,
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Failed to update complaint priority."
    );
  }
};

export const assignComplaintWorkers = async (id, payload) => {
  try {
    const response = await managerApi.post(`/api/complaints/${id}/assign`, payload);
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Failed to assign workers to complaint."
    );
  }
};

// ==========================================
// 3. WORKERS ROSTER & MANAGEMENT
// ==========================================
export const getAllWorkers = async () => {
  try {
    const response = await managerApi.get("/api/workers");
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Failed to load workers."
    );
  }
};

export const getAvailableWorkers = async () => {
  try {
    const response = await managerApi.get("/api/workers/available");
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Failed to load available workers."
    );
  }
};

export const addWorker = async (workerData) => {
  try {
    const response = await managerApi.post("/api/workers", workerData);
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Failed to add new worker."
    );
  }
};

export const updateWorkerStatus = async (id, status) => {
  try {
    const response = await managerApi.put(`/api/workers/${id}/status`, { status });
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Failed to update worker status."
    );
  }
};

export const deleteWorker = async (id) => {
  try {
    const response = await managerApi.delete(`/api/workers/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Failed to delete worker."
    );
  }
};

// ==========================================
// 4. WORK TRACKING & REPAIR OPERATIONS
// ==========================================
export const getAllWorkTracking = async (params = {}) => {
  try {
    const response = await managerApi.get("/api/work-tracking/manager", { params });
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Failed to load work tracking list."
    );
  }
};

export const verifyRepairWork = async (complaintId, payload = {}) => {
  try {
    const response = await managerApi.post(
      `/api/work-tracking/${complaintId}/verify`,
      payload
    );
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Failed to verify repair work."
    );
  }
};

export default managerApi;
