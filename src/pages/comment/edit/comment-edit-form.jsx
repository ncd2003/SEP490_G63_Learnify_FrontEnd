import { useState } from "react";
import { CreateCommentSchema } from "@/schema/comment.schema";
import { z } from "zod";

/**
 * @param {{
 *   comment: { id: number, content: string },
 *   onSubmit: (content: string) => Promise<{ success: boolean, message?: string }>,
 *   onCancel: () => void,
 *   submitting: boolean,
 * }} props
 */
const EditCommentForm = ({ comment, onSubmit, onCancel, submitting }) => {
  const [content, setContent] = useState(comment.content);
  const [error, setError] = useState("");
  
  const charCount = content.length;
  const maxChars = 500;

  // Define schema specifically for content update
  const UpdateSchema = z.object({
    content: z.string().trim().min(1, "Nội dung bình luận không được để trống").max(500, "Bình luận tối đa 500 ký tự"),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validation = UpdateSchema.safeParse({ content });
    
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    // Call onSubmit with just content string, as expected by parent handler
    const result = await onSubmit(content);
    if (!result?.success) {
      setError(result?.message ?? "Không thể cập nhật bình luận. Vui lòng thử lại.");
    }
    // Success case is handled by parent (closing form)
  };

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      <h3 className="comment-form-title">Chỉnh sửa bình luận</h3>
      <textarea
        className="comment-form-textarea"
        placeholder="Nhập nội dung bình luận..."
        value={content}
        onChange={(e) => { 
          if (e.target.value.length <= maxChars) {
            setContent(e.target.value); 
            setError(""); 
          }
        }}
        rows={3}
        disabled={submitting}
        autoFocus
      />
      
      {error && <p className="comment-form-error">{error}</p>}
      
      <div className="comment-form-footer">
        <span className={`comment-char-count ${charCount > maxChars ? 'limit-exceeded' : ''}`}>
          {charCount} / {maxChars}
        </span>
        <div className="comment-form-actions">
          <button
            type="button"
            className="btn-cancel" // Assuming global class or style match
            onClick={onCancel}
            disabled={submitting}
            style={{ 
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              background: '#fff',
              color: '#374151',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Hủy
          </button>
          <button 
            type="submit" 
            className="btn-primary" // Assuming global class or style match
            disabled={submitting || !content.trim() || charCount > maxChars}
            style={{ 
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              background: '#4f46e5',
              color: '#fff',
              cursor: submitting || !content.trim() ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              opacity: submitting || !content.trim() ? 0.6 : 1
            }}
          >
            {submitting ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default EditCommentForm;
