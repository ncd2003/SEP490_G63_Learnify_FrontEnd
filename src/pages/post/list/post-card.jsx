import { memo, useMemo, useState } from "react";
import { Pin, MoreVertical, Pencil, Trash2, FileText, Image, Film, MessageCircle, X } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import useComments from "@/hooks/use-comments";
import useCommentMutations from "@/hooks/use-comment";
import CommentCard from "@/pages/comment/list/comment-card";
import CommentForm from "@/pages/comment/create/comment-form";

/**
 * Returns an icon based on file type string (e.g. "JPG", "PDF", "MP4")
 */
const AttachmentIcon = ({ fileType }) => {
  const type = fileType?.toUpperCase() ?? "";
  if (["JPG", "JPEG", "PNG", "GIF"].includes(type)) return <Image size={14} />;
  if (["MP4", "MOV", "AVI", "MKV"].includes(type)) return <Film size={14} />;
  return <FileText size={14} />;
};

const MAX_MEDIA_PREVIEW = 6;
const COMMENTS_BATCH_SIZE = 5;

const sortCommentsByDate = (commentList, order) => {
  const safeTime = (value) => {
    const time = Date.parse(value ?? "");
    return Number.isNaN(time) ? 0 : time;
  };

  return [...commentList].sort((a, b) => {
    const aTime = safeTime(a.createdAt);
    const bTime = safeTime(b.createdAt);
    return order === "oldest" ? aTime - bTime : bTime - aTime;
  });
};

/**
 * @param {{
 *   post: { id: number, content: string, pinned: boolean, attachments: { id:number, fileName:string, fileUrl:string, fileSize:number, fileType:string }[] },
 *   classroomId?: number | null,
 *   onEdit: (post: object) => void,
 *   onDelete: (post: object) => void,
 * }} props
 */
