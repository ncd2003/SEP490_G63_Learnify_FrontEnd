import { useCallback, useEffect, useState } from "react";
import { folderApi } from "@/apis/folder.api";
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

const addFolderToTree = (tree, parentId, newFolder) => {
  if (parentId === null || parentId === undefined) {
    return [...tree, newFolder];
  }

  return tree.map((node) => {
    if (node.id === parentId) {
      return {
        ...node,
        subFolders: [...(node.subFolders ?? []), newFolder],
      };
    }
    return {
      ...node,
      subFolders: addFolderToTree(node.subFolders ?? [], parentId, newFolder),
    };
  });
};

const updateFolderInTree = (tree, targetId, payload) => {
  return tree.map((node) => {
    if (node.id === targetId) {
      return { ...node, ...payload };
    }
    return {
      ...node,
      subFolders: updateFolderInTree(node.subFolders ?? [], targetId, payload),
    };
  });
};

const removeFolderFromTree = (tree, targetId) => {
  return tree
    .filter((node) => node.id !== targetId)
    .map((node) => ({
      ...node,
      subFolders: removeFolderFromTree(node.subFolders ?? [], targetId),
    }));
};

const useFolders = (classroomId) => {
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
    [classroomId, fetchFolders]
  );

  const renameFolder = useCallback(
    async (folderId, { name, parentId = null }) => {
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
    [classroomId, fetchFolders]
  );

  const deleteFolder = useCallback(async (folderId) => {
    setError(null);
    try {
      await folderApi.deleteFolder(folderId);
      await fetchFolders();
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message ?? "Không thể xóa thư mục.";
      setError(message);
      return { success: false, message };
    }
  }, [fetchFolders]);

  return {
    folders,
    loading,
    error,
    refresh: fetchFolders,
    createFolder,
    renameFolder,
    deleteFolder,
  };
};

export default useFolders;
