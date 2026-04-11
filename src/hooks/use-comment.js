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

  const sortByCreatedDesc = (a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0);

  const createComment = async (data) => {
    setSubmitting(true);
    try {
      const newComment = await commentApi.createComment({ postId, ...data });
      const created = newComment?.result ?? newComment;

      // Transform to match UI format
      const transform = (item) => ({
        ...item,
        authorName: item.user?.fullName || item.user?.name || "Người dùng",
        replies: (item.replies || []).map(transform).sort(sortByCreatedDesc),
      });

      const transformed = transform(created);

      if (data.parentId) {
        // Insert reply into its parent without refetch to keep UI state/scroll
        setComments((prev) => {
          const insertReply = (list) =>
            list.map((c) => {
              if (c.id === data.parentId) {
                const replies = [...(c.replies || []), transformed].sort(sortByCreatedDesc);
                return { ...c, replies };
              }
              return { ...c, replies: insertReply(c.replies || []) };
            });
          return insertReply(prev);
        });
      } else {
        // Prepend so the newest comment is visible immediately
        setComments((prev) => [transformed, ...prev].sort(sortByCreatedDesc));
      }

      return { success: true };
    } catch (error) {
      console.error("Failed to create comment:", error);
      return {
        success: false,
        message: error.message ?? "Không thể tạo bình luận.",
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
