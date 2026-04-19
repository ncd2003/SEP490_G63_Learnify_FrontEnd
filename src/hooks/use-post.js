import { useRef, useState } from "react";
import { toast } from "sonner";
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

const createTemporaryPostId = () => `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const buildOptimisticPost = ({ temporaryId, data, user }) => ({
  id: temporaryId,
  classroomId: data.classroomId,
  content: data.content,
  pinned: Boolean(data.pinned),
  createdAt: new Date().toISOString(),
  attachments: [],
  user: {
    id: user?.id,
    fullName: user?.fullName,
    name: user?.fullName,
    avatarUrl: user?.avatarUrl,
  },
  userId: user?.id,
  isOptimistic: true,
});

const FILE_SIZE_LIMIT_ERROR_CODE = 6006;
const FILE_SIZE_LIMIT_MESSAGE =
  "Kích thước tệp vượt quá giới hạn cho phép (ảnh tối đa 5MB, video tối đa 500MB, tài liệu tối đa 100MB)";

const parseApiResponseTextMessage = (rawText = "") => {
  const text = String(rawText).trim();
  if (!text) {
    return "";
  }

  const normalized = text.toLowerCase();
  if (normalized.includes("kích thước tệp vượt quá giới") || /code\s*=\s*6006/i.test(text)) {
    return FILE_SIZE_LIMIT_MESSAGE;
  }

  const messageMatch = text.match(/message\s*=\s*(.*?)(?:,\s*[a-zA-Z_][a-zA-Z0-9_]*\s*=|\)\s*$)/i);
  if (messageMatch?.[1]) {
    return messageMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(text);
    if (Number(parsed?.code) === FILE_SIZE_LIMIT_ERROR_CODE) {
      return FILE_SIZE_LIMIT_MESSAGE;
    }

    if (typeof parsed?.message === "string" && parsed.message.trim()) {
      return parsed.message.trim();
    }
  } catch {
    // Ignore invalid JSON text payloads.
  }

  return "";
};

const resolvePostMutationErrorMessage = ({ response, error, fallback }) => {
  const code = Number(response?.code ?? error?.response?.data?.code);
  if (code === FILE_SIZE_LIMIT_ERROR_CODE) {
    return FILE_SIZE_LIMIT_MESSAGE;
  }

  const directMessage = response?.message ?? error?.response?.data?.message;
  if (typeof directMessage === "string" && directMessage.trim()) {
    return directMessage.trim();
  }

  const rawResponseData = error?.response?.data;
  if (typeof rawResponseData === "string") {
    const parsedRawMessage = parseApiResponseTextMessage(rawResponseData);
    if (parsedRawMessage) {
      return parsedRawMessage;
    }
  }

  if (typeof error?.message === "string") {
    const parsedErrorMessage = parseApiResponseTextMessage(error.message);
    if (parsedErrorMessage) {
      return parsedErrorMessage;
    }
  }

  return fallback;
};

/**
 * Mutations for posts: create, update, delete.
 * Receives `setPosts` from `usePosts` to update the shared list.
 *
 * @param {import("react").Dispatch<import("react").SetStateAction<any[]>>} setPosts
 */
const usePostMutations = (setPosts) => {
  const [submitting, setSubmitting] = useState(false);
  const mutationInFlightRef = useRef(false);
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

  const toBytes = (sizeValue, unit = "BYTE") => {
    const size = Number(sizeValue);
    if (!Number.isFinite(size) || size <= 0) {
      return 0;
    }

    const normalizedUnit = String(unit).trim().toUpperCase();
    const unitFactorMap = {
      B: 1,
      BYTE: 1,
      BYTES: 1,
      KB: 1024,
      MB: 1024 * 1024,
      GB: 1024 * 1024 * 1024,
    };

    const factor = unitFactorMap[normalizedUnit] ?? 1;
    return Math.round(size * factor);
  };

  const getFileSizeInBytes = (file) => {
    // Browser File.size is already bytes; keep unit handling as fallback for custom file objects.
    const rawSize = file?.size ?? file?.fileSize ?? 0;
    const rawUnit = file?.sizeUnit ?? "BYTE";
    return toBytes(rawSize, rawUnit);
  };

  const getTotalUploadBytes = (files = []) => {
    const normalizedFiles = Array.isArray(files) ? files.filter(Boolean) : [];
    return normalizedFiles.reduce((total, file) => total + getFileSizeInBytes(file), 0);
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
    if (mutationInFlightRef.current) {
      return {
        success: false,
        message: "Yeu cau dang duoc xu ly, vui long cho trong giay lat.",
      };
    }

    mutationInFlightRef.current = true;
    const totalUploadBytes = getTotalUploadBytes(files);
    const previousStorageUsed = getStorageUsedValue(user);
    const optimisticStorageUsed = previousStorageUsed + totalUploadBytes;
    const temporaryId = createTemporaryPostId();
    const optimisticPost = buildOptimisticPost({ temporaryId, data, user });

    setPosts((prev) => sortPosts([optimisticPost, ...prev]));

    if (totalUploadBytes > 0) {
      adjustStorageUsage(totalUploadBytes);
    }

    setSubmitting(true);
    try {
        const response = await postApi.createPost(data, files);

        // If backend returns a non-success code (e.g., validation like file too large)
        // treat it as a failure: revert optimistic changes, adjust storage, and surface error.
        if (!response || response.code !== 1000) {
          if (totalUploadBytes > 0) {
            adjustStorageUsage(-totalUploadBytes);
          }

          setPosts((prev) => prev.filter((post) => String(post.id) !== String(temporaryId)));

          const message = resolvePostMutationErrorMessage({
            response,
            fallback: "Không thể tạo bài đăng.",
          });
          toast.error(message);
          return { success: false, message };
        }

        const createdFromApi = response.result ?? {};
        const hasAttachments = Object.prototype.hasOwnProperty.call(createdFromApi, "attachments");

        setPosts((prev) =>
          sortPosts(
            prev.map((post) => {
              if (String(post.id) !== String(temporaryId)) {
                return post;
              }

              return {
                ...post,
                ...createdFromApi,
                attachments: hasAttachments ? createdFromApi.attachments : post.attachments,
                isOptimistic: false,
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

      setPosts((prev) => prev.filter((post) => String(post.id) !== String(temporaryId)));

      const message = resolvePostMutationErrorMessage({
        error: err,
        fallback: "Không thể tạo bài đăng.",
      });

      return {
        success: false,
        message,
      };
    } finally {
      mutationInFlightRef.current = false;
      setSubmitting(false);
    }
  };

  const updatePost = async (id, data, files = []) => {
    if (mutationInFlightRef.current) {
      return {
        success: false,
        message: "Yeu cau dang duoc xu ly, vui long cho trong giay lat.",
      };
    }

    mutationInFlightRef.current = true;
    const totalUploadBytes = getTotalUploadBytes(files);
    const previousStorageUsed = getStorageUsedValue(user);
    const optimisticStorageUsed = previousStorageUsed + totalUploadBytes;
    let previousPostSnapshot = null;

    const removedAttachmentIds = new Set(
      (Array.isArray(data.deleteAttachmentIds) ? data.deleteAttachmentIds : []).map((attachmentId) =>
        String(attachmentId)
      )
    );

    setPosts((prev) =>
      sortPosts(
        prev.map((post) => {
          if (String(post.id) !== String(id)) {
            return post;
          }

          previousPostSnapshot = post;

          const nextAttachments = removedAttachmentIds.size
            ? (post.attachments ?? []).filter(
                (attachment) => !removedAttachmentIds.has(String(attachment?.id))
              )
            : post.attachments;

          return {
            ...post,
            content: data.content,
            pinned: typeof data.pinned === "boolean" ? data.pinned : post.pinned,
            attachments: nextAttachments,
            isOptimistic: true,
          };
        })
      )
    );

    if (totalUploadBytes > 0) {
      adjustStorageUsage(totalUploadBytes);
    }

    setSubmitting(true);
    try {
      const response = await postApi.updatePost(id, data, files);

      if (!response || response.code !== 1000) {
        if (totalUploadBytes > 0) {
          adjustStorageUsage(-totalUploadBytes);
        }

        if (previousPostSnapshot) {
          setPosts((prev) =>
            sortPosts(
              prev.map((post) => (String(post.id) === String(id) ? previousPostSnapshot : post))
            )
          );
        }

        const message = resolvePostMutationErrorMessage({
          response,
          fallback: "Không thể cập nhật bài đăng.",
        });
        toast.error(message);
        return { success: false, message };
      }

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
              isOptimistic: false,
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

      if (previousPostSnapshot) {
        setPosts((prev) =>
          sortPosts(
            prev.map((post) =>
              String(post.id) === String(id) ? previousPostSnapshot : post
            )
          )
        );
      }

      const message = resolvePostMutationErrorMessage({
        error: err,
        fallback: "Không thể cập nhật bài đăng.",
      });

      return {
        success: false,
        message,
      };
    } finally {
      mutationInFlightRef.current = false;
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
