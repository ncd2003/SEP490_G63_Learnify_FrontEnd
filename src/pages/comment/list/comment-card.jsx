import { memo, useState } from "react";
import { MessageCircle, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatRelativeTime } from "@/lib/utils";
import CommentForm from "@/pages/comment/create/comment-form";
import EditCommentForm from "@/pages/comment/edit/comment-edit-form";
import DeleteCommentDialog from "@/pages/comment/delete/delete-comment-dialog";

const REPLIES_BATCH_SIZE = 5;

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
 *     user: { id: number, name: string }
 *   },
 *   postId: number,
 *   classroomId?: number,
 *   onReply: (data: { content: string, parentId: number }) => Promise<{ success: boolean, message?: string }>,
 *   onEdit?: (commentId: number, content: string) => Promise<{ success: boolean, message?: string }>,
 *   onDelete?: (commentId: number) => Promise<{ success: boolean, message?: string }>,
 *   submitting: boolean,
 *   depth?: number,
 * }} props
 */
const CommentCard = memo(({ comment, postId, classroomId, onReply, onEdit, onDelete, submitting, depth = 0 }) => {
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [visibleRepliesCount, setVisibleRepliesCount] = useState(REPLIES_BATCH_SIZE);
  const maxDepth = 3; // Giới hạn độ sâu nested comments

  const isAuthor = user?.id === comment.user?.id;


  const handleReplySubmit = async (data) => {
    const result = await onReply(data);
    if (result?.success) {
      setShowReplyForm(false);
    }
    return result;
  };

  const handleEditSubmit = async (content) => {
    if (!onEdit) return { success: false };
    const result = await onEdit(comment.id, content);
    if (result?.success) {
      setIsEditing(false);
    }
    return result;
  };

  const handleOpenDelete = () => {
    setMenuOpen(false);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    await onDelete(comment.id);
    // Modal will close automatically due to unmounting or parent state change, 
    // but better to manage local state cleanly
    setIsDeleting(false);
    setIsDeleteModalOpen(false);
  };

  const displayName =  comment.user?.fullName || "Người dùng";
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

        {/* Actions Menu */}
        {isAuthor && !isEditing && (
          <div className="comment-actions">
            <button className="comment-menu-trigger" onClick={() => setMenuOpen(!menuOpen)}>
              <MoreVertical size={14} />
            </button>
            {menuOpen && (
              <>
                <div className="menu-backdrop" onClick={() => setMenuOpen(false)} />
                <div className="action-menu">
                  <button
                    className="action-menu-item"
                    onClick={() => { setMenuOpen(false); setIsEditing(true); }}
                  >
                    <Pencil size={14} />
                    <span>Chỉnh sửa</span>
                  </button>
                  <button
                    className="action-menu-item danger"
                    onClick={() => { setMenuOpen(false); handleOpenDelete(); }}
                  >
                    <Trash2 size={14} />
                    <span>Xóa</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <DeleteCommentDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      {isEditing ? (
        <EditCommentForm
          comment={comment}
          submitting={submitting}
          onSubmit={handleEditSubmit}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <div className="comment-content">
          {comment.content}
        </div>
      )}

      {/* Reply button */}
      {!isEditing && depth < maxDepth && (
        <button
          className="comment-reply-btn"
          onClick={() => setShowReplyForm(!showReplyForm)}
        >
          <MessageCircle size={14} />
          <span>Trả lời</span>
        </button>
      )}

      {/* Reply form */}
      {showReplyForm && (
        <div className="comment-reply-form">
          <CommentForm
            postId={postId}
            classroomId={classroomId}
            parentId={comment.id}
            parentAuthorName={displayName || null}
            onSubmit={handleReplySubmit}
            submitting={submitting}
            onCancel={() => setShowReplyForm(false)}
          />
        </div>
      )}

      {/* Nested replies */}
      {hasReplies && (
        <div style={{ marginTop: '8px' }}>
          <button
            className="comment-replies-toggle"
            onClick={() => {
              if (!showReplies) setVisibleRepliesCount(REPLIES_BATCH_SIZE);
              setShowReplies(!showReplies);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#6366f1',
              fontSize: '13px',
              cursor: 'pointer',
              padding: '0',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {showReplies ? "Ẩn câu trả lời" : `Xem ${comment.replies.length} câu trả lời`}
          </button>

          {showReplies && (
            <div className="comment-replies" style={{ marginTop: '12px' }}>
              {comment.replies.slice(0, visibleRepliesCount).map((reply) => (
                <CommentCard
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  classroomId={classroomId}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  submitting={submitting}
                  depth={depth + 1}
                />
              ))}

              {visibleRepliesCount < comment.replies.length && (
                <button
                  onClick={() => setVisibleRepliesCount(prev => prev + REPLIES_BATCH_SIZE)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#6b7280',
                    fontSize: '12px',
                    cursor: 'pointer',
                    marginTop: '8px',
                    padding: '4px',
                    fontWeight: 500
                  }}
                >
                  Xem thêm câu trả lời...
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

CommentCard.displayName = "CommentCard";

export default CommentCard;
