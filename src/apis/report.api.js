import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "./util.api";

const BASE = API_SUFFIX.REPORT;

export const reportApi = {
  createUserReport: (payload) => {
    return apiRequest.post(BASE, payload);
  },
};
