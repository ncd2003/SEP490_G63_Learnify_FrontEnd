import { useState } from "react";
import { commentApi } from "@/apis/comment.api";

/**
 * Comment mutation operations (create, update, delete).
 * Receives `setComments` from `useComments` to update the shared list.
 * 
 * @param {number} postId
 * @param {Function} setComments - State setter from useComments
 */
const useCommentMutations = (postId, setComments) => {
  const [submitting, setSubmitting] = useState(false);

  const createComment = async (data) => {
    setSubmitting(true);
    try {
      const newComment = await commentApi.createComment({ postId, ...data });
      const created = newComment?.result ?? newComment;
      
      setComments((prev) => [...prev, created]);
      
      return { success: true };
    } catch (error) {
      console.error("Failed to create comment:", error);
      return { 
        success: false, 
        message: error.message ?? "Không thể tạo bình luận." 
      };
    } finally {
      setSubmitting(false);
    }
  };

  const updateComment = async (commentId, data) => {
    setSubmitting(true);
    try {
      const updated = await commentApi.updateComment(commentId, { postId, ...data });
      const updatedComment = updated?.result ?? updated;
      
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, ...updatedComment } : c))
      );
      
      return { success: true };
    } catch (error) {
      console.error("Failed to update comment:", error);
      return { 
        success: false, 
        message: error.message ?? "Không thể cập nhật bình luận." 
      };
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId) => {
    try {
      await commentApi.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      return { success: true };
    } catch (error) {
      console.error("Failed to delete comment:", error);
      return { 
        success: false, 
        message: error.message ?? "Không thể xóa bình luận." 
      };
    }
  };

  return { createComment, updateComment, deleteComment, submitting };
};

export default useCommentMutations;
