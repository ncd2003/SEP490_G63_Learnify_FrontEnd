import { useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import ClassroomDetailLayout from "@/components/ClassroomDetailLayout";
import usePosts from "@/hooks/use-posts";
import usePostMutations from "@/hooks/use-post";
import PostCard from "@/pages/post/list/post-card";
import PostForm from "@/pages/post/create/post-form";
import "@/assets/css/pages/classroom/classroomFeed.css";
import "@/assets/css/pages/classroom/modals.css";

const ClassroomFeedPage = () => {
  const { id: classroomId } = useParams();

  const { posts, setPosts, loading, error, refetch } = usePosts(Number(classroomId));
  const { createPost, updatePost, deletePost, submitting } = usePostMutations(setPosts);

  const [editingPost, setEditingPost] = useState(null);
  const [deleteConfirmPost, setDeleteConfirmPost] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  /* ── Handlers ─────────────────────────────────────────────────────────── */
  const handleCreate = async (data, files) => {
    return await createPost(data, files);
  };

  const handleUpdate = async (data, files) => {
    const result = await updatePost(editingPost.id, data, files);
    if (result.success) setEditingPost(null);
    return result;
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    setDeleteError("");
    const result = await deletePost(deleteConfirmPost.id);
    if (result.success) {
      setDeleteConfirmPost(null);
    } else {
      setDeleteError(result.message ?? "Xóa bài đăng thất bại.");
    }
    setDeleting(false);
  };

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <ClassroomDetailLayout>
      <div className="classroom-feed">
      {/* Create post form */}
      <div className="post-form-wrapper">
        <PostForm
          classroomId={Number(classroomId)}
          onSubmit={handleCreate}
          submitting={submitting}
        />
      </div>

      {/* Post list */}
      <div className="post-list">
        {loading ? (
          <div className="feed-state">
            <Loader2 size={24} className="feed-state-icon spinning" />
            <span>Đang tải bài đăng...</span>
          </div>
        ) : error ? (
          <div className="feed-state feed-state--error">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button className="btn-secondary" onClick={refetch}>Thử lại</button>
          </div>
        ) : posts.length === 0 ? (
          <div className="feed-state">
            <p>Chưa có bài đăng nào trong lớp học này.</p>
          </div>
        ) : (
          posts.map((post) =>
            editingPost?.id === post.id ? (
              <div key={post.id} className="post-card">
                <PostForm
                  classroomId={Number(classroomId)}
                  initialPost={editingPost}
                  onSubmit={handleUpdate}
                  submitting={submitting}
                  onCancel={() => setEditingPost(null)}
                />
              </div>
            ) : (
              <PostCard
                key={post.id}
                post={post}
                onEdit={setEditingPost}
                onDelete={setDeleteConfirmPost}
              />
            )
          )
        )}
      </div>

      {/* Delete confirm dialog */}
      {deleteConfirmPost && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setDeleteConfirmPost(null)}>
          <div className="modal-container modal-small">
            <div className="modal-header">
              <h2 className="modal-title">Xóa bài đăng</h2>
            </div>
            <div className="modal-body">
              <p className="delete-message">
                Bạn có chắc muốn xóa bài đăng này không? Hành động này không thể hoàn tác.
              </p>
              {deleteError && <p className="modal-error-alert">{deleteError}</p>}
            </div>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => { setDeleteConfirmPost(null); setDeleteError(""); }}
                disabled={deleting}
              >
                Hủy
              </button>
              <button className="btn-danger" onClick={handleDeleteConfirm} disabled={deleting}>
                {deleting ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </ClassroomDetailLayout>
  );
};

export default ClassroomFeedPage;
