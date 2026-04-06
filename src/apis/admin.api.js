import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "./util.api";

const BASE = API_SUFFIX.ADMIN;

export const adminApi = {
  getUsers: ({ keyword, role, status, page = 1, size = 10 } = {}) => {
    const params = {
      page,
      size,
    };

    if (keyword) params.keyword = keyword;
    if (role) params.role = role;
    if (status) params.status = status;

    return apiRequest.get(`${BASE}/users`, { params });
  },
  getUserDetail: (userId) => {
    return apiRequest.get(`${BASE}/users/${userId}`);
  },
  updateUserStatus: (userId, payload) => {
    return apiRequest.patch(`${BASE}/users/${userId}/status`, payload);
  },
  createUser: (payload) => {
    return apiRequest.post(`${BASE}/users`, payload);
  },
  sendAccountWarning: (userId, payload) => {
    return apiRequest.post(`${BASE}/users/${userId}/warnings`, payload);
  },
  getReports: ({ status, page = 1, size = 10 } = {}) => {
    const params = { page, size };
    if (status) params.status = status;
    return apiRequest.get(`${BASE}/reports`, { params });
  },
  getReportDetail: (reportId) => {
    return apiRequest.get(`${BASE}/reports/${reportId}`);
  },
  getSystemNotifications: ({ page = 1, size = 10 } = {}) => {
    return apiRequest.get(`${BASE}/system-notifications`, {
      params: { page, size },
    });
  },
  createSystemNotification: (payload) => {
    return apiRequest.post(`${BASE}/system-notifications`, payload);
  },
  revokeSystemNotification: (id) => {
    return apiRequest.patch(`${BASE}/system-notifications/${id}/revoke`);
  },
};
