import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "./util.api";

const BASE = API_SUFFIX.POST;

export const postApi = {
  /**
   * @param {number} classroomId
   */
  findPostsByClassroomId: (classroomId) =>
    apiRequest.get(BASE, { params: { classroomId } }),

  /**
   * @param {{ classroomId: number, content: string, pinned: boolean }} data
   * @param {File[]} files
   */
  createPost: (data, files = []) => {
    const formData = new FormData();
    formData.append("classroomId", data.classroomId);
    formData.append("content", data.content);
    formData.append("pinned", data.pinned);
    files.forEach((f) => formData.append("files", f));
    return apiRequest.post(BASE, formData);
  },

  /**
   * @param {number} id
   * @param {{ content: string, pinned?: boolean }} data
   * @param {File[]} files
   */
  updatePost: (id, data, files = []) => {
    const formData = new FormData();
    formData.append("content", data.content);
    formData.append("pinned", data.pinned ?? false);
    if (data.classroomId !== undefined) {
      formData.append("classroomId", data.classroomId);
    }
    // Handle deleteAttachmentIds if provided
    if (Array.isArray(data.deleteAttachmentIds) && data.deleteAttachmentIds.length > 0) {
      data.deleteAttachmentIds.forEach((attId) => formData.append("deleteAttachmentIds", attId));
    }
    files.forEach((f) => formData.append("files", f));
    return apiRequest.put(`${BASE}/${id}`, formData);
  },

  /**
   * @param {number} id
   */
  deletePost: (id) => apiRequest.delete(`${BASE}/${id}`),
};
