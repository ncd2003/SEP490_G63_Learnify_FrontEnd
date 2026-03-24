import { useState, useEffect, useCallback } from "react";
import { commentApi } from "@/apis/comment.api";

/**
 * Fetch comments for a specific post.
 * For create/update/delete use `useCommentMutations`.
 * 
 * @param {number} postId
 */
const useComments = (postId) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Transform API response to UI format
  const transformComment = (comment) => {
    return {
      ...comment,
      authorName: comment.user?.name || "Người dùng",
      replies: comment.replies?.map(transformComment) || [],
    };
  };

  const fetchComments = useCallback(async () => {
    if (!postId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await commentApi.getCommentsByPost(postId);
      const list = data?.result ?? data ?? [];
      const transformed = Array.isArray(list) ? list.map(transformComment) : [];
      setComments(transformed);
    } catch (err) {
      console.error("Failed to fetch comments:", err);
      setError(err.message ?? "Không thể tải bình luận.");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return { comments, setComments, loading, error, refetch: fetchComments };
};

export default useComments;
