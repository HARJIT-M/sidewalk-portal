import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const adminApi = axios.create({
  baseURL: API_BASE_URL,
});

// Attach JWT token from localStorage
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==========================================
// 1. ADMIN DASHBOARD
// ==========================================
export const getAdminDashboardStats = async () => {
  try {
    const response = await adminApi.get("/api/admin/dashboard");
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Failed to load admin dashboard stats.",
      { cause: error }
    );
  }
};

// ==========================================
// 2. ADMIN USER MANAGEMENT
// ==========================================
export const getAllUsers = async () => {
  try {
    const response = await adminApi.get("/api/admin/users");
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Failed to load users.",
      { cause: error }
    );
  }
};

export const updateUserStatus = async (id, status) => {
  try {
    const response = await adminApi.put(`/api/admin/users/${id}/status`, { status });
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Failed to update user status.",
      { cause: error }
    );
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await adminApi.delete(`/api/admin/users/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Failed to delete user.",
      { cause: error }
    );
  }
};

export const getUserDeletionDependencies = async (id) => {
  try {
    const response = await adminApi.get(`/api/admin/users/${id}/dependencies`);
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Failed to check account dependencies.",
      { cause: error }
    );
  }
};

export const createUser = async (userData) => {
  try {
    const response = await adminApi.post("/api/admin/add-user",  userData );
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Failed to create user.",
      { cause: error }
    );
  }
};

export const getCityManagerMappings = async () => {
  try {
    const response = await adminApi.get("/api/areas/manager-mappings");
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Failed to load city manager mappings.",
      { cause: error }
    );
  }
};

export const searchTamilNaduPlaces = async (query, type, parent) => {
  try {
    const response = await adminApi.get("/api/areas/places", {
      params: { query, type, parent },
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Failed to search Tamil Nadu places.",
      { cause: error }
    );
  }
};

export const createCityManagerArea = async (area) => {
  try {
    const response = await adminApi.post("/api/areas/manager-mappings", area);
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Failed to create city or locality mapping.",
      { cause: error }
    );
  }
};

export const updateCityManager = async (cityId, manager_id) => {
  try {
    const response = await adminApi.patch(`/api/areas/${cityId}/manager`, {
      manager_id,
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Failed to update city manager.",
      { cause: error }
    );
  }
};

export const getAdminRoutingComplaints = async () => {
  try {
    const response = await adminApi.get("/api/complaints/admin-routing");
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Failed to load complaints needing routing.",
      { cause: error }
    );
  }
};

export const routeComplaintToManager = async (complaintId, managerId) => {
  try {
    const response = await adminApi.patch(`/api/complaints/${complaintId}/route`, {
      manager_id: managerId,
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Failed to route complaint to manager.",
      { cause: error }
    );
  }
};

export default adminApi;
