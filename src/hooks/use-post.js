import { useState } from "react";
import { postApi } from "@/apis/post.api";

/**
 * Mutations for posts: create, update, delete.
 * Receives `setPosts` from `usePosts` to update the shared list.
 *
 * @param {import("react").Dispatch<import("react").SetStateAction<any[]>>} setPosts
 */
const usePostMutations = (setPosts) => {
  const [submitting, setSubmitting] = useState(false);

  const createPost = async (data, files = []) => {
    setSubmitting(true);
    try {
      const response = await postApi.createPost(data, files);
      setPosts((prev) => [response.result, ...prev]);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message ?? "Không thể tạo bài đăng.",
      };
    } finally {
      setSubmitting(false);
    }
  };

  const updatePost = async (id, data, files = []) => {
    setSubmitting(true);
    try {
      const response = await postApi.updatePost(id, data, files);
      setPosts((prev) => prev.map((p) => (p.id === id ? response.result : p)));
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message ?? "Không thể cập nhật bài đăng.",
      };
    } finally {
      setSubmitting(false);
    }
  };

  const deletePost = async (id) => {
    try {
      await postApi.deletePost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message ?? "Không thể xóa bài đăng.",
      };
    }
  };

  return { createPost, updatePost, deletePost, submitting };
};

export default usePostMutations;
