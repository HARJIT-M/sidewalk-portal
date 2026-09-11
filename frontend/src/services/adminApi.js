import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

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
      error?.response?.data?.message || "Failed to load admin dashboard stats."
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
      error?.response?.data?.message || "Failed to load users."
    );
  }
};

export const updateUserStatus = async (id, status) => {
  try {
    const response = await adminApi.put(`/api/admin/users/${id}/status`, { status });
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Failed to update user status."
    );
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await adminApi.delete(`/api/admin/users/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error?.response?.data?.message || "Failed to delete user."
    );
  }
};

export default adminApi;
