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
};
