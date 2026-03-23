import { useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import ClassroomDetailLayout from "@/components/ClassroomDetailLayout";
import usePosts from "@/hooks/use-posts";
import usePostMutations from "@/hooks/use-post";
import PostCard from "@/pages/post/list/post-card";
import PostForm from "@/pages/post/create/post-form";
import DeletePostDialog from "@/pages/post/delete/delete-post-dialog";
import "@/assets/css/pages/classroom/classroomFeed.css";
import "@/assets/css/pages/classroom/modals.css";

const ClassroomFeedPage = () => {
  const { id: classroomId } = useParams();

  const { posts, setPosts, loading, error, refetch } = usePosts(Number(classroomId));
  const { createPost, updatePost, submitting } = usePostMutations(setPosts);

  const [editingPost, setEditingPost] = useState(null);
  const [deleteConfirmPost, setDeleteConfirmPost] = useState(null);

  /* ── Handlers ─────────────────────────────────────────────────────────── */
  const handleCreate = async (data, files) => {
    const result = await createPost(data, files);
    if (result.success) {
      refetch();
    }
    return result;
  };

  const handleUpdate = async (data, files) => {
    const result = await updatePost(editingPost.id, data, files);
    if (result.success) {
      setEditingPost(null);
      refetch();
    }
    return result;
  };

  const handleDeleteSuccess = () => {
    setPosts((prev) => prev.filter((p) => p.id !== deleteConfirmPost?.id));
    setDeleteConfirmPost(null);
  };

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <ClassroomDetailLayout>
      <div className="classroom-feed">
      {/* Create post form */}
      <div className="post-form-wrapper">
        <PostForm
          key={classroomId}
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
        <DeletePostDialog
          post={deleteConfirmPost}
          onClose={() => setDeleteConfirmPost(null)}
          onSuccess={handleDeleteSuccess}
        />
      )}
      </div>
    </ClassroomDetailLayout>
  );
};

export default ClassroomFeedPage;
