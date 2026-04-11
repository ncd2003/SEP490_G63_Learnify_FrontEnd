import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "./util.api";
import { FolderRequestSchema } from "@/schema/folder.schema";

const BASE = API_SUFFIX.FOLDER;

export const folderApi = {
  /**
   * @param {number} classroomId
   */
  getFoldersByClassroomId: (classroomId) =>
    apiRequest.get(BASE, { params: { classroomId } }),

  /**
   * @param {import("@/schema/folder.schema").TFolderRequest} data
   */
  createFolder: (data) => {
    const payload = FolderRequestSchema.parse(data);
    return apiRequest.post(BASE, payload);
  },

  /**
   * @param {number} classroomId
   */
  createDefaultFolder: (classroomId) =>
    apiRequest.post(`${BASE}/default`, null, { params: { classroomId } }),

  /**
   * @param {number} id
   * @param {import("@/schema/folder.schema").TFolderRequest} data
   */
  updateFolder: (id, data) => {
    const payload = FolderRequestSchema.parse(data);
    return apiRequest.put(`${BASE}/${id}`, payload);
  },

  /**
   * @param {number} id
   */
  deleteFolder: (id) => apiRequest.delete(`${BASE}/${id}`),
};
