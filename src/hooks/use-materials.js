import { useCallback, useEffect, useState } from "react";
import { materialApi } from "@/apis/material.api";
import { useAuth } from "@/contexts/AuthContext";

const useMaterials = (folderId) => {
  const { user, adjustStorageUsage, refreshCurrentUser } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      setError(err.response?.data?.message ?? "Không thể tải tài liệu.");
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const uploadMaterials = useCallback(
    async (classroomId, files = []) => {
      if (!folderId || !classroomId || files.length === 0) return;

      const previousStorageUsed = getStorageUsedValue(user);
      const normalizedFiles = Array.isArray(files)
        ? files.filter(Boolean)
        : [];
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

        return response;
      } catch (err) {
        if (totalUploadBytes > 0) {
          adjustStorageUsage(-totalUploadBytes);
        }

        setError(err.response?.data?.message ?? "Không thể tải tài liệu.");
        throw err;
      }
    },
    [
      folderId,
      user,
      fetchMaterials,
      getStorageUsedValue,
      adjustStorageUsage,
      refreshCurrentUser,
    ]
  );

  const moveMaterial = useCallback(
    async ({ materialId, targetFolderId, classroomId }) => {
      if (!materialId || !targetFolderId || !classroomId) return { success: false };
      setError(null);
      await materialApi.moveMaterial(materialId, targetFolderId, classroomId);
      await fetchMaterials();
      return { success: true };
    },
    [fetchMaterials]
  );

  const renameMaterial = useCallback(
    async ({ materialId, name }) => {
      if (!materialId || !name?.trim()) return { success: false };
      setError(null);
      await materialApi.renameMaterial(materialId, name.trim());
      await fetchMaterials();
      return { success: true };
    },
    [fetchMaterials]
  );

  const deleteMaterial = useCallback(
    async (materialId) => {
      if (!materialId) return { success: false };
      setError(null);
      await materialApi.deleteMaterial(materialId);
      await fetchMaterials();
      return { success: true };
    },
    [fetchMaterials]
  );

  return {
    materials,
    loading,
    error,
    fetchMaterials,
    uploadMaterials,
    moveMaterial,
    renameMaterial,
    deleteMaterial,
  };
};

export default useMaterials;
