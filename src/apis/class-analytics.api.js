import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "./util.api";

const BASE = API_SUFFIX.CLASSROOM;

export const classAnalyticsApi = {
  getAnalytics: (classroomId, category) => {
    return apiRequest.get(`${BASE}/${classroomId}/analytics`, { params: { category } });
  },
  exportGradebook: (classroomId, category, format = "csv") => {
    return apiRequest.get(`${BASE}/${classroomId}/analytics/export`, {
      params: { category, format },
      responseType: "blob",
    });
  }
};
