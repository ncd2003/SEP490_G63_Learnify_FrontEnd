import { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, AlertCircle, Filter } from "lucide-react";
import ClassroomDetailLayout from "@/components/ClassroomDetailLayout";
import { useAuth } from "@/contexts/AuthContext";
import usePosts from "@/hooks/use-posts";
import usePostMutations from "@/hooks/use-post";
import { isStudentRole } from "@/lib/auth-role";
import PostCard from "@/pages/post/list/post-card";
import PostForm from "@/pages/post/create/post-form";
import DeletePostDialog from "@/pages/post/delete/delete-post-dialog";
import "@/assets/css/pages/classroom/classroomFeed.css";
import "@/assets/css/pages/classroom/modals.css";

const ClassroomFeedPage = () => {
  const { id: classroomId } = useParams();
  const { user } = useAuth();
  const canCreatePost = !isStudentRole(user?.role);

  const { posts, setPosts, loading, error, refetch } = usePosts(Number(classroomId));
  const { createPost, updatePost, submitting } = usePostMutations(setPosts);

  const [editingPost, setEditingPost] = useState(null);
  const [deleteConfirmPost, setDeleteConfirmPost] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [onlyHasAttachments, setOnlyHasAttachments] = useState(false);

  /* ── Handlers ─────────────────────────────────────────────────────────── */
  const handleCreate = async (data, files) => {
    const result = await createPost(data, files);
    return result;
  };

  const handleUpdate = async (data, files) => {
    const result = await updatePost(editingPost.id, data, files);
    if (result.success) {
      setEditingPost(null);
    }
    return result;
  };

  const handleDeleteSuccess = () => {
    setPosts((prev) => prev.filter((p) => p.id !== deleteConfirmPost?.id));
    setDeleteConfirmPost(null);
  };

  const matchesFilter = useCallback((post) => {
    const q = searchText.trim().toLowerCase();
    if (q && !post.content?.toLowerCase().includes(q)) return false;
    if (onlyHasAttachments && !(post.attachments?.length > 0)) return false;
    return true;
  }, [searchText, onlyHasAttachments]);

  const { pinnedPosts, regularPosts } = useMemo(() => {
    const pinned = [];
    const regular = [];
    (posts || []).forEach((p) => {
      if (p.pinned) pinned.push(p);
      else regular.push(p);
    });
    return {
      pinnedPosts: pinned.filter(matchesFilter),
      regularPosts: regular.filter(matchesFilter),
    };
  }, [posts, matchesFilter]);

  const allPostsForMain = useMemo(() => [...pinnedPosts, ...regularPosts], [pinnedPosts, regularPosts]);

  const scrollToPost = (postId) => {
    const el = document.getElementById(`post-${postId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <ClassroomDetailLayout>
      <div className="classroom-feed feed-three-col">
        <div className="feed-col pinned-col">
          <div className="feed-card">
            <div className="feed-card-header">
              <span>Đã ghim</span>
            </div>
            {loading ? (
              <div className="feed-state">
                <Loader2 size={20} className="feed-state-icon spinning" />
                <span>Đang tải...</span>
              </div>
            ) : error ? (
              <div className="feed-state feed-state--error">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            ) : pinnedPosts.length === 0 ? (
              <div className="feed-state">
                <span>Chưa có bài đăng ghim.</span>
              </div>
            ) : (
              <div className="post-list pinned-list">
                {pinnedPosts.map((post) => (
                  <button
                    key={post.id}
                    type="button"
                    className="pinned-summary"
                    onClick={() => scrollToPost(post.id)}
                  >
                    <span className="pinned-summary-title">{post.content?.slice(0, 80) || "(Không có nội dung)"}</span>
                    <span className="pinned-summary-meta">
                      {(post.attachments?.length ?? 0) > 0 ? `${post.attachments.length} tệp đính kèm` : "Không có tệp"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="feed-col main-col">
          {canCreatePost && (
            <div className="post-form-wrapper">
              <PostForm
                key={classroomId}
                classroomId={Number(classroomId)}
                onSubmit={handleCreate}
                submitting={submitting}
              />
            </div>
          )}

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
            ) : allPostsForMain.length === 0 ? (
              <div className="feed-state">
                <p>Không có bài đăng phù hợp.</p>
              </div>
            ) : (
              allPostsForMain.map((post) =>
                editingPost?.id === post.id ? (
                  <div key={post.id} className="post-card" id={`post-${post.id}`}>
                    <PostForm
                      classroomId={Number(classroomId)}
                      initialPost={editingPost}
                      onSubmit={handleUpdate}
                      submitting={submitting}
                      onCancel={() => setEditingPost(null)}
                    />
                  </div>
                ) : (
                  <div key={post.id} id={`post-${post.id}`} className="post-card-wrapper">
                    <PostCard
                      post={post}
                      onEdit={setEditingPost}
                      onDelete={setDeleteConfirmPost}
                    />
                  </div>
                )
              )
            )}
          </div>
        </div>

        <div className="feed-col filter-col">
          <div className="feed-card">
            <div className="feed-card-header">
              <span>Bộ lọc</span>
              <Filter size={16} />
            </div>
            <div className="filter-group">
              <label className="filter-label" htmlFor="search-text">Tìm kiếm nội dung</label>
              <input
                id="search-text"
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Nhập từ khóa..."
                className="filter-input"
              />
            </div>
            <div className="filter-group filter-checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={onlyHasAttachments}
                  onChange={(e) => setOnlyHasAttachments(e.target.checked)}
                />
                <span>Chỉ hiển thị bài có tệp đính kèm</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirm dialog */}
      {deleteConfirmPost && (
        <DeletePostDialog
          post={deleteConfirmPost}
          onClose={() => setDeleteConfirmPost(null)}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </ClassroomDetailLayout>
  );
};

export default ClassroomFeedPage;
