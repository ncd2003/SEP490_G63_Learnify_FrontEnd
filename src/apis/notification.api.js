import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "./util.api";

const BASE = API_SUFFIX.NOTIFICATION;

export const notificationApi = {
  getMyNotifications: () => apiRequest.get(BASE),

  getUnreadCount: () => apiRequest.get(`${BASE}/unread-count`),

  markAsRead: (notificationId) => apiRequest.patch(`${BASE}/${notificationId}/read`),

  markAllAsRead: () => apiRequest.patch(`${BASE}/read-all`),
};
