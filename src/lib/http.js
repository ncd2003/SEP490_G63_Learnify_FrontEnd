import axios from "axios";
import envConfig from "@/schema/config.schema";

/* ─── Public endpoints (no auth token needed) ───────────────────────────── */
const PUBLIC_ENDPOINTS = [
  "/auth/login",
  "/auth/register",
  "/auth/verify-otp",
  "/auth/resend-otp",
];

const isPublic = (url = "") =>
  PUBLIC_ENDPOINTS.some((ep) => url.includes(ep));

/* ─── Params serializer (supports array params) ─────────────────────────── */
const parseParams = (params) => {
  const keys = Object.keys(params);
  let options = "";

  keys.forEach((key) => {
    const isObject = typeof params[key] === "object";
    const isArray  = isObject && Array.isArray(params[key]);

    if (!isObject) {
      options += `${key}=${params[key]}&`;
    } else if (isArray) {
      params[key].forEach((el) => {
        options += `${key}=${el}&`;
      });
    }
  });

  return options ? options.slice(0, -1) : options;
};

/* ─── Factory ───────────────────────────────────────────────────────────── */
const createHttp = () => {
  const instance = axios.create({
    baseURL: envConfig.VITE_BASE_API_URL,
    withCredentials: false,
    paramsSerializer: parseParams,
  });

  /* ── Request interceptor ─────────────────────────────────────────────── */
  instance.interceptors.request.use((config) => {
    const { method, data } = config;

    // Set Content-Type based on payload type
    if (["put", "post", "patch"].includes(method)) {
      config.headers["Content-Type"] =
        data instanceof FormData
          ? "multipart/form-data"
          : "application/json;charset=UTF-8";
    }

    // Attach Bearer token for protected endpoints
    if (!isPublic(config.url)) {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  });

  /* ── Response interceptor ────────────────────────────────────────────── */
  instance.interceptors.response.use(
    (response) => response.data,
    (error) => {
      if (error.response) {
        const { status, config: reqConfig } = error.response;

        if (status === 401) {
          // Don't auto-redirect from auth or /users/me endpoints
          const isAuthCall =
            isPublic(reqConfig?.url) ||
            reqConfig?.url?.includes("/users/me");

          if (!isAuthCall) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");
            window.location.href = "/login";
          }
        }

        if (status === 403) {
          console.error("403 Forbidden");
        }
      }

      return Promise.reject(error);
    },
  );

  return instance;
};

export const apiRequest = createHttp();
