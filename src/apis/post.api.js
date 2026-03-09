import { apiRequest } from "@/lib/http";

const BASE = "/posts";

export const postApi = {
  /**
   * @param {number} classroomId
   */
  findPostsByClassroomId: (classroomId) =>
    apiRequest.get(BASE, { params: { classroomId } }),

  /**
   * @param {{ classroomId: number, content: string }} data
   * @param {File[]} files
   */
  createPost: (data, files = []) => {
    const formData = new FormData();
    formData.append("classroomId", data.classroomId);
    formData.append("content", data.content);
    files.forEach((f) => formData.append("files", f));
    return apiRequest.post(BASE, formData);
  },

  /**
   * @param {number} id
   * @param {{ content: string }} data
   * @param {File[]} files
   */
  updatePost: (id, data, files = []) => {
    const formData = new FormData();
    formData.append("content", data.content);
    files.forEach((f) => formData.append("files", f));
    return apiRequest.put(`${BASE}/${id}`, formData);
  },

  /**
   * @param {number} id
   */
  deletePost: (id) => apiRequest.delete(`${BASE}/${id}`),
};
