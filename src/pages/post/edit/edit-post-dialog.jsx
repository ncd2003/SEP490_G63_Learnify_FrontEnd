import { useState } from "react";
import { X } from "lucide-react";
import PostForm from "@/pages/post/create/post-form";
import { postApi } from "@/apis/post.api";
import "@/assets/css/pages/classroom/modals.css";

/**
 * Modal dialog to edit an existing post.
 *
 * @param {Object} props
 * @param {{ id: number, content: string, pinned: boolean, attachments?: { id: number, fileName: string, fileUrl: string, fileSize: number, fileType: string }[] }} props.post
 * @param {number} props.classroomId
 * @param {() => void} [props.onClose]
 * @param {(updatedPost: object) => void} [props.onSuccess]
 */
const EditPostDialog = ({ post, classroomId, onClose, onSuccess }) => {
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!post) return null;

  const handleSubmit = async (data, files) => {
    setServerError("");
    setSubmitting(true);
    try {
      const response = await postApi.updatePost(post.id, data, files);
      onSuccess?.(response.result);
      onClose?.();
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message ?? "Cập nhật bài đăng thất bại.";
      setServerError(message);
      return { success: false, message };
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal-container modal-small">
        <div className="modal-header">
          <h2 className="modal-title">Chỉnh sửa bài đăng</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {serverError && <p className="modal-error-alert">{serverError}</p>}
          <PostForm
            classroomId={classroomId}
            initialPost={post}
            onSubmit={handleSubmit}
            submitting={submitting}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
};

export default EditPostDialog;
