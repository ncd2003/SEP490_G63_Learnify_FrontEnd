import { useState, useEffect, useCallback } from "react";
import { postApi } from "@/apis/post.api";

/**
 * Fetch posts for a classroom. Read-only.
 * For create/update/delete use `usePostMutations`.
 *
 * @param {number} classroomId
 */
const usePosts = (classroomId) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPosts = useCallback(async () => {
    if (!classroomId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await postApi.findPostsByClassroomId(classroomId);
      setPosts(response.result ?? []);
    } catch (err) {
      setError(err.response?.data?.message ?? "Không thể tải bài đăng.");
    } finally {
      setLoading(false);
    }
  }, [classroomId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return { posts, setPosts, loading, error, refetch: fetchPosts };
};

export default usePosts;

