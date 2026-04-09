import axios from "axios";
import envConfig from "@/schema/config.schema";
import { toast } from "sonner";

/* ─── Public endpoints (no auth token needed) ───────────────────────────── */
const PUBLIC_ENDPOINTS = [
  "/auth/login",
  "/admin/login",
  "/auth/register",
  "/auth/verify-otp",
  "/auth/resend-otp",
];

const isPublic = (url = "") => PUBLIC_ENDPOINTS.some((ep) => url.includes(ep));

const isLockedOrInactiveError = (message = "") => {
  const normalized = String(message).toLowerCase();
  return (
    normalized.includes("locked") ||
    normalized.includes("inactive") ||
    normalized.includes("disabled") ||
    normalized.includes("bị khóa") ||
    normalized.includes("không hoạt động") ||
    normalized.includes("bị cấm")
  );
};

/* ─── Params serializer (supports array params) ─────────────────────────── */
const parseParams = (params) => {
  if (!params || typeof params !== "object") return "";

  const keys = Object.keys(params);
  let options = "";

  keys.forEach((key) => {
    const value = params[key];

    if (value === undefined || value === null || value === "") {
      return;
    }

    const isObject = typeof value === "object";
    const isArray = isObject && Array.isArray(value);

    if (!isObject) {
      options += `${encodeURIComponent(key)}=${encodeURIComponent(value)}&`;
    } else if (isArray) {
      value.forEach((el) => {
        if (el === undefined || el === null || el === "") return;
        options += `${encodeURIComponent(key)}=${encodeURIComponent(el)}&`;
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
        // //console.log(`[HTTP] ${method?.toUpperCase()} ${config.url} - Token: ${token.substring(0, 30)}...`);
      } else {
        console.warn(
          `[HTTP] ${method?.toUpperCase()} ${config.url} - NO TOKEN!`,
        );
      }
    }

    return config;
  });

  /* ── Response interceptor ────────────────────────────────────────────── */
  instance.interceptors.response.use(
    (response) => {
      // Show success toast if message exists and code is 1000 (success)
      // Check if it's a mutation request (POST, PUT, DELETE) to avoid spamming toasts on GET
      const method = response.config.method?.toLowerCase();
      const isMutation = ["post", "put", "delete", "patch"].includes(method);
      const isChangePassword = response.config?.url?.includes(
        "/users/change-password",
      );
      const silentSuccess = response.config?.silentSuccess === true;

      if (
        isMutation &&
        !isChangePassword &&
        !silentSuccess &&
        response.data?.code === 1000 &&
        response.data?.message
      ) {
        toast.success(response.data.message);
      }

      return response.data;
    },
    (error) => {
      if (error.response) {
        const { status, config: reqConfig, data } = error.response;
        const shouldHandleInlineError =
          reqConfig?.url?.includes("/auth/login") ||
          reqConfig?.url?.includes("/admin/login") ||
          reqConfig?.url?.includes("/auth/register") ||
          reqConfig?.url?.includes("/auth/verify-otp") ||
          reqConfig?.url?.includes("/auth/forgot-password") ||
          reqConfig?.url?.includes("/auth/reset-password") ||
          reqConfig?.url?.includes("/users/me") ||
          reqConfig?.url?.includes("/users/change-password");

        // Show error toast
        const errorMessage = data?.message || "Đã có lỗi xảy ra";
        const isBlockedAccount = isLockedOrInactiveError(errorMessage);
        // Avoid showing toast for 401/403 errors that might be handled differently (redirects)
        // or for specific endpoints if needed.
        // Generally good to show error toast for failures.
        if (isBlockedAccount && !shouldHandleInlineError) {
          toast.error(
            "Tai khoan cua ban da bi khoa hoac khong hoat dong. Vui long lien he bo phan ho tro.",
            { id: "account-locked" },
          );
        } else if (status !== 401 && !shouldHandleInlineError) {
          toast.error(errorMessage);
        }

        console.error(
          `[HTTP Error] ${status} ${reqConfig?.method?.toUpperCase()} ${reqConfig?.url}`,
          {
            status,
            errorData: data,
            message: data?.message || error.message,
          },
        );

        if (status === 401 || isBlockedAccount) {
          // Don't auto-redirect from auth or /users/me endpoints
          const isAuthCall =
            isPublic(reqConfig?.url) || reqConfig?.url?.includes("/users/me");

          if (isBlockedAccount) {
            sessionStorage.setItem(
              "account_locked_message",
              "Tai khoan cua ban da bi khoa hoac khong hoat dong. Vui long lien he bo phan ho tro.",
            );
          }

          const hasLiveLockNotice = !!sessionStorage.getItem("account_locked_realtime");
          if (hasLiveLockNotice && !isAuthCall) {
            return Promise.reject(error);
          }

          if (!isAuthCall) {
            console.warn("[HTTP] Unauthorized/blocked - Clearing auth");
            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");
            window.location.href = "/login";
          }
        }

        if (status === 403) {
          console.error("[HTTP] 403 Forbidden - Access denied", {
            url: reqConfig?.url,
            errorMessage: data?.message || "No error message from backend",
          });
        }
      }

      return Promise.reject(error);
    },
  );

  return instance;
};

export const apiRequest = createHttp();
