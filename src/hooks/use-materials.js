import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { materialApi } from "@/apis/material.api";
import { useAuth } from "@/contexts/AuthContext";
import { isTeacherRole } from "@/lib/auth-role";

const useMaterials = (folderId) => {
  const { user, adjustStorageUsage, refreshCurrentUser } = useAuth();
  const canManageMaterials = isTeacherRole(user?.role);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const SUCCESS_CODE = 1000;
  const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
  const DOCUMENT_MAX_BYTES = 100 * 1024 * 1024;
  const VIDEO_MAX_BYTES = 500 * 1024 * 1024;
  const MATERIAL_SIZE_LIMIT_MESSAGE = "Kích thước tệp vượt quá giới hạn cho phép (ảnh tối đa 5MB, tài liệu tối đa 100MB, video tối đa 500MB)";

  const isOversizedMaterialFile = useCallback((file) => {
    const fileSize = Number(file?.size);

    if (!Number.isFinite(fileSize) || fileSize <= 0) {
      return false;
    }

    const mimeType = String(file?.type ?? "").toLowerCase();
    const maxBytes = mimeType.startsWith("image/")
      ? IMAGE_MAX_BYTES
      : (mimeType.startsWith("video/") ? VIDEO_MAX_BYTES : DOCUMENT_MAX_BYTES);

    return fileSize > maxBytes;
  }, [DOCUMENT_MAX_BYTES, IMAGE_MAX_BYTES, VIDEO_MAX_BYTES]);

  const getErrorMessage = useCallback((err, fallbackMessage) => {
    const serverMessage = err?.response?.data?.message;
    if (serverMessage) {
      return serverMessage;
    }

    const rawMessage = String(err?.message ?? "").trim();
    if (rawMessage.toLowerCase() === "network error") {
      return "Kích thước tệp vượt quá giới hạn cho phép (ảnh tối đa 5MB, tài liệu tối đa 100MB, video tối đa 500MB).";
    }

    return rawMessage || fallbackMessage;
  }, []);

  const shouldShowLocalToast = useCallback((err) => {
    // HTTP errors are already handled by the global interceptor.
    return !Number.isFinite(Number(err?.response?.status));
  }, []);

  const getStorageUsedValue = useCallback((currentUser) => {
    const usageList = Array.isArray(currentUser?.userBenefitUsageDTO)
      ? currentUser.userBenefitUsageDTO
      : [];
    const storageUsage = usageList.find((item) => item?.benefitCode === "STORAGE");
    const storageUsed = Number(storageUsage?.used);

    if (!Number.isFinite(storageUsed) || storageUsed < 0) {
      return 0;
    }

    return storageUsed;
  }, []);

  const fetchMaterials = useCallback(async () => {
    if (!folderId) {
      setMaterials([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await materialApi.getByFolder(folderId);
      setMaterials(response.result ?? []);
    } catch (err) {
      const message = getErrorMessage(err, "Không thể tải tài liệu.");
      setError(message);
      if (shouldShowLocalToast(err)) {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  }, [folderId, getErrorMessage, shouldShowLocalToast]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const uploadMaterials = useCallback(
    async (classroomId, files = []) => {
      if (!canManageMaterials) {
        const message = "Bạn không có quyền tải lên tài liệu.";
        setError(message);
        return { success: false, message };
      }

      if (!folderId || !classroomId || files.length === 0) return;

      const previousStorageUsed = getStorageUsedValue(user);
      const normalizedFiles = Array.isArray(files)
        ? files.filter(Boolean)
        : [];

      if (normalizedFiles.some((file) => isOversizedMaterialFile(file))) {
        setError(MATERIAL_SIZE_LIMIT_MESSAGE);
        toast.error(MATERIAL_SIZE_LIMIT_MESSAGE);
        throw new Error(MATERIAL_SIZE_LIMIT_MESSAGE);
      }

      const totalUploadBytes = normalizedFiles.reduce((total, file) => {
        const fileSize = Number(file?.size);
        return total + (Number.isFinite(fileSize) ? fileSize : 0);
      }, 0);
      const optimisticStorageUsed = previousStorageUsed + totalUploadBytes;

      setError(null);

      if (totalUploadBytes > 0) {
        adjustStorageUsage(totalUploadBytes);
      }

      try {
        const response = await materialApi.createMaterial(
          folderId,
          classroomId,
          normalizedFiles,
        );

        if (response?.code !== SUCCESS_CODE) {
          const contractError = new Error(
            response?.message ?? "Không thể tải tài liệu.",
          );
          contractError.response = { data: response };
          throw contractError;
        }

        // After create, pull fresh list to ensure consistency
        await fetchMaterials();

        // Re-sync user benefit usage from API after successful upload.
        try {
          const refreshedUser = await refreshCurrentUser();
          const refreshedStorageUsed = getStorageUsedValue(refreshedUser);

          // Keep optimistic value if backend response is delayed/stale.
          if (refreshedStorageUsed < optimisticStorageUsed) {
            adjustStorageUsage(optimisticStorageUsed - refreshedStorageUsed);
          }
        } catch {
          // Ignore sync failure to avoid treating successful upload as failed.
        }

        // Do not override server success messages — the HTTP interceptor shows them when present.
        return response;
      } catch (err) {
        if (totalUploadBytes > 0) {
          adjustStorageUsage(-totalUploadBytes);
        }

        const message = getErrorMessage(err, "Không thể tải tài liệu.");
        setError(message);
        if (shouldShowLocalToast(err)) {
          toast.error(message);
        }
        throw err;
      }
    },
    [
      canManageMaterials,
      folderId,
      user,
      fetchMaterials,
      getStorageUsedValue,
      isOversizedMaterialFile,
      adjustStorageUsage,
      refreshCurrentUser,
      SUCCESS_CODE,
      getErrorMessage,
      MATERIAL_SIZE_LIMIT_MESSAGE,
      shouldShowLocalToast,
    ]
  );

  const moveMaterial = useCallback(
    async ({ materialId, targetFolderId, classroomId }) => {
      if (!canManageMaterials) {
        const message = "Bạn không có quyền di chuyển tài liệu.";
        setError(message);
        toast.error(message);
        return { success: false, message };
      }

      if (!materialId || !targetFolderId || !classroomId) return { success: false };
      setError(null);
      try {
        await materialApi.moveMaterial(materialId, targetFolderId, classroomId);
        await fetchMaterials();
        // Do not show custom success; rely on HTTP interceptor for server messages.
        return { success: true };
      } catch (err) {
        const serverMessage = err?.response?.data?.message;
        const message = serverMessage ?? "Không thể di chuyển tài liệu.";
        setError(message);
        if (!serverMessage) {
          toast.error(message);
        }
        return { success: false, message };
      }
    },
    [canManageMaterials, fetchMaterials]
  );

  const renameMaterial = useCallback(
    async ({ materialId, name }) => {
      if (!canManageMaterials) {
        const message = "Bạn không có quyền cập nhật tài liệu.";
        setError(message);
        toast.error(message);
        return { success: false, message };
      }

      if (!materialId || !name?.trim()) return { success: false };
      setError(null);
      try {
        await materialApi.renameMaterial(materialId, name.trim());
        await fetchMaterials();
        // Rely on HTTP interceptor to surface server success messages.
        return { success: true };
      } catch (err) {
        const serverMessage = err?.response?.data?.message;
        const message = serverMessage ?? "Không thể đổi tên tài liệu.";
        setError(message);
        if (!serverMessage) {
          toast.error(message);
        }
        return { success: false, message };
      }
    },
    [canManageMaterials, fetchMaterials]
  );

  const deleteMaterial = useCallback(
    async (materialId) => {
      if (!canManageMaterials) {
        const message = "Bạn không có quyền xóa tài liệu.";
        setError(message);
        toast.error(message);
        return { success: false, message };
      }

      if (!materialId) return { success: false };
      setError(null);
      try {
        await materialApi.deleteMaterial(materialId);
        await fetchMaterials();
        // Rely on HTTP interceptor to surface server success messages.
        return { success: true };
      } catch (err) {
        const serverMessage = err?.response?.data?.message;
        const message = serverMessage ?? "Không thể xóa tài liệu.";
        setError(message);
        if (!serverMessage) {
          toast.error(message);
        }
        return { success: false, message };
      }
    },
    [canManageMaterials, fetchMaterials]
  );

  return {
    materials,
    loading,
    error,
    canManageMaterials,
    fetchMaterials,
    uploadMaterials,
    moveMaterial,
    renameMaterial,
    deleteMaterial,
  };
};

export default useMaterials;
