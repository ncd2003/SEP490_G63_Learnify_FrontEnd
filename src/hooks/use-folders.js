import { useCallback, useEffect, useState } from "react";
import { folderApi } from "@/apis/folder.api";
import { useAuth } from "@/contexts/AuthContext";
import { isTeacherRole } from "@/lib/auth-role";
import { FolderListSchema, FolderNodeSchema } from "@/schema/folder.schema";

const normalizeNode = (node) => {
  const parsed = FolderNodeSchema.safeParse({
    ...node,
    subFolders: node?.subFolders ?? [],
  });

  if (parsed.success) return parsed.data;

  return {
    id: node?.id ?? Date.now(),
    name: node?.name ?? "",
    parentId: node?.parentId ?? null,
    subFolders: Array.isArray(node?.subFolders)
      ? node.subFolders.map((child) => normalizeNode(child))
      : [],
  };
};

const normalizeList = (list) => {
  if (!Array.isArray(list)) return [];
  const parsed = FolderListSchema.safeParse(list);
  if (parsed.success) return parsed.data;
  return list.map((item) => normalizeNode(item));
};

const useFolders = (classroomId) => {
  const { user } = useAuth();
  const canManageFolders = isTeacherRole(user?.role);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFolders = useCallback(async () => {
    if (!classroomId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await folderApi.getFoldersByClassroomId(Number(classroomId));
      const normalized = normalizeList(response.result ?? []);
      setFolders(normalized);
    } catch (err) {
      const message = err.response?.data?.message ?? "Không thể tải danh sách thư mục.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [classroomId]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const createFolder = useCallback(
    async ({ name, parentId = null }) => {
      if (!canManageFolders) {
        const message = "Bạn không có quyền tạo thư mục.";
        setError(message);
        return { success: false, message };
      }

      setError(null);
      try {
        const response = await folderApi.createFolder({
          name,
          parentId,
          classroomId: Number(classroomId),
        });

        const created = normalizeNode({ ...response.result, parentId, subFolders: [] });
        await fetchFolders();
        return { success: true, folder: created };
      } catch (err) {
        const message = err.response?.data?.message ?? "Không thể tạo thư mục.";
        setError(message);
        return { success: false, message };
      }
    },
    [canManageFolders, classroomId, fetchFolders]
  );

  const renameFolder = useCallback(
    async (folderId, { name, parentId = null }) => {
      if (!canManageFolders) {
        const message = "Bạn không có quyền cập nhật thư mục.";
        setError(message);
        return { success: false, message };
      }

      setError(null);
      try {
        const response = await folderApi.updateFolder(folderId, {
          name,
          parentId,
          classroomId: Number(classroomId),
        });

        const updated = normalizeNode({ ...response.result, parentId });
        await fetchFolders();
        return { success: true, folder: updated };
      } catch (err) {
        const message = err.response?.data?.message ?? "Không thể cập nhật thư mục.";
        setError(message);
        return { success: false, message };
      }
    },
    [canManageFolders, classroomId, fetchFolders]
  );

  const deleteFolder = useCallback(async (folderId) => {
    if (!canManageFolders) {
      const message = "Bạn không có quyền xóa thư mục.";
      setError(message);
      return { success: false, message };
    }

    setError(null);
    try {
      await folderApi.deleteFolder(folderId, Number(classroomId));
      await fetchFolders();
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message ?? "Không thể xóa thư mục.";
      setError(message);
      return { success: false, message };
    }
  }, [canManageFolders, fetchFolders]);

  return {
    folders,
    loading,
    error,
    canManageFolders,
    refresh: fetchFolders,
    createFolder,
    renameFolder,
    deleteFolder,
  };
};

export default useFolders;
