import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "./util.api";

const BASE = API_SUFFIX.AUTH;

export const authApi = {
  login: (credentials) => apiRequest.post(`${BASE}/login`, credentials),

  register: (userData) => apiRequest.post(`${BASE}/register`, userData),

  logout: () => apiRequest.post(`${BASE}/logout`),

  verifyOtp: (otpData) => apiRequest.post(`${BASE}/verify-otp`, otpData),

  resendOtp: (data) => apiRequest.post(`${BASE}/resend-otp`, data),

  getCurrentUser: () => apiRequest.get("/users/me"),

  forgotPassword: (email) =>
    apiRequest.post(`${BASE}/forgot-password`, { email }),

  verifyForgotPasswordOtp: (data) =>
    apiRequest.post(`${BASE}/forgot-password/verify-otp`, data),

  resetPassword: (data) => apiRequest.post(`${BASE}/reset-password`, data),
};
