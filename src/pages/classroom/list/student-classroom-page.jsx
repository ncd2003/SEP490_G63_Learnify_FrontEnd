import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { BookOpen, Plus, Search, Loader2, MoreVertical, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { classroomMemberApi, ENROLLMENT_STATUS } from "@/apis/classroom-member.api";
import useDebounce from "@/hooks/use-debounce";
import JoinClassModal from "@/pages/classroom/search/join-class-modal";
import { PATH_STUDENT } from "@/routes/paths";
import "@/assets/css/pages/classroom/studentClassroom.css";

const STATUS_FILTERS = [
  {
    value: ENROLLMENT_STATUS.ACCEPTED,
    label: "Đã được duyệt",
    emptyTitle: "Bạn chưa có lớp học nào đã được duyệt",
    emptyDesc: "Khi giáo viên chấp nhận yêu cầu tham gia, lớp học sẽ xuất hiện ở đây.",
  },
  {
    value: ENROLLMENT_STATUS.PENDING,
    label: "Đang chờ duyệt",
    emptyTitle: "Không có lớp học nào đang chờ duyệt",
    emptyDesc: "Các yêu cầu tham gia đang chờ giáo viên xử lý sẽ hiển thị tại đây.",
  },
  {
    value: ENROLLMENT_STATUS.REJECTED,
    label: "Đã bị từ chối",
    emptyTitle: "Không có lớp học nào bị từ chối",
    emptyDesc: "Các yêu cầu tham gia bị từ chối sẽ hiển thị tại đây để bạn theo dõi.",
  },
];

const INITIAL_STATUS_COUNTS = {
  [ENROLLMENT_STATUS.ACCEPTED]: 0,
  [ENROLLMENT_STATUS.PENDING]: 0,
  [ENROLLMENT_STATUS.REJECTED]: 0,
};

const StudentClassroomPage = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [statusCounts, setStatusCounts] = useState(INITIAL_STATUS_COUNTS);
  const [selectedStatus, setSelectedStatus] = useState(
    ENROLLMENT_STATUS.ACCEPTED,
  );
  const navigate = useNavigate();

  const selectedStatusMeta =
    STATUS_FILTERS.find((item) => item.value === selectedStatus) ??
    STATUS_FILTERS[0];

  const fetchMyClassrooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await classroomMemberApi.getMyClassrooms(
        selectedStatus,
      );
      const result = res.result ?? [];
      setClassrooms(result);
      setStatusCounts((prev) => ({
        ...prev,
        [selectedStatus]: result.length,
      }));
    } catch (err) {
      setError(err.response?.data?.message ?? "Không thể tải danh sách lớp học.");
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  const fetchStatusCounts = useCallback(async () => {
    const responses = await Promise.all(
      STATUS_FILTERS.map(({ value }) =>
        classroomMemberApi
          .getMyClassrooms(value)
          .then((res) => ({ status: value, count: (res.result ?? []).length }))
          .catch(() => ({ status: value, count: 0 })),
      ),
    );

    const nextCounts = responses.reduce((acc, item) => {
      acc[item.status] = item.count;
      return acc;
    }, { ...INITIAL_STATUS_COUNTS });

    setStatusCounts(nextCounts);
  }, []);

  useEffect(() => { fetchMyClassrooms(); }, [fetchMyClassrooms]);
  useEffect(() => { fetchStatusCounts(); }, [fetchStatusCounts]);

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

  const handleJoinSuccess = async () => {
    await Promise.all([fetchMyClassrooms(), fetchStatusCounts()]);
  };

  const handleLeaveConfirm = async () => {
    if (!leaveTarget) return;
    setLeaveLoading(true);
    setLeaveError(null);
    try {
      await classroomMemberApi.leaveClass(leaveTarget.id);
      setLeaveTarget(null);
      await Promise.all([fetchMyClassrooms(), fetchStatusCounts()]);
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
        <div className="status-filter-grid" role="tablist" aria-label="Lọc trạng thái lớp học">
          {STATUS_FILTERS.map((statusItem) => {
            const isActive = selectedStatus === statusItem.value;

            return (
              <button
                key={statusItem.value}
                type="button"
                className={`status-filter-box ${isActive ? "active" : ""}`}
                onClick={() => setSelectedStatus(statusItem.value)}
              >
                <span className="status-filter-label">{statusItem.label}</span>
                <span className="status-filter-count">
                  {statusCounts[statusItem.value] ?? 0} lớp
                </span>
              </button>
            );
          })}
        </div>

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
                <p className="empty-title">{selectedStatusMeta.emptyTitle}</p>
                <p className="empty-desc">
                  {selectedStatusMeta.emptyDesc}
                </p>
                {selectedStatus === ENROLLMENT_STATUS.ACCEPTED && (
                  <button
                    className="btn-join-class"
                    onClick={() => setShowJoinModal(true)}
                  >
                    <Plus size={16} />
                    Tham gia lớp học
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="student-classroom-grid">
            {filteredClassrooms.map((classroom) => (
              <StudentClassroomCard
                key={classroom.id}
                classroom={classroom}
                status={selectedStatus}
                canNavigate={selectedStatus === ENROLLMENT_STATUS.ACCEPTED}
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
 * @param {{ classroom: import("@/schema/classroom.schema").TClassroom & { teacherName?: string }, status: "PENDING" | "ACCEPTED" | "REJECTED", canNavigate?: boolean, onNavigate: () => void, onLeave: () => void }} props
 */
const StudentClassroomCard = ({
  classroom,
  status,
  canNavigate = true,
  onNavigate,
  onLeave,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleNavigate = () => {
    if (!canNavigate) return;
    onNavigate();
  };

  const handleNavigateByKeyboard = (e) => {
    if (!canNavigate) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onNavigate();
    }
  };

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
        className={`student-card-cover ${canNavigate ? "" : "is-disabled"}`}
        onClick={handleNavigate}
        role={canNavigate ? "button" : undefined}
        tabIndex={canNavigate ? 0 : -1}
        onKeyDown={handleNavigateByKeyboard}
        aria-disabled={!canNavigate}
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
            className={`student-card-name ${canNavigate ? "" : "is-disabled"}`}
            onClick={handleNavigate}
            role={canNavigate ? "button" : undefined}
            tabIndex={canNavigate ? 0 : -1}
            onKeyDown={handleNavigateByKeyboard}
            aria-disabled={!canNavigate}
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
        <p className={`student-card-status-badge status-${status.toLowerCase()}`}>
          Trạng thái: {status}
        </p>
        {classroom.teacherName && (
          <p className="student-card-teacher">Giáo viên: {classroom.teacherName}</p>
        )}
        <p className="student-card-code">Mã lớp: {classroom.code}</p>
      </div>
    </div>
  );
};

export default StudentClassroomPage;
