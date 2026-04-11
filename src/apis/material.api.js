import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "./util.api";
import { MaterialListSchema } from "@/schema/material.schema";

const BASE = API_SUFFIX.MATERIAL;

export const materialApi = {
  /**
   * @param {number} folderId
   */
  getByFolder: async (folderId) => {
    const response = await apiRequest.get(`${BASE}/folder/${folderId}`);
    const parsed = MaterialListSchema.safeParse(response.result ?? []);
    return { ...response, result: parsed.success ? parsed.data : [] };
  },

  /**
   * @param {number} folderId
   * @param {number} classroomId
   * @param {File[]} files
   */
  createMaterial: (folderId, classroomId, files = []) => {
    const formData = new FormData();
    formData.append("folderId", folderId);
    formData.append("classroomId", classroomId);
    files.forEach((file) => formData.append("files", file));
    return apiRequest.post(BASE, formData);
  },

  /**
   * @param {number} materialId
   * @param {number} folderId
   * @param {number} classroomId
   */
  moveMaterial: (materialId, folderId, classroomId) =>
    apiRequest.put(`${BASE}/move`, {}, { params: { materialId, folderId, classroomId } }),

  /**
   * @param {number} materialId
   * @param {string} name
   */
  renameMaterial: (materialId, name) =>
    apiRequest.patch(`${BASE}/${materialId}`, null, { params: { name } }),

  /**
   * @param {number} id
   */
  deleteMaterial: (id) => apiRequest.delete(`${BASE}/${id}`),
};
