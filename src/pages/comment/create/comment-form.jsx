import { useState } from "react";
import { CreateCommentSchema } from "@/schema/comment.schema";

/**
 * @param {{
 *   postId: number,
 *   classroomId?: number,
 *   onSubmit: (data: { content: string, postId: number, classroomId?: number, parentId?: number }) => Promise<{ success: boolean, message?: string }>,
 *   submitting: boolean,
 *   initialComment?: { id: number, content: string } | null,
 *   onCancel?: () => void,
 *   parentId?: number,
 *   parentAuthorName?: string,
 * }} props
 */
const CommentForm = ({ postId, classroomId, onSubmit, submitting, initialComment = null, onCancel, parentId, parentAuthorName }) => {
  const [content, setContent] = useState(initialComment?.content ?? "");
  const [error, setError] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const isEditing = !!initialComment;
  const isReply = !!parentId;
  const shouldExpand = isExpanded || content.length > 0 || isEditing || isReply;
  const charCount = content.length;
  const maxChars = 500;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate using Zod schema
    const payload = { postId, content: content.trim() };
    if (classroomId != null) payload.classroomId = classroomId;
    if (parentId) payload.parentId = parentId;
    
    const validation = CreateCommentSchema.safeParse(payload);
    
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    const result = await onSubmit(payload);
    if (result?.success) {
      setContent("");
      setIsExpanded(false);
      onCancel?.();
    } else {
      setError(result?.message ?? "Không thể đăng bình luận. Vui lòng thử lại.");
    }
  };

  const handleCancel = () => {
    setContent(initialComment?.content ?? "");
    setError("");
    setIsExpanded(false);
    onCancel?.();
  };

  return (
    <form className={`comment-form ${shouldExpand ? 'expanded' : 'collapsed'}`} onSubmit={handleSubmit}>
      {shouldExpand && (
        <h3 className="comment-form-title">
          {parentId && parentAuthorName ? `Trả lời ${parentAuthorName}` : isEditing ? "Chỉnh sửa bình luận" : "Thêm bình luận"}
        </h3>
      )}
      <textarea
        className="comment-form-textarea"
        placeholder={shouldExpand ? "Nhập nội dung bình luận của bạn..." : "Viết bình luận..."}
        value={content}
        onFocus={() => setIsExpanded(true)}
        onChange={(e) => { 
          if (e.target.value.length <= maxChars) {
            setContent(e.target.value); 
            setError(""); 
          }
        }}
        rows={shouldExpand ? 3 : 1}
        disabled={submitting}
      />
      
      {error && <p className="comment-form-error">{error}</p>}
      
      {shouldExpand && (
        <div className="comment-form-footer">
          <span className={`comment-char-count ${charCount > maxChars ? 'limit-exceeded' : ''}`}>
            {charCount} / {maxChars}
          </span>
          <div className="comment-form-actions">
            {(isEditing || isReply || isExpanded) && (
              <button
                type="button"
                className="btn-cancel"
                onClick={handleCancel}
                disabled={submitting}
              >
                Hủy
              </button>
            )}
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={submitting || !content.trim() || charCount > maxChars}
            >
              {submitting ? "Đang đăng..." : isEditing ? "Lưu" : "Đăng bình luận"}
            </button>
          </div>
        </div>
      )}
    </form>
  );
};

export default CommentForm;
