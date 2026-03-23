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
      const fetchedPosts = response.result ?? [];
      console.log("Fetched posts:", fetchedPosts);
      // Sort posts: pinned posts first, then by creation date (newest first)
      const sortedPosts = fetchedPosts.sort((a, b) => {
        // Pinned posts come first
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        
        // If both pinned or both not pinned, sort by createdAt (newest first)
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      setPosts(sortedPosts);
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

