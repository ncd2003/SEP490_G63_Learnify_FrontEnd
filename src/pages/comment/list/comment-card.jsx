import { memo, useState } from "react";
import { MessageCircle } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import CommentForm from "@/pages/comment/create/comment-form";

/**
 * @param {{
 *   comment: {
 *     id: number,
 *     content: string,
 *     active?: boolean,
 *     authorName?: string,
 *     authorRole?: string,
 *     createdAt?: string,
 *     replies?: Array,
 *   },
 *   postId: number,
 *   onReply: (data: { content: string, parentId: number }) => Promise<{ success: boolean, message?: string }>,
 *   submitting: boolean,
 *   depth?: number,
 * }} props
 */
const CommentCard = memo(({ comment, postId, onReply, submitting, depth = 0 }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const maxDepth = 3; // Giới hạn độ sâu nested comments

  const handleReplySubmit = async (data) => {
    const result = await onReply(data);
    if (result?.success) {
      setShowReplyForm(false);
    }
    return result;
  };

  const displayName = comment.authorName || "Người dùng";
  const role = comment.authorRole || null;
  const hasReplies = comment.replies && comment.replies.length > 0;

  return (
    <div className="comment-card" style={{ marginLeft: depth > 0 ? '24px' : '0' }}>
      <div className="comment-header">
        <div className="comment-author-info">
          <span className="comment-author-name">{displayName}</span>
          {role && <span className="comment-author-role">({role})</span>}
          {comment.createdAt && (
            <span className="comment-date">{formatRelativeTime(comment.createdAt)}</span>
          )}
        </div>
      </div>
      <div className="comment-content">
        {comment.content}
      </div>
      
      {/* Reply button */}
      {depth < maxDepth && (
        <button 
          className="comment-reply-btn"
          onClick={() => setShowReplyForm(!showReplyForm)}
        >
          <MessageCircle size={14} />
          Trả lời
        </button>
      )}

      {/* Reply form */}
      {showReplyForm && (
        <div className="comment-reply-form">
          <CommentForm
            postId={postId}
            parentId={comment.id}
            parentAuthorName={displayName}
            onSubmit={handleReplySubmit}
            submitting={submitting}
            onCancel={() => setShowReplyForm(false)}
          />
        </div>
      )}

      {/* Nested replies */}
      {hasReplies && (
        <div className="comment-replies">
          {comment.replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              postId={postId}
              onReply={onReply}
              submitting={submitting}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
});

CommentCard.displayName = "CommentCard";

export default CommentCard;
