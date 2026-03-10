import { apiRequest } from "@/lib/http";

export const commentApi = {
  /**
   * Get all comments for a specific post
   * @param {number} postId
   */
  getCommentsByPost: (postId) =>
    apiRequest.get(`/comments?postId=${postId}`),

  /**
   * Create a new comment
   * @param {{ postId: number, content: string, parentId?: number }} data
   */
  createComment: (data) =>
    apiRequest.post(`/comments`, data),

  /**
   * Update an existing comment
   * @param {number} commentId
   * @param {{ postId: number, content: string }} data
   */
  updateComment: (commentId, data) =>
    apiRequest.put(`/comments/${commentId}`, data),

  /**
   * Delete a comment
   * @param {number} commentId
   */
  deleteComment: (commentId) =>
    apiRequest.delete(`/comments/${commentId}`),
};
