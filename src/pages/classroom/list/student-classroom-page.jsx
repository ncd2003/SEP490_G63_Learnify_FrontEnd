import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { BookOpen, Plus, Search, Loader2, MoreVertical, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { enrollmentApi } from "@/apis/enrollment.api";
import useDebounce from "@/hooks/use-debounce";
import JoinClassModal from "@/pages/classroom/search/join-class-modal";
import { PATH_STUDENT } from "@/routes/paths";
import "@/assets/css/pages/classroom/studentClassroom.css";

const StudentClassroomPage = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const navigate = useNavigate();

  const fetchMyClassrooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await enrollmentApi.getMyClassrooms();
      setClassrooms(res.result ?? []);
    } catch (err) {
      setError(err.response?.data?.message ?? "Không thể tải danh sách lớp học.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMyClassrooms(); }, [fetchMyClassrooms]);

  const [searchQuery, setSearchQuery]   = useState("");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [leaveTarget, setLeaveTarget]    = useState(null); // classroom to leave
  const [leaveLoading, setLeaveLoading]  = useState(false);
  const [leaveError, setLeaveError]      = useState(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const filteredClassrooms = useMemo(() => {
    if (!debouncedSearch.trim()) return classrooms;
    const q = debouncedSearch.toLowerCase();
    return classrooms.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.subject?.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [classrooms, debouncedSearch]);

  const handleJoinSuccess = () => {
    fetchMyClassrooms();
  };

  const handleLeaveConfirm = async () => {
    if (!leaveTarget) return;
    setLeaveLoading(true);
    setLeaveError(null);
    try {
      await enrollmentApi.leaveClass(leaveTarget.id);
      setLeaveTarget(null);
      fetchMyClassrooms();
    } catch (err) {
      setLeaveError(err.response?.data?.message ?? "Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setLeaveLoading(false);
    }
  };

  return (
    <div className="student-classroom-container">
      {/* Page header */}
      <div className="student-classroom-header">
        <h1 className="student-classroom-title">Lớp học của tôi</h1>
        <button
          className="btn-join-class"
          onClick={() => setShowJoinModal(true)}
        >
          <Plus size={16} />
          Tham gia lớp học
        </button>
      </div>

      {/* Search bar */}
      <div className="student-classroom-toolbar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Tìm kiếm lớp học..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      <div className="student-classroom-content">
        {loading ? (
          <div className="student-classroom-loading">
            <Loader2 size={32} className="spin" />
            <p>Đang tải danh sách lớp học...</p>
          </div>
        ) : error ? (
          <div className="student-classroom-error">
            <p>{error}</p>
            <button className="btn-retry" onClick={fetchMyClassrooms}>
              Thử lại
            </button>
          </div>
        ) : filteredClassrooms.length === 0 ? (
          <div className="student-classroom-empty">
            <BookOpen size={48} className="empty-icon" />
            {searchQuery ? (
              <p>Không tìm thấy lớp học phù hợp với &quot;{searchQuery}&quot;</p>
            ) : (
              <>
                <p className="empty-title">Bạn chưa tham gia lớp học nào</p>
                <p className="empty-desc">
                  Nhấn &quot;Tham gia lớp học&quot; và nhập mã lớp của giáo viên để bắt đầu.
                </p>
                <button
                  className="btn-join-class"
                  onClick={() => setShowJoinModal(true)}
                >
                  <Plus size={16} />
                  Tham gia lớp học
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="student-classroom-grid">
            {filteredClassrooms.map((classroom) => (
              <StudentClassroomCard
                key={classroom.id}
                classroom={classroom}
                onNavigate={() =>
                  navigate(PATH_STUDENT.classroom.detail(classroom.id))
                }
                onLeave={() => { setLeaveTarget(classroom); setLeaveError(null); }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Join modal */}
      {showJoinModal && (
        <JoinClassModal
          onClose={() => setShowJoinModal(false)}
          onJoined={handleJoinSuccess}
        />
      )}

      {/* Leave confirmation modal */}
      {leaveTarget && (
        <div className="leave-modal-overlay" onClick={() => { if (!leaveLoading) setLeaveTarget(null); }}>
          <div className="leave-modal" onClick={(e) => e.stopPropagation()}>
            <div className="leave-modal-icon">
              <LogOut size={28} />
            </div>
            <h2 className="leave-modal-title">Rời khỏi lớp học?</h2>
            <p className="leave-modal-desc">
              Bạn có chắc chắn muốn rời khỏi lớp học
              <strong> {leaveTarget.name}</strong>?
              Bạn sẽ mất quyền truy cập vào tất cả bài tập và tài liệu.
            </p>
            {leaveError && (
              <p className="leave-modal-error">{leaveError}</p>
            )}
            <div className="leave-modal-actions">
              <button
                className="btn-leave-cancel"
                onClick={() => setLeaveTarget(null)}
                disabled={leaveLoading}
              >
                Hủy
              </button>
              <button
                className="btn-leave-confirm"
                onClick={handleLeaveConfirm}
                disabled={leaveLoading}
              >
                {leaveLoading ? <Loader2 size={16} className="spin" /> : <LogOut size={16} />}
                Xác nhận rời lớp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * @param {{ classroom: import("@/schema/classroom.schema").TClassroom & { teacherName?: string }, onNavigate: () => void, onLeave: () => void }} props
 */
const StudentClassroomCard = ({ classroom, onNavigate, onLeave }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <div className="student-classroom-card">
      {/* Card cover — clickable */}
      <div
        className="student-card-cover"
        onClick={onNavigate}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => { if (e.key === "Enter") onNavigate(); }}
      >
        {classroom.imageUrl ? (
          <img src={classroom.imageUrl} alt={classroom.name} />
        ) : (
          <div className="student-card-cover-placeholder">
            <BookOpen size={36} />
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="student-card-body">
        <div className="student-card-header-row">
          <p
            className="student-card-name"
            onClick={onNavigate}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => { if (e.key === "Enter") onNavigate(); }}
          >
            {classroom.name}
          </p>

          {/* Three-dot menu */}
          <div className="student-card-menu-wrapper" ref={menuRef}>
            <button
              className="student-card-menu-btn"
              onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
              aria-label="Tùy chọn"
            >
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <div className="student-card-dropdown">
                <button
                  className="student-card-dropdown-item danger"
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onLeave(); }}
                >
                  <LogOut size={14} />
                  Rời lớp
                </button>
              </div>
            )}
          </div>
        </div>

        {classroom.subject && (
          <p className="student-card-subject">{classroom.subject}</p>
        )}
        {classroom.teacherName && (
          <p className="student-card-teacher">Giáo viên: {classroom.teacherName}</p>
        )}
        <p className="student-card-code">Mã lớp: {classroom.code}</p>
      </div>
    </div>
  );
};

export default StudentClassroomPage;
