import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Plus,
  RefreshCcw,
  Trash2,
  X,
  ArrowRightLeft,
} from "lucide-react";
import ClassroomDetailLayout from "@/components/ClassroomDetailLayout";
import useFolders from "@/hooks/use-folders";
import useMaterials from "@/hooks/use-materials";
import "@/assets/css/pages/classroom/folders.css";

const findFolderById = (nodes, id) => {
  for (const node of nodes) {
    if (node.id === id) return node;
    const child = findFolderById(node.subFolders ?? [], id);
    if (child) return child;
  }
  return null;
};

const sanitizeDownloadFileName = (fileName) => {
  const fallbackName = "tai-lieu";
  const normalizedName = String(fileName ?? "").trim();

  if (!normalizedName) {
    return fallbackName;
  }

  return normalizedName.replace(/[\\/:*?"<>|]/g, "_");
};

const triggerBlobDownload = (blob, fileName) => {
  const objectUrl = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");
  downloadLink.href = objectUrl;
  downloadLink.download = fileName;
  downloadLink.style.display = "none";

  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 1000);
};

const endsWithAny = (value, suffixes) =>
  suffixes.some((suffix) => value.endsWith(suffix));

const resolveMaterialPreviewType = (material, mimeType = "") => {
  const normalizedName = String(material?.fileName ?? "").trim().toLowerCase();
  const normalizedType = String(mimeType || material?.fileType || "").trim().toLowerCase();

  if (
    normalizedType.startsWith("image/")
    || endsWithAny(normalizedName, [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp"])
  ) {
    return "image";
  }

  if (
    normalizedType.startsWith("video/")
    || endsWithAny(normalizedName, [".mp4", ".mov", ".avi", ".mkv", ".webm"])
  ) {
    return "video";
  }

  if (normalizedType === "application/pdf" || normalizedName.endsWith(".pdf")) {
    return "pdf";
  }

  if (
    normalizedType.startsWith("text/")
    || endsWithAny(normalizedName, [".txt", ".md", ".csv", ".json", ".xml", ".html", ".htm"])
  ) {
    return "text";
  }

  return "other";
};

const getMaterialDownloadKey = (material) => {
  const materialId = Number(material?.id);
  if (Number.isFinite(materialId) && materialId > 0) {
    return materialId;
  }

  return String(material?.fileUrl ?? "").trim();
};

const MATERIAL_PREVIEW_INITIAL_STATE = {
  open: false,
  material: null,
  previewUrl: "",
  previewType: "other",
  blob: null,
  loading: false,
  error: "",
};

const MaterialPreviewModal = ({
  open,
  material,
  previewUrl,
  previewType,
  loading,
  error,
  onClose,
  onDownload,
}) => {
  if (!open || !material) return null;

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal large material-preview-modal">
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Xem tài liệu</h3>
            <p className="modal-subtitle">{material.fileName || "Tài liệu"}</p>
          </div>
          <button type="button" onClick={onClose} className="icon-btn ghost" aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        <div className="material-preview-body">
          {loading ? (
            <p className="muted-text">Đang mở tài liệu...</p>
          ) : error ? (
            <p className="modal-text">{error}</p>
          ) : previewType === "image" ? (
            <img
              src={previewUrl}
              alt={material.fileName || "Tài liệu"}
              className="material-preview-image"
            />
          ) : previewType === "video" ? (
            <video controls className="material-preview-video" src={previewUrl} preload="metadata" />
          ) : previewType === "pdf" || previewType === "text" ? (
            <iframe
              title={material.fileName || "Tài liệu"}
              src={previewUrl}
              className="material-preview-frame"
            />
          ) : (
            <div className="material-preview-unsupported">
              <p className="modal-text">
                Định dạng này chưa hỗ trợ xem trước trực tiếp. Bạn có thể tải xuống bằng nút bên dưới.
              </p>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onClose} className="btn btn-ghost">
            Đóng
          </button>
          <button
            type="button"
            onClick={onDownload}
            className="btn btn-primary"
            disabled={loading || Boolean(error) || !previewUrl}
          >
            Tải xuống
          </button>
        </div>
      </div>
    </div>
  );
};

const MaterialDeleteModal = ({ open, material, onClose, onConfirm, submitting }) => {
  if (!open || !material) return null;

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Xóa tài liệu</h3>
            <p className="modal-subtitle">Bạn có chắc muốn xóa tài liệu "{material.fileName}"?</p>
          </div>
          <button type="button" onClick={onClose} className="icon-btn ghost" aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        <p className="modal-text">Hành động này không thể hoàn tác.</p>

        <div className="modal-actions">
          <button type="button" onClick={onClose} className="btn btn-ghost">
            Hủy
          </button>
          <button type="button" disabled={submitting} onClick={onConfirm} className="btn btn-danger">
            {submitting && <span className="spinner" />}
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
};

const MaterialMoveModal = ({
  open,
  folders,
  material,
  targetId,
  onSelect,
  onClose,
  onConfirm,
  submitting,
}) => {
  const [collapsedIds, setCollapsedIds] = useState(new Set());

  if (!open || !material) return null;

  const toggleExpand = (id) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderTree = (nodes, depth = 0) =>
    nodes.map((node) => {
      const hasChildren = (node.subFolders ?? []).length > 0;
      const expanded = !collapsedIds.has(node.id);
      return (
        <div key={node.id} className="move-tree-item">
          <div className="move-tree-row">
            <div className="move-tree-main" style={{ marginLeft: `${depth * 12}px` }}>
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => toggleExpand(node.id)}
                  className="icon-btn ghost"
                  aria-label={expanded ? "Thu gọn" : "Mở rộng"}
                >
                  {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              ) : (
                <span className="tree-spacer" aria-hidden />
              )}
              <input
                type="radio"
                name="target-folder-material"
                value={node.id}
                checked={targetId === node.id}
                onChange={() => onSelect(node.id)}
                className="radio-input"
              />
            </div>
            <label className="move-tree-label">{node.name}</label>
          </div>

          {hasChildren && expanded && (
            <div className="move-tree-children">
              {renderTree(node.subFolders, depth + 1)}
            </div>
          )}
        </div>
      );
    });

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal large">
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Di chuyển tài liệu</h3>
            <p className="modal-subtitle">Chọn thư mục đích cho "{material.fileName}".</p>
          </div>
          <button type="button" onClick={onClose} className="icon-btn ghost" aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        <div className="move-tree-scroll">
          {renderTree(folders)}
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onClose} className="btn btn-ghost">
            Hủy
          </button>
          <button
            type="button"
            disabled={submitting || targetId === null}
            onClick={onConfirm}
            className="btn btn-primary"
          >
            {submitting && <span className="spinner" />}
            Di chuyển
          </button>
        </div>
      </div>
    </div>
  );
};

