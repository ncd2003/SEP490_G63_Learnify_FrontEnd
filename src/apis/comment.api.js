import { apiRequest } from "@/lib/http";
import { API_SUFFIX } from "./util.api";

const BASE = API_SUFFIX.COMMENT;

export const commentApi = {
  /**
   * Get all comments for a specific post within a classroom
   * @param {number} postId
   * @param {number} classroomId
   */
  getCommentsByPost: (postId, classroomId) =>
    apiRequest.get(`${BASE}?postId=${postId}&classroomId=${classroomId}`),

  /**
   * Create a new comment
   * @param {{ postId: number, content: string, parentId?: number, classroomId?: number }} data
   */
  createComment: (data) =>
    apiRequest.post(BASE, data),

  /**
   * Update an existing comment
   * @param {number} commentId
   * @param {{ content: string, postId: number, classroomId?: number }} data
   */
  updateComment: (commentId, data) =>
    apiRequest.put(`${BASE}/${commentId}`, data),

  /**
   * Delete a comment
   * @param {number} commentId
   */
  deleteComment: (commentId) =>
    apiRequest.delete(`${BASE}/${commentId}`),
};
