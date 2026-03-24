import { useState } from "react";
import { X, Search, BookOpen, Loader2, CheckCircle } from "lucide-react";
import { classroomApi } from "@/apis/classroom.api";
import { enrollmentApi } from "@/apis/enrollment.api";
import "@/assets/css/pages/classroom/modals.css";
import "@/assets/css/pages/classroom/joinClassModal.css";

/**
 * @param {{ onClose: () => void, onJoined: () => void }} props
 */
const JoinClassModal = ({ onClose, onJoined }) => {
  const [code, setCode]               = useState("");
  const [classroom, setClassroom]     = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [joinError, setJoinError]     = useState("");
  const [joinSuccess, setJoinSuccess] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;

    setSearchLoading(true);
    setSearchError("");
    setClassroom(null);
    setJoinError("");
    setJoinSuccess(false);

    try {
      const res = await classroomApi.searchByCode(trimmed);
      setClassroom(res.result);
    } catch (err) {
      setSearchError(
        err.response?.data?.message ?? "Không tìm thấy lớp học. Vui lòng kiểm tra lại mã lớp."
      );
    } finally {
      setSearchLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!classroom) return;
    setJoinLoading(true);
    setJoinError("");

    try {
      await enrollmentApi.joinClass(classroom.id);
      setJoinSuccess(true);
      onJoined?.();
    } catch (err) {
      setJoinError(
        err.response?.data?.message ?? "Không thể gửi yêu cầu tham gia. Vui lòng thử lại."
      );
    } finally {
      setJoinLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    setCode(e.target.value);
    if (classroom) {
      setClassroom(null);
      setJoinError("");
      setJoinSuccess(false);
    }
    if (searchError) setSearchError("");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container join-class-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Tham gia lớp học</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {joinSuccess ? (
            <div className="join-success">
              <CheckCircle size={48} className="join-success-icon" />
              <h3 className="join-success-title">Yêu cầu đã được gửi!</h3>
              <p className="join-success-desc">
                Yêu cầu tham gia lớp <strong>{classroom?.name}</strong> đã được gửi thành công.
                Vui lòng đợi giáo viên phê duyệt.
              </p>
              <button className="btn-join-primary" onClick={onClose}>
                Đóng
              </button>
            </div>
          ) : (
            <>
              {/* Search form */}
              <form onSubmit={handleSearch} className="join-search-form">
                <label className="form-label">Nhập mã lớp</label>
                <div className="join-search-row">
                  <input
                    type="text"
                    className={`join-search-input ${searchError ? "input-error" : ""}`}
                    value={code}
                    onChange={handleCodeChange}
                    placeholder="Ví dụ: ABC123"
                    autoFocus
                    disabled={searchLoading || joinLoading}
                  />
                  <button
                    type="submit"
                    className="btn-join-search"
                    disabled={!code.trim() || searchLoading || joinLoading}
                  >
                    {searchLoading ? (
                      <Loader2 size={16} className="spin" />
                    ) : (
                      <Search size={16} />
                    )}
                    Tìm kiếm
                  </button>
                </div>
                <p className="join-hint">
                  Nhập mã lớp do giáo viên cung cấp (không phân biệt chữ hoa/thường)
                </p>
                {searchError && (
                  <p className="join-error-text">{searchError}</p>
                )}
              </form>

              {/* Classroom info */}
              {classroom && (
                <div className="join-classroom-info">
                  <div className="join-classroom-thumbnail">
                    {classroom.imageUrl ? (
                      <img src={classroom.imageUrl} alt={classroom.name} />
                    ) : (
                      <div className="join-classroom-thumbnail-placeholder">
                        <BookOpen size={24} />
                      </div>
                    )}
                  </div>
                  <div className="join-classroom-details">
                    <h3 className="join-classroom-name">{classroom.name}</h3>
                    <div className="join-classroom-meta">
                      <span className="join-classroom-subject">{classroom.subject}</span>
                      <span className="join-classroom-code">Mã: {classroom.code}</span>
                    </div>
                    {classroom.description && (
                      <p className="join-classroom-desc">{classroom.description}</p>
                    )}
                  </div>
                </div>
              )}

              {joinError && (
                <p className="join-error-text">{joinError}</p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!joinSuccess && (
          <div className="modal-footer">
            <button
              type="button"
              className="btn-join-cancel"
              onClick={onClose}
              disabled={searchLoading || joinLoading}
            >
              Hủy
            </button>
            {classroom && (
              <button
                type="button"
                className="btn-join-primary"
                onClick={handleJoin}
                disabled={joinLoading}
              >
                {joinLoading ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    Đang gửi...
                  </>
                ) : (
                  "Tham gia"
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinClassModal;