const PostCard = memo(({ post, classroomId = null, onEdit, onDelete }) => {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [visibleCount, setVisibleCount] = useState(COMMENTS_BATCH_SIZE);
  const [commentSortOrder, setCommentSortOrder] = useState("newest");
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const isOptimisticPost = Boolean(post?.isOptimistic);
  const commentsPostId = isOptimisticPost ? null : post.id;

  // Determine classroomId from post if available
  const commentsClassroomId = post?.classroomId ?? post?.classroom?.id ?? classroomId ?? null;

  // Comment hooks
  const { comments, setComments, loading: loadingComments, refetch } = useComments(commentsPostId, commentsClassroomId);
  const { createComment, updateComment, deleteComment, submitting } = useCommentMutations(
    commentsPostId,
    commentsClassroomId,
    setComments
  );

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

  const mediaExtensions = useMemo(
    () => new Set(["JPG", "JPEG", "PNG", "GIF", "MP4", "MOV", "AVI"]),
    []
  );

  const mediaAttachments = useMemo(
    () => (post.attachments ?? []).filter((att) => mediaExtensions.has(att.fileType?.toUpperCase?.() ?? "")),
    [post.attachments, mediaExtensions]
  );

  const fileAttachments = useMemo(
    () => (post.attachments ?? []).filter((att) => !mediaExtensions.has(att.fileType?.toUpperCase?.() ?? "")),
    [post.attachments, mediaExtensions]
  );

  const previewMedia = mediaAttachments.slice(0, MAX_MEDIA_PREVIEW);
  const remainingMediaCount = Math.max(0, mediaAttachments.length - previewMedia.length);

  const sortedComments = useMemo(
    () => sortCommentsByDate(comments ?? [], commentSortOrder),
    [comments, commentSortOrder]
  );

  const handleCommentSubmit = async (data) => {
    const payload = {
      ...data,
      classroomId: data?.classroomId ?? commentsClassroomId,
    };

    const result = await createComment(payload);
    // If it's a reply, ensure list stays updated without losing scroll. No refetch needed now.
    if (result?.success && !data.parentId) {
      // Make sure the freshly added top-level comment is visible
      setVisibleCount((prev) => prev + 1);
    }
    return result;
  };

  const handleCommentUpdate = async (commentId, content) => {
    const data = { content, postId: post.id, classroomId: commentsClassroomId };
    const result = await updateComment(commentId, data);
    if (result?.success) await refetch(); // Always refetch to be safe with nested
    return result;
  };

  const handleCommentDelete = async (commentId) => {
    const result = await deleteComment(commentId);
    if (result?.success) await refetch(); // Always refetch to be safe with nested
    return result;
  };

  const postOwnerId = post.user?.id ?? post.userId ?? post.authorId ?? post.createdBy?.id;
  const canManagePost =
    !isOptimisticPost && user?.id != null && postOwnerId != null && String(user.id) === String(postOwnerId);

  const authorName = post.user?.fullName || post.user?.name || "Người dùng";
  const authorInitial = authorName?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className={`post-card${isOptimisticPost ? " post-card--optimistic" : ""}`}>
      {/* Header */}
      <div className="post-card-header">
        <div className="post-author">
          <div className="post-author-avatar">
            {post.user?.avatarUrl
              ? <img src={post.user.avatarUrl} alt={authorName} />
              : <span>{authorInitial}</span>
            }
          </div>
          <div className="post-author-info">
            <div className="post-author-header">
              <span className="post-author-name">{authorName}</span>
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
            {isOptimisticPost && <span className="post-syncing-badge">Đang đồng bộ...</span>}
          </div>
        </div>

        {/* Actions menu */}
        {canManagePost && (
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
        )}
      </div>

      {/* Content */}
      <p className="post-content">{post.content}</p>

      {/* Media preview */}
      {mediaAttachments.length > 0 && (
        <div className="post-media-grid" onClick={() => setMediaModalOpen(true)}>
          {previewMedia.map((att, index) => {
            const isLastTile = index === previewMedia.length - 1 && remainingMediaCount > 0;
            const type = att.fileType?.toUpperCase?.() ?? "";
            const isVideo = ["MP4", "MOV", "AVI"].includes(type);
            return (
              <div key={att.id} className="media-tile">
                {isVideo ? (
                  <video className="media-thumb" src={att.fileUrl} muted playsInline preload="metadata" />
                ) : (
                  <img className="media-thumb" src={att.fileUrl} alt={att.fileName} loading="lazy" />
                )}
                {isLastTile && (
                  <div className="media-overlay">+{remainingMediaCount}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* File attachments */}
      {fileAttachments.length > 0 && (
        <div className="post-attachments">
          {fileAttachments.map((att) => (
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
        {isOptimisticPost ? (
          <p className="post-syncing-note">Bài đăng đang đồng bộ, bình luận sẽ khả dụng sau khi hoàn tất.</p>
        ) : (
          <>
            <button
              className="post-comments-toggle"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle size={16} />
              {totalCommentCount} bình luận
            </button>

            {showComments && (
              <div className="post-comments-content">
                {/* Comment form at top */}
                <CommentForm
                  postId={post.id}
                  classroomId={commentsClassroomId}
                  onSubmit={handleCommentSubmit}
                  submitting={submitting}
                  onCancel={() => setShowComments(false)}
                />

                {/* Comment list */}
                {loadingComments ? (
                  <div className="comments-loading">Đang tải bình luận...</div>
                ) : comments.length > 0 ? (
                  <>
                    <div className="comments-tools">
                      <label className="comments-sort-label" htmlFor={`comments-sort-${post.id}`}>
                        Sắp xếp
                      </label>
                      <select
                        id={`comments-sort-${post.id}`}
                        className="comments-sort-select"
                        value={commentSortOrder}
                        onChange={(e) => {
                          setCommentSortOrder(e.target.value);
                          setVisibleCount(COMMENTS_BATCH_SIZE);
                        }}
                      >
                        <option value="newest">Mới nhất</option>
                        <option value="oldest">Cũ nhất</option>
                      </select>
                    </div>

                    <div className="comments-list">
                      {/* <div className="comments-header">Bình luận ({totalCommentCount})</div> */}
                      {sortedComments.slice(0, visibleCount).map((comment) => (
                        <CommentCard
                          key={comment.id}
                          comment={comment}
                          postId={post.id}
                          classroomId={commentsClassroomId}
                          onReply={handleCommentSubmit}
                          onEdit={handleCommentUpdate}
                          onDelete={handleCommentDelete}
                          submitting={submitting}
                        />
                      ))}

                      {visibleCount < sortedComments.length && (
                        <button
                          className="comments-load-more"
                          onClick={() => setVisibleCount((prev) => prev + COMMENTS_BATCH_SIZE)}
                        >
                          Xem thêm bình luận
                        </button>
                      )}
                    </div>
                  </>
                ) : null}
              </div>
            )}
          </>
        )}
      </div>

      {/* Media modal */}
      {mediaModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setMediaModalOpen(false)}>
          <div className="modal-container modal-large">
            <div className="modal-header">
              <h3 className="modal-title">Tệp đính kèm</h3>
              <button className="modal-close-btn" onClick={() => setMediaModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              {mediaAttachments.length > 0 && (
                <div className="media-detail-grid">
                  {mediaAttachments.map((att) => {
                    const type = att.fileType?.toUpperCase?.() ?? "";
                    const isVideo = ["MP4", "MOV", "AVI"].includes(type);
                    return (
                      <div
                        key={att.id}
                        className="media-detail-item"
                        onClick={() => setSelectedMedia(att)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === "Enter") setSelectedMedia(att); }}
                      >
                        {isVideo ? (
                          <video controls className="media-detail" src={att.fileUrl} preload="metadata" />
                        ) : (
                          <img className="media-detail" src={att.fileUrl} alt={att.fileName} loading="lazy" />
                        )}
                        <div className="media-detail-name">{att.fileName}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {fileAttachments.length > 0 && (
                <div className="post-attachments post-attachments--modal">
                  {fileAttachments.map((att) => (
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
            </div>
          </div>
        </div>
      )}

      {selectedMedia && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setSelectedMedia(null)}>
          <div className="modal-container modal-large">
            <div className="modal-header">
              <h3 className="modal-title">{selectedMedia.fileName}</h3>
              <button className="modal-close-btn" onClick={() => setSelectedMedia(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {(() => {
                const type = selectedMedia.fileType?.toUpperCase?.() ?? "";
                const isVideo = ["MP4", "MOV", "AVI"].includes(type);
                if (isVideo) {
                  return <video controls style={{ width: "100%", maxHeight: 520 }} src={selectedMedia.fileUrl} preload="metadata" />;
                }
                return <img style={{ width: "100%", maxHeight: 520, objectFit: "contain" }} src={selectedMedia.fileUrl} alt={selectedMedia.fileName} loading="lazy" />;
              })()}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 13, color: "#4b5563" }}>{selectedMedia.fileType}</span>
                {/* <a href={selectedMedia.fileUrl} target="_blank" rel="noopener noreferrer" className="post-attachment-chip">
                  <AttachmentIcon fileType={selectedMedia.fileType} />
                  <span className="post-attachment-name">Mở trong tab mới</span>
                </a> */}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

PostCard.displayName = "PostCard";

export default PostCard;
