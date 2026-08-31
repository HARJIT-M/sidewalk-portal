import axios from "axios";

const API_URL = "http://localhost:8000";

// ===============================
// LOGIN
// ===============================

export const loginUser = async (userData) => {
  try {
    const response = await axios.post(
      `${API_URL}/login`,
      userData
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        "Login failed. Please try again."
    );
  }
};

// ===============================
// SIGNUP
// ===============================

export const signupUser = async (userData) => {
  try {
    const response = await axios.post(
      `${API_URL}/signup`,
      userData
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        "Signup failed. Please try again."
    );
  }
};