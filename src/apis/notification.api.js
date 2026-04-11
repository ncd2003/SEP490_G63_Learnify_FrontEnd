import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "./util.api";

const BASE = API_SUFFIX.NOTIFICATION;

export const notificationApi = {
  getMyNotifications: () => apiRequest.get(BASE),

  getMyNotificationsPage: ({ page = 1, size = 10, unreadOnly = false } = {}) =>
    apiRequest.get(`${BASE}/page`, {
      params: {
        page,
        size,
        unreadOnly,
      },
    }),

  getUnreadCount: () => apiRequest.get(`${BASE}/unread-count`),

  markAsRead: (notificationId) =>
    apiRequest.patch(`${BASE}/${notificationId}/read`, null, {
      silentSuccess: true,
    }),

  markAllAsRead: () => apiRequest.patch(`${BASE}/read-all`),

  deleteNotification: (notificationId) => apiRequest.delete(`${BASE}/${notificationId}`),
};
