import { useState, useRef } from "react";
import { ImagePlus, X, Paperclip } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * @param {{
 *   classroomId: number,
 *   onSubmit: (data: { classroomId: number, content: string }, files: File[]) => Promise<{ success: boolean, message?: string }>,
 *   submitting: boolean,
 *   initialPost?: { id: number, content: string } | null,
 *   onCancel?: () => void,
 * }} props
 */
const PostForm = ({ classroomId, onSubmit, submitting, initialPost = null, onCancel }) => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [content, setContent] = useState(initialPost?.content ?? "");
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");

  const isEditing = !!initialPost;

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files ?? []);
    setFiles((prev) => [...prev, ...selected]);
    // Reset input so re-selecting same file works
    e.target.value = "";
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!content.trim()) {
      setError("Nội dung bài đăng không được để trống.");
      return;
    }

    const result = await onSubmit({ classroomId, content: content.trim() }, files);
    if (result?.success) {
      setContent("");
      setFiles([]);
      onCancel?.();
    } else {
      setError(result?.message ?? "Không thể đăng bài. Vui lòng thử lại.");
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
          className="post-form-textarea"
          placeholder={isEditing ? "Chỉnh sửa nội dung bài đăng..." : "Nhập nội dung thảo luận với lớp học..."}
          value={content}
          onChange={(e) => { setContent(e.target.value); setError(""); }}
          rows={2}
          disabled={submitting}
        />
      </div>

      {error && <p className="post-form-error">{error}</p>}

      {/* File chips */}
      {files.length > 0 && (
        <div className="post-form-files">
          {files.map((f, i) => (
            <span key={i} className="post-form-file-chip">
              <Paperclip size={12} />
              {f.name}
              <button type="button" onClick={() => removeFile(i)} disabled={submitting}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Divider */}
      <div className="post-form-divider" />

      {/* Bottom actions */}
      <div className="post-form-actions">
        <button
          type="button"
          className="post-form-attach-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={submitting}
        >
          <ImagePlus size={18} />
          Thêm hình ảnh
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden-file-input"
          onChange={handleFileChange}
        />

        <div className="post-form-right-actions">
          {isEditing && (
            <button
              type="button"
              className="btn-cancel"
              onClick={() => { setContent(initialPost.content); setFiles([]); setError(""); onCancel?.(); }}
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
