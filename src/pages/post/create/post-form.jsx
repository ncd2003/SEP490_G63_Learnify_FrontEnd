import { useState, useRef, useEffect } from "react";
import { ImagePlus, X, Paperclip, Pin } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { PostSchema } from "@/schema/post.schema";

const ALLOWED_FILE_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "mp4",
  "mov",
  "avi",
  "mp3",
  "wav",
  "pdf",
  "doc",
  "docx",
  "txt",
  "ppt",
  "pptx",
];

const ALLOWED_FILE_LABEL = "JPG, JPEG, PNG, GIF, MP4, MOV, AVI, MP3, WAV, PDF, DOC, DOCX, TXT, PPT, PPTX";

const MAX_PREVIEW_FILES = 6;

const FILE_ACCEPT = ALLOWED_FILE_EXTENSIONS.map((ext) => `.${ext}`).join(",");

const isAllowedFile = (file) => {
  const ext = file.name?.split(".").pop()?.toLowerCase();
  if (!ext) return false;
  return ALLOWED_FILE_EXTENSIONS.includes(ext);
};

const LIMITS = {
  image: 5 * 1024 * 1024,
  document: 100 * 1024 * 1024,
  video: 500 * 1024 * 1024,
};

const getFileCategory = (file) => {
  if (file?.type) {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
  }

  const ext = file.name?.split(".").pop()?.toLowerCase() ?? "";
  const imageExts = ["jpg", "jpeg", "png", "gif"];
  const videoExts = ["mp4", "mov", "avi"];

  if (imageExts.includes(ext)) return "image";
  if (videoExts.includes(ext)) return "video";
  return "document";
};

/**
 * @param {{
 *   classroomId: number,
 *   onSubmit: (data: { classroomId: number, content: string, pinned: boolean, removedAttachmentIds?: number[] }, files: File[]) => Promise<{ success: boolean, message?: string }>,
 *   submitting: boolean,
 *   initialPost?: { id: number, content: string, pinned?: boolean, attachments?: { id: number, fileName: string, fileUrl: string, fileSize: number, fileType: string }[] } | null,
 *   onCancel?: () => void,
 * }} props
 */
