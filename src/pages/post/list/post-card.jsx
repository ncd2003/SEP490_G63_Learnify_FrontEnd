import { memo, useState } from "react";
import { Paperclip, Pin, MoreVertical, Pencil, Trash2, FileText, Image, Film, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatRelativeTime } from "@/lib/utils";
import useComments from "@/hooks/use-comments";
import useCommentMutations from "@/hooks/use-comment";
import CommentCard from "@/pages/comment/list/comment-card";
import CommentForm from "@/pages/comment/create/comment-form";

/**
 * Returns an icon based on file type string (e.g. "JPG", "PDF", "MP4")
 */
const AttachmentIcon = ({ fileType }) => {
  const type = fileType?.toUpperCase() ?? "";
  if (["JPG", "JPEG", "PNG", "GIF", "WEBP"].includes(type)) return <Image size={14} />;
  if (["MP4", "MOV", "AVI", "MKV"].includes(type)) return <Film size={14} />;
  return <FileText size={14} />;
};

/**
 * @param {{
 *   post: { id: number, content: string, pinned: boolean, attachments: { id:number, fileName:string, fileUrl:string, fileSize:number, fileType:string }[] },
 *   onEdit: (post: object) => void,
 *   onDelete: (post: object) => void,
 * }} props
 */
const PostCard = memo(({ post, onEdit, onDelete }) => {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [visibleCount, setVisibleCount] = useState(3);

  // Comment hooks
  const { comments, setComments, loading: loadingComments, refetch } = useComments(post.id);
  const { createComment, updateComment, deleteComment, submitting } = useCommentMutations(post.id, setComments);

  // Count total comments including all nested replies
  const countTotalComments = (commentsList) => {
    let total = 0;
    commentsList.forEach(comment => {
      total += 1; // Count this comment
      if (comment.replies && comment.replies.length > 0) {
        total += countTotalComments(comment.replies); // Recursively count replies
      }
    });
    return total;
  };

  const totalCommentCount = countTotalComments(comments);

  const handleCommentSubmit = async (data) => {
    const result = await createComment(data);
    // If it's a reply, refetch to get updated nested structure
    if (result?.success && data.parentId) {
      await refetch();
    }
    return result;
  };

  const handleCommentUpdate = async (commentId, content) => {
    const data = { content, postId: post.id };
    const result = await updateComment(commentId, data);
    if (result?.success) await refetch(); // Always refetch to be safe with nested
    return result;
  };

  const handleCommentDelete = async (commentId) => {
    const result = await deleteComment(commentId);
    if (result?.success) await refetch(); // Always refetch to be safe with nested
    return result;
  };

  return (
    <div className="post-card">
      {/* Header */}
      <div className="post-card-header">
        <div className="post-author">
          <div className="post-author-avatar">
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt={user.fullName} />
              : <span>{user?.fullName?.charAt(0)?.toUpperCase() ?? "?"}</span>
            }
          </div>
          <div className="post-author-info">
            <div className="post-author-header">
              <span className="post-author-name">{user?.fullName ?? "Giáo viên"}</span>
              {post.createdAt && (
                <span className="post-created-time">{formatRelativeTime(post.createdAt)}</span>
              )}
            </div>
            {post.pinned && (
              <span className="post-pinned-badge">
                <Pin size={11} />
                Đã ghim
              </span>
            )}
          </div>
        </div>

        {/* Actions menu */}
        <div className="post-menu-wrapper">
          <button className="post-menu-trigger" onClick={() => setMenuOpen((o) => !o)}>
            <MoreVertical size={18} />
          </button>
          {menuOpen && (
            <>
              <div className="menu-backdrop" onClick={() => setMenuOpen(false)} />
              <div className="action-menu">
                <button
                  className="action-menu-item"
                  onClick={() => { setMenuOpen(false); onEdit(post); }}
                >
                  <Pencil size={14} />
                  <span>Chỉnh sửa</span>
                </button>
                <button
                  className="action-menu-item danger"
                  onClick={() => { setMenuOpen(false); onDelete(post); }}
                >
                  <Trash2 size={14} />
                  <span>Xóa bài đăng</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="post-content">{post.content}</p>

      {/* Attachments */}
      {post.attachments?.length > 0 && (
        <div className="post-attachments">
          {post.attachments.map((att) => (
            <a
              key={att.id}
              href={att.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="post-attachment-chip"
            >
              <AttachmentIcon fileType={att.fileType} />
              <span className="post-attachment-name">{att.fileName}</span>
              <span className="post-attachment-size">
                {att.fileSize < 1024
                  ? `${att.fileSize.toFixed(1)} KB`
                  : `${(att.fileSize / 1024).toFixed(1)} MB`}
              </span>
            </a>
          ))}
        </div>
      )}

      {/* Comments section */}
      <div className="post-comments-section">
        <button 
          className="post-comments-toggle"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle size={16} />
          {totalCommentCount} bình luận
        </button>

        {showComments && (
          <div className="post-comments-content">
            {/* Comment list */}
            {loadingComments ? (
              <div className="comments-loading">Đang tải bình luận...</div>
            ) : comments.length > 0 ? (
              <div className="comments-list">
                <div className="comments-header">Bình luận ({totalCommentCount})</div>
                {comments.slice(0, visibleCount).map((comment) => (
                  <CommentCard 
                    key={comment.id} 
                    comment={comment}
                    postId={post.id}
                    onReply={handleCommentSubmit}
                    onEdit={handleCommentUpdate}
                    onDelete={handleCommentDelete}
                    submitting={submitting}
                  />
                ))}
                
                {visibleCount < comments.length && (
                  <button 
                    className="comments-load-more" 
                    onClick={() => setVisibleCount(prev => prev + 3)}
                  >
                    Xem thêm bình luận
                  </button>
                )}
              </div>
            ) : null}

            {/* Comment form */}
            <CommentForm
              postId={post.id}
              onSubmit={handleCommentSubmit}
              submitting={submitting}
              onCancel={() => setShowComments(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
});

PostCard.displayName = "PostCard";

export default PostCard;
