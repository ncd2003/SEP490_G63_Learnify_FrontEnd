import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "./util.api";

const BASE = API_SUFFIX.REPORT;

export const reportApi = {
  createUserReport: (payload, file = null) => {
    if (file) {
      const formData = new FormData();
      formData.append(
        "report",
        new Blob([JSON.stringify(payload)], { type: "application/json" })
      );
      formData.append("evidence", file);
      
      return apiRequest.post(BASE, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    
    // Fallback to normal JSON if no file
    const formData = new FormData();
    formData.append(
      "report",
      new Blob([JSON.stringify(payload)], { type: "application/json" })
    );
    return apiRequest.post(BASE, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
