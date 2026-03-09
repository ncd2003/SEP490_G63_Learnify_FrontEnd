import { memo } from "react";

/**
 * @param {{
 *   comment: {
 *     id: number,
 *     content: string,
 *     active?: boolean,
 *     authorName?: string,
 *     authorRole?: string,
 *     createdAt?: string,
 *   }
 * }} props
 */
const CommentCard = memo(({ comment }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('vi-VN', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const displayName = comment.authorName || "Người dùng";
  const role = comment.authorRole || null;

  return (
    <div className="comment-card">
      <div className="comment-header">
        <div className="comment-author-info">
          <span className="comment-author-name">{displayName}</span>
          {role && <span className="comment-author-role">({role})</span>}
        </div>
        {comment.createdAt && (
          <span className="comment-date">{formatDate(comment.createdAt)}</span>
        )}
      </div>
      <div className="comment-content">
        {comment.content}
      </div>
    </div>
  );
});

CommentCard.displayName = "CommentCard";

export default CommentCard;
