import { useState, useEffect, useCallback } from "react";
import { commentApi } from "@/apis/comment.api";

/**
 * Fetch comments for a specific post.
 * For create/update/delete use `useCommentMutations`.
 * 
 * @param {number} postId
 * @param {number} classroomId
 */
const useComments = (postId, classroomId) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const sortByCreatedDesc = (a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0);

  const fetchComments = useCallback(async () => {
    if (!postId || classroomId == null) {
      setComments([]);
      setError(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await commentApi.getCommentsByPostId(postId, classroomId);
      const list = data?.result ?? data ?? [];
      // Transform API response to UI format
      const transformComment = (comment) => {
        const replies = (comment.replies?.map(transformComment) || []).sort(sortByCreatedDesc);
        return {
          ...comment,
          authorName: comment.user?.fullName || comment.user?.name || "Người dùng",
          replies,
        };
      };

      const transformed = Array.isArray(list) ? list.map(transformComment).sort(sortByCreatedDesc) : [];
      setComments(transformed);
    } catch (err) {
      console.error("Failed to fetch comments:", err);
      setError(err.message ?? "Không thể tải bình luận.");
    } finally {
      setLoading(false);
    }
  }, [postId, classroomId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return { comments, setComments, loading, error, refetch: fetchComments };
};

export default useComments;
