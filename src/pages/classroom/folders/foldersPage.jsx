import { useEffect, useMemo, useState } from "react";
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
  if (!open || !material) return null;

  const [expandedIds, setExpandedIds] = useState(new Set());

  useEffect(() => {
    const next = new Set();
    folders.forEach((f) => next.add(f.id));
    setExpandedIds(next);
  }, [folders]);

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderTree = (nodes, depth = 0) =>
    nodes.map((node) => {
      const hasChildren = (node.subFolders ?? []).length > 0;
      const expanded = expandedIds.has(node.id);
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

const FoldersPage = () => {
  const { id: classroomId } = useParams();
  const [selectedId, setSelectedId] = useState(null);
  const { folders, loading, refresh, createFolder, renameFolder, deleteFolder } = useFolders(Number(classroomId));
  const {
    materials,
    loading: loadingMaterials,
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
  const [materialSearch, setMaterialSearch] = useState("");
  const [materialMoveState, setMaterialMoveState] = useState({ open: false, material: null, targetId: null });
  const [materialMoveSubmitting, setMaterialMoveSubmitting] = useState(false);
  const [materialDeleteState, setMaterialDeleteState] = useState({ open: false, material: null });
  const [materialDeleteSubmitting, setMaterialDeleteSubmitting] = useState(false);
  const [materialRenameState, setMaterialRenameState] = useState({ open: false, material: null, name: "" });
  const [materialRenameSubmitting, setMaterialRenameSubmitting] = useState(false);

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
  }, [selectedId]);

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
  const openCreateChild = () => {
    if (!selectedFolder) return;
    setFormState({ mode: "create", targetId: null, parentId: selectedFolder.id, name: "" });
  };
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

  const handleDelete = async (folder) => {
    if (!folder) return;
    const confirmed = window.confirm(`Bạn có chắc muốn xóa thư mục "${folder.name}"?`);
    if (!confirmed) return;
    const result = await deleteFolder(folder.id);
    if (result.success && selectedId === folder.id) {
      setSelectedId(null);
    }
  };

  const handleMaterialRename = (material) => {
    if (!material?.id) return;
    setMaterialRenameState({ open: true, material, name: material.fileName ?? "" });
  };

  const closeMaterialRename = () => setMaterialRenameState({ open: false, material: null, name: "" });

  const confirmMaterialRename = async () => {
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
    if (!material?.id) return;
    setMaterialMoveState({ open: true, material, targetId: selectedId ?? null });
  };

  const closeMaterialMove = () => setMaterialMoveState({ open: false, material: null, targetId: null });

  const confirmMaterialMove = async () => {
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
    if (!material?.id) return;
    setMaterialDeleteState({ open: true, material });
  };

  const closeMaterialDelete = () => setMaterialDeleteState({ open: false, material: null });

  const confirmMaterialDelete = async () => {
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
              <div>
                <h2 className="panel-title">Tài liệu</h2>
                <p className="panel-subtitle">
                  {selectedFolder ? `Thư mục: ${selectedFolder.name}` : "Chọn thư mục để xem tài liệu"}
                </p>
              </div>
              <div className="material-actions">
                <input
                  type="search"
                  value={materialSearch}
                  onChange={(e) => setMaterialSearch(e.target.value)}
                  placeholder="Tìm theo tên tài liệu"
                  className="input"
                />
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!selectedFolder || !files || files.length === 0) return;
                    setUploading(true);
                    try {
                      await uploadMaterials(Number(classroomId), Array.from(files));
                      setFiles([]);
                      e.target.reset();
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
                    disabled={!selectedFolder}
                    className="file-input"
                  />
                  <button
                    type="submit"
                    disabled={uploading || !selectedFolder || !files || files.length === 0}
                    className="btn btn-primary"
                  >
                    {uploading && <span className="spinner" />}
                    Tải lên
                  </button>
                </form>
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
                  {materials
                    .filter((file) => file.fileName.toLowerCase().includes(materialSearch.trim().toLowerCase()))
                    .map((file) => (
                    <li key={`${file.id ?? file.fileUrl}`} className="material-item">
                      <div className="material-meta">
                        <span className="material-name">{file.fileName}</span>
                        <span className="material-subtext">{formatFileSize(file.fileSize)} • {file.fileType}</span>
                      </div>
                      <div className="material-actions-inline">
                        <a
                          href={file.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="link"
                        >
                          Tải xuống
                        </a>
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
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      <FolderFormModal
        open={Boolean(formState.mode)}
        title={formState.mode === "create" ? "Tạo thư mục" : "Đổi tên thư mục"}
        name={formState.name}
        onClose={closeForm}
        onSubmit={handleFormSubmit}
        submitting={submitting}
      />

      <MaterialMoveModal
        open={materialMoveState.open}
        folders={folders}
        material={materialMoveState.material}
        targetId={materialMoveState.targetId}
        onSelect={(id) => setMaterialMoveState((prev) => ({ ...prev, targetId: id }))}
        onClose={closeMaterialMove}
        onConfirm={confirmMaterialMove}
        submitting={materialMoveSubmitting}
      />

      <MaterialDeleteModal
        open={materialDeleteState.open}
        material={materialDeleteState.material}
        onClose={closeMaterialDelete}
        onConfirm={confirmMaterialDelete}
        submitting={materialDeleteSubmitting}
      />

      <MaterialRenameModal
        open={materialRenameState.open}
        material={materialRenameState.material}
        name={materialRenameState.name}
        onChangeName={(value) => setMaterialRenameState((prev) => ({ ...prev, name: value }))}
        onClose={closeMaterialRename}
        onConfirm={confirmMaterialRename}
        submitting={materialRenameSubmitting}
      />
    </ClassroomDetailLayout>
  );
};

export default FoldersPage;
