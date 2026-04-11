import { useState } from "react";
import { postApi } from "@/apis/post.api";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Sort posts: pinned posts first, then by creation date (newest first)
 */
const sortPosts = (posts) => {
  return [...posts].sort((a, b) => {
    // Pinned posts come first
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    
    // If both pinned or both not pinned, sort by createdAt (newest first)
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
};

/**
 * Mutations for posts: create, update, delete.
 * Receives `setPosts` from `usePosts` to update the shared list.
 *
 * @param {import("react").Dispatch<import("react").SetStateAction<any[]>>} setPosts
 */
const usePostMutations = (setPosts) => {
  const [submitting, setSubmitting] = useState(false);
  const { user, adjustStorageUsage, refreshCurrentUser } = useAuth();

  const getStorageUsedValue = (currentUser) => {
    const usageList = Array.isArray(currentUser?.userBenefitUsageDTO)
      ? currentUser.userBenefitUsageDTO
      : [];
    const storageUsage = usageList.find((item) => item?.benefitCode === "STORAGE");
    const storageUsed = Number(storageUsage?.used);

    if (!Number.isFinite(storageUsed) || storageUsed < 0) {
      return 0;
    }

    return storageUsed;
  };

  const getTotalUploadBytes = (files = []) => {
    const normalizedFiles = Array.isArray(files) ? files.filter(Boolean) : [];
    return normalizedFiles.reduce((total, file) => {
      const fileSize = Number(file?.size);
      return total + (Number.isFinite(fileSize) ? fileSize : 0);
    }, 0);
  };

  const keepOptimisticStorageIfBackendStale = async (optimisticStorageUsed) => {
    try {
      const refreshedUser = await refreshCurrentUser();
      const refreshedStorageUsed = getStorageUsedValue(refreshedUser);

      if (refreshedStorageUsed < optimisticStorageUsed) {
        adjustStorageUsage(optimisticStorageUsed - refreshedStorageUsed);
      }
    } catch {
      // Ignore sync errors to avoid breaking successful post actions.
    }
  };

  const createPost = async (data, files = []) => {
    const totalUploadBytes = getTotalUploadBytes(files);
    const previousStorageUsed = getStorageUsedValue(user);
    const optimisticStorageUsed = previousStorageUsed + totalUploadBytes;

    if (totalUploadBytes > 0) {
      adjustStorageUsage(totalUploadBytes);
    }

    setSubmitting(true);
    try {
      const response = await postApi.createPost(data, files);
      setPosts((prev) => sortPosts([response.result, ...prev]));

      if (totalUploadBytes > 0) {
        await keepOptimisticStorageIfBackendStale(optimisticStorageUsed);
      }

      return { success: true };
    } catch (err) {
      if (totalUploadBytes > 0) {
        adjustStorageUsage(-totalUploadBytes);
      }

      return {
        success: false,
        message: err.response?.data?.message ?? "Không thể tạo bài đăng.",
      };
    } finally {
      setSubmitting(false);
    }
  };

  const updatePost = async (id, data, files = []) => {
    const totalUploadBytes = getTotalUploadBytes(files);
    const previousStorageUsed = getStorageUsedValue(user);
    const optimisticStorageUsed = previousStorageUsed + totalUploadBytes;

    if (totalUploadBytes > 0) {
      adjustStorageUsage(totalUploadBytes);
    }

    setSubmitting(true);
    try {
      const response = await postApi.updatePost(id, data, files);
      setPosts((prev) =>
        sortPosts(
          prev.map((p) => {
            if (p.id !== id) return p;

            const updated = response.result ?? {};
            const hasAttachments = Object.prototype.hasOwnProperty.call(updated, "attachments");

            return {
              ...p,
              ...updated,
              // If API omits attachments, preserve previous ones; otherwise trust the API response
              attachments: hasAttachments ? updated.attachments : p.attachments,
            };
          })
        )
      );

      if (totalUploadBytes > 0) {
        await keepOptimisticStorageIfBackendStale(optimisticStorageUsed);
      }

      return { success: true };
    } catch (err) {
      if (totalUploadBytes > 0) {
        adjustStorageUsage(-totalUploadBytes);
      }

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
