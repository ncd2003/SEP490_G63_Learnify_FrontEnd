import axios from "axios";

const API_BASE_URL = "http://localhost:8081/api";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Enable cookies for session management
});

// Request interceptor - add auth token if exists
axiosInstance.interceptors.request.use(
  (config) => {
    // Danh sách các endpoint công khai (không cần token)
    const publicEndpoints = [
      "/auth/login",
      "/auth/register",
      "/auth/verify-otp",
      "/auth/resend-otp",
    ];

    // Kiểm tra xem URL có phải là public endpoint không
    const isPublicEndpoint = publicEndpoints.some((endpoint) =>
      config.url?.includes(endpoint),
    );

    // Chỉ thêm token nếu KHÔNG phải public endpoint
    if (!isPublicEndpoint) {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor - handle common errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, config } = error.response;

      // Only auto-redirect on 401 if NOT from auth endpoints (login/register/verify)
      if (status === 401) {
        const isAuthEndpoint =
          config?.url?.includes("/auth/login") ||
          config?.url?.includes("/auth/register") ||
          config?.url?.includes("/auth/verify-otp") ||
          config?.url?.includes("/users/me"); // Không auto-redirect khi gọi /users/me

        if (!isAuthEndpoint) {
          // Token expired on protected routes - clear auth and redirect
          console.error("401 Unauthorized - Redirecting to login");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
          window.location.href = "/login";
        } else {
          console.log("401 from auth endpoint - not redirecting");
        }
      }

      if (status === 403) {
        console.error("Access forbidden");
      }
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