const PostForm = ({ classroomId, onSubmit, submitting, initialPost = null, onCancel }) => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const submitLockRef = useRef(false);
  const [content, setContent] = useState(initialPost?.content ?? "");
  const [pinned, setPinned] = useState(initialPost?.pinned ?? false);

  const [files, setFiles] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState(initialPost?.attachments ?? []);
  const [deleteAttachmentIds, setDeleteAttachmentIds] = useState([]);
  const [error, setError] = useState("");

  const isEditing = !!initialPost;

  useEffect(() => {
    setContent(initialPost?.content ?? "");
    setPinned(initialPost?.pinned ?? false);
    setFiles([]);
    setExistingAttachments(initialPost?.attachments ?? []);
    setDeleteAttachmentIds([]);
    setError("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; 
    }
  }, [initialPost, classroomId]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  const handleFileChange = (e) => {
    setError("");
    const selected = Array.from(e.target.files ?? []);
    const validFiles = [];
    const invalidFiles = [];
    const oversizedFiles = [];

    selected.forEach((file) => {
      if (!isAllowedFile(file)) {
        invalidFiles.push(file.name);
        return;
      }

      const category = getFileCategory(file);
      const maxSize = LIMITS[category] ?? LIMITS.document;

      if (file.size > maxSize) {
        oversizedFiles.push(file.name);
        return;
      }

      validFiles.push(file);
    });

    if (invalidFiles.length > 0) {
      setError(`Các tệp không được hỗ trợ: ${invalidFiles.join(", ")} (Chỉ chấp nhận: ${ALLOWED_FILE_LABEL})`);
    }

    if (oversizedFiles.length > 0) {
      toast.error("Kích thước tệp vượt quá giới hạn cho phép (ảnh tối đa 5MB, video tối đa 500MB, tài liệu tối đa 100MB)");
    }

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
    }

    e.target.value = "";
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = (id) => {
    setExistingAttachments((prev) => prev.filter((att) => att.id !== id));
    setDeleteAttachmentIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const formatFileSize = (size) => {
    if (typeof size !== "number") return "";
    return size < 1024 ? `${size.toFixed(1)} KB` : `${(size / 1024).toFixed(1)} MB`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitLockRef.current || submitting) {
      return;
    }

    // Final guard: if any selected file exceeds configured limits, block submit and show toast
    if (files.length > 0) {
      const hasOversized = files.some((f) => {
        const category = getFileCategory(f);
        const max = LIMITS[category] ?? LIMITS.document;
        return (f?.size ?? 0) > max;
      });

      if (hasOversized) {
        toast.error("Kích thước tệp vượt quá giới hạn cho phép (ảnh tối đa 5MB, video tối đa 500MB, tài liệu tối đa 100MB)");
        return;
      }
    }

    submitLockRef.current = true;
    setError("");

    try {
      const payload = {
        classroomId: Number(classroomId),
        content: content.trim(),
        pinned,
        deleteAttachmentIds: isEditing && deleteAttachmentIds.length > 0 ? deleteAttachmentIds : undefined,
      };

      const validated = PostSchema.safeParse(payload);

      if (!validated.success) {
        setError(validated.error.errors[0]?.message ?? "Dữ liệu không hợp lệ.");
        return;
      }

      const result = await onSubmit(payload, files);
      if (result?.success) {
        if (fileInputRef.current) fileInputRef.current.value = "";
        setContent("");
        setPinned(false);
        setFiles([]);
        setExistingAttachments([]);
        setDeleteAttachmentIds([]);
        onCancel?.();
      } else {
        setError(result?.message ?? "Không thể đăng bài. Vui lòng thử lại.");
      }
    } finally {
      submitLockRef.current = false;
    }
  };

  return (
    <form className="post-form" onSubmit={handleSubmit}>
      {/* Top: avatar + textarea */}
      <div className="post-form-body">
        <div className="post-form-avatar">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.fullName} />
          ) : (
            <span>{user?.fullName?.charAt(0).toUpperCase() ?? "U"}</span>
          )}
        </div>
        <textarea
          ref={textareaRef}
          className="post-form-textarea"
          placeholder={isEditing ? "Chỉnh sửa nội dung bài đăng..." : "Nhập nội dung thảo luận với lớp học..."}
          value={content}
          onInput={(e) => {
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
            setContent(e.target.value);
            setError("");
          }}
          rows={3}
          maxLength={500}
          disabled={submitting}
        />
      </div>

      <div style={{ fontSize: "12px", color: "#6b7280", textAlign: "right", paddingRight: "16px", marginBottom: "4px" }}>
        {content.length}/500
      </div>

      {error && <p className="post-form-error">{error}</p>}

      {isEditing && (existingAttachments.length > 0 || deleteAttachmentIds.length > 0) && (
        <div className="post-form-existing-attachments">
          <div className="post-form-existing-title">Tài liệu hiện có</div>
          {existingAttachments.length === 0 ? (
            <p className="post-form-no-attachments">Đã gỡ tất cả tệp đính kèm.</p>
          ) : (
            <div className="post-form-existing-list">
              {existingAttachments.map((att) => (
                <div key={att.id} className="post-form-existing-chip">
                  <div className="post-form-existing-info">
                    <Paperclip size={14} />
                    <a href={att.fileUrl} target="_blank" rel="noopener noreferrer">
                      {att.fileName}
                    </a>
                    <span className="post-form-existing-size">{formatFileSize(att.fileSize)}</span>
                  </div>
                  <button
                    type="button"
                    className="post-form-existing-remove"
                    onClick={() => removeExistingAttachment(att.id)}
                    disabled={submitting}
                  >
                    <X size={12} />
                    <span>Gỡ</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* File chips */}
      {files.length > 0 && (
        <div className="post-form-files">
          {files.slice(0, MAX_PREVIEW_FILES).map((f, i) => (
            <span key={i} className="post-form-file-chip">
              <Paperclip size={12} />
              {f.name}
              <button type="button" onClick={() => removeFile(i)} disabled={submitting}>
                <X size={12} />
              </button>
            </span>
          ))}
          {files.length > MAX_PREVIEW_FILES && (
            <span className="post-form-file-chip post-form-file-chip--overflow">+{files.length - MAX_PREVIEW_FILES} tệp</span>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="post-form-divider" />

      {/* Bottom actions */}
      <div className="post-form-actions">
        <div className="post-form-left-actions">
          <button
            type="button"
            className="post-form-attach-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={submitting}
          >
            <ImagePlus size={18} />
            Thêm tài liệu
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={FILE_ACCEPT}
            className="hidden-file-input"
            onChange={handleFileChange}
          />
          
          <label className="post-form-pin-checkbox">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              disabled={submitting}
            />
            <Pin size={14} />
            <span>Ghim bài đăng</span>
          </label>
        </div>

        <div className="post-form-right-actions">
          {isEditing && (
            <button
              type="button"
              className="btn-cancel"
              onClick={() => { setContent(initialPost?.content ?? ""); setPinned(initialPost?.pinned ?? false); setFiles([]); setError(""); setExistingAttachments(initialPost?.attachments ?? []); setDeleteAttachmentIds([]); onCancel?.(); }}
              disabled={submitting}
            >
              Hủy
            </button>
          )}
          <button type="submit" className="post-form-submit" disabled={submitting || !content.trim()}>
            {submitting ? "Đang đăng..." : isEditing ? "Lưu thay đổi" : "Đăng tin"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default PostForm;