const MaterialRenameModal = ({ open, material, name, onChangeName, onClose, onConfirm, submitting }) => {
  if (!open || !material) return null;

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Đổi tên tài liệu</h3>
            <p className="modal-subtitle">Nhập tên mới cho "{material.fileName}".</p>
          </div>
          <button type="button" onClick={onClose} className="icon-btn ghost" aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            onConfirm?.();
          }}
        >
          <div className="form-group">
            <label className="form-label" htmlFor="material-name">Tên tài liệu</label>
            <input
              id="material-name"
              name="material-name"
              value={name}
              onChange={(e) => onChangeName(e.target.value)}
              className="input"
              maxLength={255}
              required
              autoFocus
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Hủy
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting && <span className="spinner" />}
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const FolderFormModal = ({ open, title, name, onClose, onSubmit, submitting }) => {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <h3 className="modal-title">{title}</h3>
            <p className="modal-subtitle">Đặt tên thư mục (tối đa 100 ký tự).</p>
          </div>
          <button type="button" onClick={onClose} className="icon-btn ghost" aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        <form className="form" onSubmit={onSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="folder-name">Tên thư mục</label>
            <input
              id="folder-name"
              name="folder-name"
              defaultValue={name}
              className="input"
              maxLength={100}
              required
              autoFocus
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Hủy
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting && <span className="spinner" />}
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const FolderDeleteModal = ({ open, folder, onClose, onConfirm, submitting }) => {
  if (!open || !folder) return null;

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Xóa thư mục</h3>
            <p className="modal-subtitle">Bạn có chắc muốn xóa thư mục "{folder.name}"?</p>
          </div>
          <button type="button" onClick={onClose} className="icon-btn ghost" aria-label="Đóng">
            <X size={18} />
          </button>
        </div>

        <p className="modal-text">Xóa thư mục có thể làm mất các thư mục con và tài liệu bên trong.</p>
        <p className="modal-text">Hành động này không thể hoàn tác.</p>

        <div className="modal-actions">
          <button type="button" onClick={onClose} className="btn btn-ghost" disabled={submitting}>
            Hủy
          </button>
          <button type="button" disabled={submitting} onClick={onConfirm} className="btn btn-danger">
            {submitting && <span className="spinner" />}
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
};

const FoldersPage = () => {
  const { id: classroomId } = useParams();
  const [selectedId, setSelectedId] = useState(null);
  const { folders, loading, refresh, createFolder, renameFolder, deleteFolder, canManageFolders } = useFolders(Number(classroomId));
  const {
    materials,
    loading: loadingMaterials,
    canManageMaterials,
    uploadMaterials,
    moveMaterial,
    renameMaterial,
    deleteMaterial,
  } = useMaterials(selectedId);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState([]);

  const [expandedIds, setExpandedIds] = useState(new Set());
  const [formState, setFormState] = useState({ mode: null, targetId: null, parentId: null, name: "" });
  const [submitting, setSubmitting] = useState(false);
  const [folderDeleteState, setFolderDeleteState] = useState({ open: false, folder: null });
  const [folderDeleteSubmitting, setFolderDeleteSubmitting] = useState(false);
  const [materialSearch, setMaterialSearch] = useState("");
  const [materialSortByCreatedAt, setMaterialSortByCreatedAt] = useState("desc");
  const [materialMoveState, setMaterialMoveState] = useState({ open: false, material: null, targetId: null });
  const [materialMoveSubmitting, setMaterialMoveSubmitting] = useState(false);
  const [materialDeleteState, setMaterialDeleteState] = useState({ open: false, material: null });
  const [materialDeleteSubmitting, setMaterialDeleteSubmitting] = useState(false);
  const [materialRenameState, setMaterialRenameState] = useState({ open: false, material: null, name: "" });
  const [materialRenameSubmitting, setMaterialRenameSubmitting] = useState(false);
  const [previewingMaterialId, setPreviewingMaterialId] = useState(null);
  const [materialPreviewState, setMaterialPreviewState] = useState(MATERIAL_PREVIEW_INITIAL_STATE);

  const guardTeacherMaterialAction = useCallback(() => {
    if (canManageMaterials) {
      return true;
    }
    return false;
  }, [canManageMaterials]);

  useEffect(() => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      folders.forEach((f) => next.add(f.id));
      return next;
    });
  }, [folders]);

  useEffect(() => {
    if (!selectedId && folders.length > 0) {
      setSelectedId(folders[0].id);
    }
  }, [folders, selectedId]);

  useEffect(() => {
    setMaterialSearch("");
    setMaterialSortByCreatedAt("desc");
  }, [selectedId]);

  useEffect(() => () => {
    if (materialPreviewState.previewUrl) {
      URL.revokeObjectURL(materialPreviewState.previewUrl);
    }
  }, [materialPreviewState.previewUrl]);

  const selectedFolder = useMemo(() => findFolderById(folders, selectedId), [folders, selectedId]);

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const openCreateRoot = () => setFormState({ mode: "create", targetId: null, parentId: null, name: "" });
  const openCreateChildFor = (folderId) => setFormState({ mode: "create", targetId: null, parentId: folderId, name: "" });
  const openRename = (folder) => setFormState({ mode: "rename", targetId: folder.id, parentId: folder.parentId ?? null, name: folder.name });
  const closeForm = () => setFormState({ mode: null, targetId: null, parentId: null, name: "" });

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = (formData.get("folder-name") ?? "").toString().trim();
    if (!name) return;

    setSubmitting(true);
    if (formState.mode === "create") {
      const result = await createFolder({ name, parentId: formState.parentId });
      if (result.success && result.folder) {
        setSelectedId(result.folder.id);
        closeForm();
      }
    } else if (formState.mode === "rename" && formState.targetId) {
      const result = await renameFolder(formState.targetId, { name, parentId: formState.parentId });
      if (result.success) {
        closeForm();
      }
    }
    setSubmitting(false);
  };

  const handleDelete = (folder) => {
    if (!folder) return;
    setFolderDeleteState({ open: true, folder });
  };

  const closeFolderDelete = () => setFolderDeleteState({ open: false, folder: null });

  const confirmFolderDelete = async () => {
    const folder = folderDeleteState.folder;
    if (!folder) return;
    setFolderDeleteSubmitting(true);
    try {
      const result = await deleteFolder(folder.id);
      if (result.success && selectedId === folder.id) {
        setSelectedId(null);
      }
    } finally {
      setFolderDeleteSubmitting(false);
      closeFolderDelete();
    }
  };

  const handleMaterialRename = (material) => {
    if (!guardTeacherMaterialAction()) return;
    if (!material?.id) return;
    setMaterialRenameState({ open: true, material, name: material.fileName ?? "" });
  };

  const closeMaterialRename = () => setMaterialRenameState({ open: false, material: null, name: "" });

  const confirmMaterialRename = async () => {
    if (!guardTeacherMaterialAction()) return;
    const { material, name } = materialRenameState;
    if (!material?.id) return;
    const trimmed = name?.trim();
    if (!trimmed) return;
    setMaterialRenameSubmitting(true);
    await renameMaterial({ materialId: material.id, name: trimmed });
    setMaterialRenameSubmitting(false);
    closeMaterialRename();
  };

  const handleMaterialMove = async (material) => {
    if (!guardTeacherMaterialAction()) return;
    if (!material?.id) return;
    setMaterialMoveState({ open: true, material, targetId: selectedId ?? null });
  };

  const closeMaterialMove = () => setMaterialMoveState({ open: false, material: null, targetId: null });

  const confirmMaterialMove = async () => {
    if (!guardTeacherMaterialAction()) return;
    const { material, targetId } = materialMoveState;
    if (!material?.id || targetId === null) return;

    if (!findFolderById(folders, targetId)) {
      window.alert("Không tìm thấy thư mục đích.");
      return;
    }

    setMaterialMoveSubmitting(true);
    await moveMaterial({ materialId: material.id, targetFolderId: targetId, classroomId: Number(classroomId) });
    setMaterialMoveSubmitting(false);
    setSelectedId(targetId);
    closeMaterialMove();
  };

  const handleMaterialDelete = async (material) => {
    if (!guardTeacherMaterialAction()) return;
    if (!material?.id) return;
    setMaterialDeleteState({ open: true, material });
  };

  const handleMaterialPreview = async (material) => {
    const fileUrl = String(material?.fileUrl ?? "").trim();
    if (!fileUrl) {
      window.alert("Không thể xem tài liệu vì thiếu đường dẫn tệp.");
      return;
    }

    const downloadKey = getMaterialDownloadKey(material);

    if (previewingMaterialId === downloadKey) {
      return;
    }

    setPreviewingMaterialId(downloadKey);
    setMaterialPreviewState((prev) => {
      if (prev.previewUrl) {
        URL.revokeObjectURL(prev.previewUrl);
      }

      return {
        ...MATERIAL_PREVIEW_INITIAL_STATE,
        open: true,
        material,
        loading: true,
      };
    });

    try {
      const response = await fetch(fileUrl);

      if (!response.ok) {
        throw new Error("Không thể tải dữ liệu tài liệu.");
      }

      const fileBlob = await response.blob();
      if (!fileBlob || fileBlob.size <= 0) {
        throw new Error("Tệp tải về không hợp lệ.");
      }

      const previewUrl = URL.createObjectURL(fileBlob);

      setMaterialPreviewState((prev) => ({
        ...prev,
        loading: false,
        error: "",
        previewUrl,
        previewType: resolveMaterialPreviewType(material, fileBlob.type),
        blob: fileBlob,
      }));
    } catch (error) {
      setMaterialPreviewState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Không thể mở tài liệu.",
      }));
    } finally {
      setPreviewingMaterialId(null);
    }
  };

  const closeMaterialPreview = () => {
    setMaterialPreviewState((prev) => {
      if (prev.previewUrl) {
        URL.revokeObjectURL(prev.previewUrl);
      }

      return MATERIAL_PREVIEW_INITIAL_STATE;
    });
  };

  const handleDownloadInPreview = () => {
    if (!materialPreviewState.blob) {
      return;
    }

    triggerBlobDownload(
      materialPreviewState.blob,
      sanitizeDownloadFileName(materialPreviewState.material?.fileName),
    );
  };

  const closeMaterialDelete = () => setMaterialDeleteState({ open: false, material: null });

  const confirmMaterialDelete = async () => {
    if (!guardTeacherMaterialAction()) return;
    if (!materialDeleteState.material?.id) return;
    setMaterialDeleteSubmitting(true);
    await deleteMaterial(materialDeleteState.material.id);
    setMaterialDeleteSubmitting(false);
    closeMaterialDelete();
  };

  const formatFileSize = (size) => {
    if (size === null || size === undefined) return "--";
    const bytes = Number(size);
    if (!Number.isFinite(bytes)) return "--";
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes.toFixed(1)} B`;
  };

  const formatFileSizeForMaterial = (file) => {
    // If uploader provided an explicit unit, honor it by converting bytes -> that unit.
    const rawUnit = String(file?.sizeUnit ?? "").trim();
    const size = file?.fileSize;
    if (rawUnit && size !== null && size !== undefined) {
      const bytes = Number(size);
      if (Number.isFinite(bytes)) {
        const unit = rawUnit.toUpperCase();
        const factorMap = {
          B: 1,
          BYTE: 1,
          BYTES: 1,
          KB: 1024,
          MB: 1024 * 1024,
          GB: 1024 * 1024 * 1024,
        };
        const factor = factorMap[unit] ?? 1;
        const value = bytes / factor;
        // normalize display unit (use common shortlabels)
        const displayUnit = unit === "BYTE" || unit === "BYTES" ? "B" : unit;
        return `${value.toFixed(1)} ${displayUnit}`;
      }
    }

    // Fallback to automatic formatting by magnitude
    return formatFileSize(size);
  };

  const getCreatedAtTimestamp = useCallback((value) => {
    if (!value) return null;
    const parsedDate = new Date(value);
    const timestamp = parsedDate.getTime();
    return Number.isFinite(timestamp) ? timestamp : null;
  }, []);

  const formatCreatedAt = useCallback((value) => {
    const timestamp = getCreatedAtTimestamp(value);
    if (timestamp === null) return "--";

    return new Date(timestamp).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }, [getCreatedAtTimestamp]);

  const visibleMaterials = useMemo(() => {
    const normalizedSearch = materialSearch.trim().toLowerCase();

    return materials
      .filter((file) => file.fileName.toLowerCase().includes(normalizedSearch))
      .sort((a, b) => {
        const aTimestamp = getCreatedAtTimestamp(a.createdAt) ?? 0;
        const bTimestamp = getCreatedAtTimestamp(b.createdAt) ?? 0;

        if (materialSortByCreatedAt === "asc") {
          return aTimestamp - bTimestamp;
        }

        return bTimestamp - aTimestamp;
      });
  }, [
    materials,
    materialSearch,
    materialSortByCreatedAt,
    getCreatedAtTimestamp,
  ]);

  const renderTree = (nodes) => {
    if (!nodes || nodes.length === 0) {
      return <p className="muted-text">Chưa có thư mục nào.</p>;
    }

    return nodes.map((node) => {
      const hasChildren = (node.subFolders ?? []).length > 0;
      const expanded = expandedIds.has(node.id);
      const isActive = node.id === selectedId;
      return (
        <div key={node.id} className="tree-item">
          <div className={`tree-row ${isActive ? "active" : ""}`}>
            <div className="tree-row-main">
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => toggleExpand(node.id)}
                  className="icon-btn ghost"
                  aria-label={expanded ? "Thu gọn" : "Mở rộng"}
                >
                  {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
              ) : (
                <span className="tree-spacer" aria-hidden />
              )}

              <button
                type="button"
                onClick={() => setSelectedId(node.id)}
                className="tree-select-btn"
              >
                {node.name}
              </button>
            </div>

            {canManageFolders && (
              <div className="tree-actions">
                <button
                  type="button"
                  onClick={() => openCreateChildFor(node.id)}
                  className="icon-btn ghost"
                  aria-label="Tạo thư mục con"
                >
                  <Plus size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => openRename(node)}
                  className="icon-btn ghost"
                  aria-label="Đổi tên"
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(node)}
                  className="icon-btn ghost"
                  aria-label="Xóa"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          {hasChildren && expanded && (
            <div className="tree-children">
              {renderTree(node.subFolders)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <ClassroomDetailLayout>
      <div className="folders-page">
        <div className="folders-header">
          <div>
            <h1 className="page-title">Thư mục lớp học</h1>
            <p className="page-subtitle">Quản lý thư mục tài liệu theo cấu trúc cây.</p>
          </div>
          <div className="header-actions">
            {canManageFolders && (
              <button type="button" onClick={openCreateRoot} className="btn btn-primary">
                <Plus size={16} />
                <span>Tạo thư mục</span>
              </button>
            )}
            <button type="button" onClick={refresh} className="btn btn-outline">
              <RefreshCcw size={16} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        <div className="folders-layout">
          <div className="panel folder-tree-panel">
            <div className="panel-header">
              <h2 className="panel-title">Cây thư mục</h2>
              {loading && <span className="muted-text">Đang tải...</span>}
            </div>
            <div className="folder-tree-scroll">
              {loading ? <p className="muted-text">Đang tải thư mục...</p> : renderTree(folders)}
            </div>
          </div>

          <div className="panel materials-panel">
            <div className="panel-header materials-header">
              <div className="material-actions">
                <div className="material-filter-controls">
                  <input
                    type="search"
                    value={materialSearch}
                    onChange={(e) => setMaterialSearch(e.target.value)}
                    placeholder="Tìm theo tên tài liệu"
                    className="input material-search-input"
                  />
                  <select
                    value={materialSortByCreatedAt}
                    onChange={(e) => setMaterialSortByCreatedAt(e.target.value)}
                    className="input material-sort-select"
                    aria-label="Sắp xếp theo ngày tạo"
                  >
                    <option value="desc">Mới nhất</option>
                    <option value="asc">Cũ nhất</option>
                  </select>
                </div>
                {canManageMaterials ? (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!guardTeacherMaterialAction()) return;
                      if (!selectedFolder || !files || files.length === 0) return;
                      setUploading(true);
                      try {
                        await uploadMaterials(Number(classroomId), Array.from(files));
                        setFiles([]);
                        e.target.reset();
                      } catch {
                        // Upload errors are handled in hook/interceptor; keep form state unchanged.
                      } finally {
                        setUploading(false);
                      }
                    }}
                    className="upload-form"
                  >
                    <input
                      type="file"
                      multiple
                      onChange={(e) => setFiles(e.target.files)}
                      disabled={!selectedFolder || !canManageMaterials}
                      className="file-input"
                    />
                    <button
                      type="submit"
                      disabled={uploading || !selectedFolder || !files || files.length === 0 || !canManageMaterials}
                      className="btn btn-primary"
                    >
                      {uploading && <span className="spinner" />}
                      Tải lên
                    </button>
                  </form>
                ) : (
                  <p className="muted-text"></p>
                )}
              </div>
            </div>

            <div className="materials-content">
              {!selectedFolder ? (
                <p className="muted-text">Chọn một thư mục ở bên trái để xem/tải tài liệu.</p>
              ) : loadingMaterials ? (
                <p className="muted-text">Đang tải tài liệu...</p>
              ) : materials.length === 0 ? (
                <p className="muted-text">Chưa có tài liệu.</p>
              ) : (
                <ul className="material-list">
                  {visibleMaterials.map((file) => {
                      const filePreviewKey = getMaterialDownloadKey(file);
                      const isPreviewingFile = previewingMaterialId === filePreviewKey;

                      return (
                        <li key={`${file.id ?? file.fileUrl}`} className="material-item">
                          <div className="material-meta">
                            <span className="material-name">{file.fileName}</span>
                            <span className="material-subtext">{formatFileSizeForMaterial(file)} • {file.fileType}</span>
                            <span className="material-subtext">Ngày tạo: {formatCreatedAt(file.createdAt)}</span>
                          </div>
                          <div className="material-actions-inline">
                            <button
                              type="button"
                              className="link link-btn"
                              onClick={() => handleMaterialPreview(file)}
                              disabled={isPreviewingFile}
                            >
                              {isPreviewingFile && <span className="spinner" />}
                              {isPreviewingFile ? "Đang mở..." : "Xem"}
                            </button>
                            {canManageMaterials && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleMaterialRename(file)}
                                  className="icon-btn ghost"
                                  aria-label="Đổi tên tài liệu"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMaterialMove(file)}
                                  className="icon-btn ghost"
                                  aria-label="Di chuyển tài liệu"
                                >
                                  <ArrowRightLeft size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMaterialDelete(file)}
                                  className="icon-btn ghost"
                                  aria-label="Xóa tài liệu"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </li>
                      );
                    })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      <FolderFormModal
        open={canManageFolders && Boolean(formState.mode)}
        title={formState.mode === "create" ? "Tạo thư mục" : "Đổi tên thư mục"}
        name={formState.name}
        onClose={closeForm}
        onSubmit={handleFormSubmit}
        submitting={submitting}
      />

      <FolderDeleteModal
        open={canManageFolders && folderDeleteState.open}
        folder={folderDeleteState.folder}
        onClose={closeFolderDelete}
        onConfirm={confirmFolderDelete}
        submitting={folderDeleteSubmitting}
      />

      <MaterialMoveModal
        open={canManageMaterials && materialMoveState.open}
        folders={folders}
        material={materialMoveState.material}
        targetId={materialMoveState.targetId}
        onSelect={(id) => setMaterialMoveState((prev) => ({ ...prev, targetId: id }))}
        onClose={closeMaterialMove}
        onConfirm={confirmMaterialMove}
        submitting={materialMoveSubmitting}
      />

      <MaterialDeleteModal
        open={canManageMaterials && materialDeleteState.open}
        material={materialDeleteState.material}
        onClose={closeMaterialDelete}
        onConfirm={confirmMaterialDelete}
        submitting={materialDeleteSubmitting}
      />

      <MaterialRenameModal
        open={canManageMaterials && materialRenameState.open}
        material={materialRenameState.material}
        name={materialRenameState.name}
        onChangeName={(value) => setMaterialRenameState((prev) => ({ ...prev, name: value }))}
        onClose={closeMaterialRename}
        onConfirm={confirmMaterialRename}
        submitting={materialRenameSubmitting}
      />

      <MaterialPreviewModal
        open={materialPreviewState.open}
        material={materialPreviewState.material}
        previewUrl={materialPreviewState.previewUrl}
        previewType={materialPreviewState.previewType}
        loading={materialPreviewState.loading}
        error={materialPreviewState.error}
        onClose={closeMaterialPreview}
        onDownload={handleDownloadInPreview}
      />
    </ClassroomDetailLayout>
  );
};

export default FoldersPage;
