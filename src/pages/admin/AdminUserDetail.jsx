import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpenCheck, Clock3, Mail, Phone, ShieldCheck, UserCircle2, KeyRound } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { adminApi } from "@/apis/admin.api";
import CenteredConfirmModal from "@/components/CenteredConfirmModal";
import { PATH_ADMIN } from "@/routes/paths";
import { toast } from "sonner";

const formatRole = (role) => {
  switch (role) {
    case "ROLE_ADMIN":
      return "Admin";
    case "ROLE_TEACHER":
      return "Teacher";
    case "ROLE_STUDENT":
      return "Student";
    case "ROLE_GUEST":
      return "Guest";
    default:
      return role || "-";
  }
};

const formatStatus = (status) => {
  switch (status) {
    case "ACTIVE":
      return "Hoạt động";
    case "BANNED":
      return "Đã khóa";
    case "UNVERIFIED":
      return "Chưa xác minh";
    case "DELETED":
      return "Đã xóa";
    default:
      return status || "-";
  }
};

const formatDateTime = (iso) => {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const StatusPill = ({ status }) => {
  const className = useMemo(() => {
    switch (status) {
      case "ACTIVE":
        return "status-pill active";
      case "BANNED":
        return "status-pill banned";
      case "UNVERIFIED":
        return "status-pill unverified";
      default:
        return "status-pill default";
    }
  }, [status]);

  return <span className={className}>{formatStatus(status)}</span>;
};

const EmptyTable = ({ text }) => (
  <div className="table-empty-row">
    <span>{text}</span>
  </div>
);

const WARNING_TEMPLATES = [
  "Bạn đang đăng nội dung không phù hợp. Vui lòng chỉnh sửa để tránh bị xử lý.",
  "Tài khoản có dấu hiệu spam bình luận. Vui lòng dừng ngay để tránh bị khóa.",
  "Bạn đang vi phạm quy tắc ứng xử cộng đồng. Vui lòng tuân thủ nghiêm túc.",
];

const AdminUserDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState("");
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [warningContent, setWarningContent] = useState("");
  const [warningContentError, setWarningContentError] = useState("");
  const [showWarningTemplates, setShowWarningTemplates] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [warningSubmitting, setWarningSubmitting] = useState(false);
  const [updateMessage, setUpdateMessage] = useState("");
  const [updateError, setUpdateError] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
  const [warningError, setWarningError] = useState("");

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetMethod, setResetMethod] = useState("email"); // "email" or "manual"
  const [tempPassword, setTempPassword] = useState("");
  const [tempPasswordError, setTempPasswordError] = useState("");
  const [shownTempPassword, setShownTempPassword] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);

  useEffect(() => {
    const fetchUserDetail = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await adminApi.getUserDetail(id);
        const result = response?.result || null;
        setUser(result);
      } catch (err) {
        const backendMessage = err?.response?.data?.message;
        setError(backendMessage || "Không thể tải chi tiết người dùng.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUserDetail();
    }
  }, [id]);

  const createdClasses = user?.createdClasses || [];
  const enrolledClasses = user?.enrolledClasses || [];
  const recentActivity = user?.recentActivity || [];
  const subscriptionHistory = user?.subscriptionHistory || [];
  const isStudent = user?.role === "ROLE_STUDENT";
  const isTeacher = user?.role === "ROLE_TEACHER";
  const isAdmin = user?.role === "ROLE_ADMIN";
  const currentStatus = user?.status;
  const canLock = currentStatus === "ACTIVE" || currentStatus === "UNVERIFIED";
  const canUnlock = currentStatus === "BANNED";
  const canToggleStatus = canLock || canUnlock;
  const isStatusActionDisabled = updating || isAdmin;
  const canSendWarning = currentStatus === "ACTIVE" && !isAdmin;
  const showSubscription = !isStudent && !isAdmin;

  const handleOpenLockModal = () => {
    if (isStatusActionDisabled || !canLock) return;
    setPendingStatus("BANNED");
    setStatusModalOpen(true);
    setReason("");
    setReasonError("");
    setUpdateMessage("");
    setUpdateError("");
  };

  const handleOpenUnlockModal = () => {
    if (isStatusActionDisabled || !canUnlock) return;
    setPendingStatus("ACTIVE");
    setStatusModalOpen(true);
    setReason("");
    setReasonError("");
    setUpdateMessage("");
    setUpdateError("");
  };

  const handleCloseStatusModal = () => {
    if (updating) return;
    setStatusModalOpen(false);
    setPendingStatus("");
    setReason("");
    setReasonError("");
  };

  const handleOpenWarningModal = () => {
    if (!canSendWarning || warningSubmitting) return;
    setWarningModalOpen(true);
    setWarningContent("");
    setShowWarningTemplates(true);
    setWarningContentError("");
    setWarningMessage("");
    setWarningError("");
  };

  const handleCloseWarningModal = () => {
    if (warningSubmitting) return;
    setWarningModalOpen(false);
    setWarningContentError("");
    setShowWarningTemplates(true);
  };

  const handleSelectWarningTemplate = (template) => {
    setWarningContent(template);
    setShowWarningTemplates(false);
    setWarningContentError("");
  };

  const handleConfirmStatusChange = async () => {
    if (!pendingStatus) return;

    setUpdateMessage("");
    setUpdateError("");
    setReasonError("");

    if (pendingStatus === "BANNED" && !reason.trim()) {
      setReasonError("Vui lòng nhập lý do khóa tài khoản.");
      return;
    }

    try {
      setUpdating(true);

      const payload = {
        status: pendingStatus,
      };

      if (pendingStatus === "BANNED") {
        payload.reason = reason.trim();
      }

      const response = await adminApi.updateUserStatus(id, payload);
      const nextStatus = response?.result?.status || pendingStatus;

      setUser((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: nextStatus,
        };
      });

      if (nextStatus === "ACTIVE") {
        setReason("");
      }

      setUpdateMessage(response?.message || "Cập nhật trạng thái thành công.");
      setStatusModalOpen(false);
      setPendingStatus("");
      setReasonError("");
    } catch (err) {
      const backendMessage = err?.response?.data?.message;
      if (backendMessage && /email/i.test(backendMessage)) {
        setUpdateError(`${backendMessage}`);
      } else {
        setUpdateError(backendMessage || "Không thể cập nhật trạng thái người dùng.");
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleSendWarning = async () => {
    setWarningContentError("");
    setWarningMessage("");
    setWarningError("");

    if (!warningContent.trim()) {
      setWarningContentError("Vui lòng nhập nội dung chi tiết cho cảnh báo này.");
      return;
    }

    try {
      setWarningSubmitting(true);
      const response = await adminApi.sendAccountWarning(id, {
        content: warningContent.trim(),
      });

      setWarningMessage(response?.message || "Cảnh báo đã được gửi đến người dùng thành công.");
      setWarningModalOpen(false);
      setWarningContent("");
      setWarningContentError("");
    } catch (err) {
      const backendMessage = err?.response?.data?.message;
      if (backendMessage && /nội dung|cảnh báo/i.test(backendMessage)) {
        setWarningContentError(`${backendMessage}`);
      } else {
        setWarningError(backendMessage || "Không thể gửi cảnh báo. Vui lòng thử lại.");
      }
    } finally {
      setWarningSubmitting(false);
    }
  };

  const handleOpenResetModal = () => {
    setResetModalOpen(true);
    setResetMethod("email");
    setTempPassword("");
    setTempPasswordError("");
    setShownTempPassword("");
  };

  const handleCloseResetModal = () => {
    if (resetSubmitting) return;
    setResetModalOpen(false);
    setShownTempPassword("");
  };

  const handleResetConfirm = async () => {
    setTempPasswordError("");

    if (resetMethod === "manual" && tempPassword.length < 8) {
      setTempPasswordError("Mật khẩu tạm thời phải có ít nhất 8 ký tự.");
      return;
    }

    try {
      setResetSubmitting(true);
      if (resetMethod === "email") {
        await adminApi.sendPasswordResetLink(id);
        toast.success("Đã gửi liên kết đặt lại mật khẩu đến email của người dùng.", { id: "msg72" });
        setResetModalOpen(false);
      } else {
        await adminApi.setTemporaryPassword(id, { temporaryPassword: tempPassword });
        setShownTempPassword(tempPassword);
        setTempPassword("");
      }
    } catch (err) {
      const backendMessage = err?.response?.data?.message;
      if (resetMethod === "email") {
        toast.error("Không thể gửi email đặt lại mật khẩu do lỗi hệ thống. Vui lòng thử lại sau.", { id: "msg73" });
      } else {
        setTempPasswordError(backendMessage || "Có lỗi xảy ra khi cấp mật khẩu tạm thời.");
      }
    } finally {
      setResetSubmitting(false);
    }
  };

  return (
    <div className="admin-user-detail-page">
      <div className="top-row">
        <button type="button" className="back-btn" onClick={() => navigate(PATH_ADMIN.users.root)}>
          <ArrowLeft size={16} />
          Quay lại danh sách
        </button>
      </div>

      {loading ? (
        <div className="state-card">Đang tải chi tiết người dùng...</div>
      ) : error ? (
        <div className="error-card">{error}</div>
      ) : !user ? (
        <div className="state-card">Không tìm thấy dữ liệu người dùng.</div>
      ) : (
        <>
          <section className="profile-card">
            <div className="avatar-wrap">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName || "User"} />
              ) : (
                <UserCircle2 size={70} />
              )}
            </div>
            <div className="profile-main">
              <p className="screen-label">User Detail</p>
              <h1>{user.fullName || "-"}</h1>
              <div className="meta-row">
                <span>
                  <ShieldCheck size={14} /> {formatRole(user.role)}
                </span>
                <StatusPill status={user.status} />
                <button
                  type="button"
                  className="reset-password-btn"
                  onClick={handleOpenResetModal}
                  title="Đặt lại mật khẩu"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: 'auto', padding: '6px 12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                >
                  <KeyRound size={14} /> Đặt lại mật khẩu
                </button>
              </div>
              <p className="id-text">ID người dùng: #{user.id}</p>
            </div>
          </section>

          <section className="status-update-card">
            <h2>Cập nhật trạng thái người dùng</h2>
            <p className="status-helper-text">Chọn một thao tác phù hợp với trạng thái hiện tại của tài khoản.</p>

            <div className="form-actions">
              <button
                type="button"
                className={`status-action-btn warning ${!canSendWarning ? "protected" : ""}`.trim()}
                onClick={handleOpenWarningModal}
                disabled={!canSendWarning || warningSubmitting}
                title={!canSendWarning ? "Chỉ gửi cảnh báo cho người dùng đang hoạt động" : ""}
              >
                {warningSubmitting ? "Đang gửi..." : "Gửi cảnh báo"}
              </button>

              {canLock && (
                <button
                  type="button"
                  className={`status-action-btn lock ${isAdmin ? "protected" : ""}`.trim()}
                  onClick={handleOpenLockModal}
                  disabled={isStatusActionDisabled}
                  title={isAdmin ? "Không thể khóa tài khoản Admin" : ""}
                >
                  {updating ? "Đang xử lý..." : "Khóa"}
                </button>
              )}

              {canUnlock && (
                <button
                  type="button"
                  className={`status-action-btn unlock ${isAdmin ? "protected" : ""}`.trim()}
                  onClick={handleOpenUnlockModal}
                  disabled={isStatusActionDisabled}
                  title={isAdmin ? "Không thể mở khóa tài khoản Admin" : ""}
                >
                  {updating ? "Đang xử lý..." : "Hoạt động"}
                </button>
              )}
            </div>

            {!canToggleStatus && (
              <p className="muted">Tài khoản ở trạng thái này chưa hỗ trợ cập nhật trực tiếp.</p>
            )}

            {updateMessage && <p className="update-success">{updateMessage}</p>}
            {updateError && <p className="update-error">{updateError}</p>}
            {warningMessage && <p className="update-success">{warningMessage}</p>}
            {warningError && <p className="update-error">{warningError}</p>}
          </section>

          <CenteredConfirmModal
            isOpen={statusModalOpen}
            title={
              pendingStatus === "BANNED"
                ? "Bạn có chắc chắn muốn khóa người dùng này?"
                : "Bạn có chắc chắn muốn mở khóa người dùng này?"
            }
            description={
              pendingStatus === "BANNED"
                ? "Lý do sẽ được gửi trong email thông báo đến người dùng."
                : "Người dùng sẽ được kích hoạt lại và nhận email xác nhận mở khóa."
            }
            confirmText="Xác nhận"
            cancelText="Hủy"
            confirmVariant={pendingStatus === "BANNED" ? "danger" : "primary"}
            onConfirm={handleConfirmStatusChange}
            onClose={handleCloseStatusModal}
            loading={updating}
          >
            {pendingStatus === "BANNED" && (
              <div className="modal-reason-field">
                <label htmlFor="lock-reason">Lý do khóa tài khoản</label>
                <textarea
                  id="lock-reason"
                  rows={3}
                  value={reason}
                  onChange={(event) => {
                    setReason(event.target.value);
                    if (reasonError) {
                      setReasonError("");
                    }
                  }}
                  placeholder="Nhập lý do để gửi trong email thông báo..."
                  disabled={updating}
                />
                {reasonError && <p className="modal-error-text">{reasonError}</p>}
              </div>
            )}
          </CenteredConfirmModal>

          <CenteredConfirmModal
            isOpen={resetModalOpen}
            title="Đặt lại mật khẩu"
            description="Chọn phương thức đặt lại mật khẩu cho người dùng này."
            confirmText={shownTempPassword ? "Đóng" : "Xác nhận"}
            cancelText={shownTempPassword ? "" : "Hủy"}
            onConfirm={shownTempPassword ? handleCloseResetModal : handleResetConfirm}
            onClose={handleCloseResetModal}
            loading={resetSubmitting}
            hideCancel={!!shownTempPassword}
          >
            {shownTempPassword ? (
              <div className="reset-success-view" style={{ padding: '16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', color: '#166534', marginTop: '16px' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Đã cập nhật mật khẩu tạm thời. Người dùng sẽ bị yêu cầu đổi mật khẩu ở lần đăng nhập tiếp theo.</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px' }}>
                  <span style={{ fontWeight: '500', fontFamily: 'monospace', fontSize: '15px' }}>{shownTempPassword}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(shownTempPassword);
                      toast.success("Đã sao chép mật khẩu", { id: 'copy' });
                    }}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '13px' }}
                  >
                    Sao chép
                  </button>
                </div>
              </div>
            ) : (
              <div className="reset-methods" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="resetMethod"
                    value="email"
                    checked={resetMethod === "email"}
                    onChange={(e) => setResetMethod(e.target.value)}
                    disabled={resetSubmitting}
                  />
                  <span>Gửi link qua Email</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="resetMethod"
                    value="manual"
                    checked={resetMethod === "manual"}
                    onChange={(e) => setResetMethod(e.target.value)}
                    disabled={resetSubmitting}
                  />
                  <span>Cấp mật khẩu tạm thời</span>
                </label>

                {resetMethod === "manual" && (
                  <div className="modal-reason-field" style={{ marginTop: '8px' }}>
                    <label htmlFor="temp-password" style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>Mật khẩu mới</label>
                    <input
                      id="temp-password"
                      type="text"
                      value={tempPassword}
                      onChange={(e) => {
                        setTempPassword(e.target.value);
                        if (tempPasswordError) setTempPasswordError("");
                      }}
                      placeholder="Nhập mật khẩu tạm thời..."
                      disabled={resetSubmitting}
                      style={{ width: '100%', padding: '8px 12px', boxSizing: 'border-box', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                    {tempPasswordError && <p className="modal-error-text" style={{ color: '#dc2626', fontSize: '13px', marginTop: '4px' }}>{tempPasswordError}</p>}
                    <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>BR-68: Đổi mật khẩu thành công sẽ yêu cầu người dùng thay đổi lại mật khẩu trong lần đăng nhập kế tiếp.</p>
                  </div>
                )}
              </div>
            )}
          </CenteredConfirmModal>

          <CenteredConfirmModal
            isOpen={warningModalOpen}
            title="Gửi cảnh báo"
            description="Cảnh báo sẽ được gửi trực tiếp đến trung tâm thông báo của người dùng."
            confirmText="Gửi"
            cancelText="Hủy"
            confirmVariant="danger"
            onConfirm={handleSendWarning}
            onClose={handleCloseWarningModal}
            loading={warningSubmitting}
          >
            <div className="modal-reason-field">
              <label htmlFor="warning-content">Nội dung cảnh báo *</label>

              {showWarningTemplates ? (
                <div className="warning-template-list">
                  {WARNING_TEMPLATES.map((template, index) => (
                    <button
                      key={`warning-template-${index}`}
                      type="button"
                      className="warning-template-btn"
                      onClick={() => handleSelectWarningTemplate(template)}
                      disabled={warningSubmitting}
                    >
                      {template}
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  type="button"
                  className="warning-template-reset-btn"
                  onClick={() => setShowWarningTemplates(true)}
                  disabled={warningSubmitting}
                >
                  Chọn mẫu khác
                </button>
              )}

              <textarea
                id="warning-content"
                rows={4}
                value={warningContent}
                onChange={(event) => {
                  setWarningContent(event.target.value);
                  if (warningContentError) {
                    setWarningContentError("");
                  }
                }}
                placeholder="Nhập nội dung cảnh báo chi tiết..."
                disabled={warningSubmitting}
              />
              {warningContentError && <p className="modal-error-text">{warningContentError}</p>}
            </div>
          </CenteredConfirmModal>

          <section className={`grid-two ${showSubscription ? "" : "single"}`.trim()}>
            <div className="info-card contact-card">
              <h2>Thông tin liên hệ</h2>
              <div className="info-item">
                <Mail size={14} />
                <span>{user.email || "-"}</span>
              </div>
              <div className="info-item">
                <Phone size={14} />
                <span>{user.phoneNumber || "-"}</span>
              </div>
              <div className="info-item">
                <Clock3 size={14} />
                <span>Ngày tạo: {formatDateTime(user.createdAt)}</span>
              </div>
            </div>

            {showSubscription && (
              <div className="info-card">
                <h2>Lịch sử gói đăng ký</h2>
                {subscriptionHistory.length === 0 ? (
                  <p className="muted">Không có dữ liệu gói đăng ký.</p>
                ) : (
                  <ul className="simple-list">
                    {subscriptionHistory.map((item, index) => (
                      <li key={`${item}-${index}`}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>

          {!isStudent && !isAdmin && (
            <section className="data-card">
              <h2>Lớp học đã tạo</h2>
              {createdClasses.length === 0 ? (
                <EmptyTable text="Người dùng này chưa tạo lớp học nào." />
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Tên lớp</th>
                        <th>Mã lớp</th>
                        <th>Môn học</th>
                      </tr>
                    </thead>
                    <tbody>
                      {createdClasses.map((item) => (
                        <tr key={`created-${item.id}`}>
                          <td>#{item.id}</td>
                          <td>{item.name || "-"}</td>
                          <td>{item.code || "-"}</td>
                          <td>{item.subject || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {!isTeacher && !isAdmin && (
            <section className="data-card">
              <h2>Lớp học đã tham gia</h2>
              {enrolledClasses.length === 0 ? (
                <EmptyTable text="Người dùng này chưa tham gia lớp học nào." />
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Tên lớp</th>
                        <th>Mã lớp</th>
                        <th>Môn học</th>
                        <th>Giáo viên</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrolledClasses.map((item) => (
                        <tr key={`enrolled-${item.id}`}>
                          <td>#{item.id}</td>
                          <td>{item.name || "-"}</td>
                          <td>{item.code || "-"}</td>
                          <td>{item.subject || "-"}</td>
                          <td>{item.teacherName || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          <section className="data-card">
            <h2>Hoạt động gần đây</h2>
            {recentActivity.length === 0 ? (
              <EmptyTable text="Không có hoạt động gần đây." />
            ) : (
              <div className="activity-list">
                {recentActivity.map((item, index) => (
                  <article className="activity-item" key={`${item.activityType || "activity"}-${index}`}>
                    <div className="activity-icon">
                      <BookOpenCheck size={14} />
                    </div>
                    <div>
                      <p className="activity-title">{item.activityType || "Hoạt động"}</p>
                      <p className="activity-description">{item.description || "-"}</p>
                      <p className="activity-date">{formatDateTime(item.occurredAt)}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <style>{`
        .admin-user-detail-page {
          display: grid;
          gap: 14px;
          color: #0f172a;
        }

        .top-row {
          display: flex;
          justify-content: flex-start;
        }

        .back-btn {
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          color: #0f172a;
          border-radius: 8px;
          min-height: 34px;
          padding: 0 12px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
          cursor: pointer;
        }

        .state-card,
        .error-card {
          border-radius: 12px;
          padding: 14px;
          border: 1px solid #e2e8f0;
          background: #fff;
          color: #334155;
        }

        .error-card {
          border-color: #fecaca;
          color: #b91c1c;
          background: #fff1f2;
        }

        .profile-card {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 20px;
          align-items: center;
          border: 1px solid #dbe5ef;
          border-radius: 14px;
          background: linear-gradient(145deg, #ecfeff 0%, #eef2ff 100%);
          padding: 20px;
        }

        .avatar-wrap {
          width: 106px;
          height: 106px;
          border-radius: 999px;
          background: #fff;
          border: 1px solid #bfdbfe;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          color: #1e3a8a;
        }

        .avatar-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .screen-label {
          margin: 0 0 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 12px;
          color: #0f766e;
          font-weight: 700;
        }

        .profile-main h1 {
          margin: 0;
          font-size: clamp(28px, 3vw, 38px);
          line-height: 1.15;
        }

        .meta-row {
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .meta-row span {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #334155;
          font-size: 13px;
          font-weight: 600;
        }

        .id-text {
          margin-top: 8px;
          font-size: 14px;
          color: #475569;
        }

        .grid-two {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .grid-two.single {
          grid-template-columns: 1fr;
        }

        .info-card,
        .data-card,
        .status-update-card {
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          background: #fff;
          padding: 14px;
        }

        .info-card h2,
        .data-card h2,
        .status-update-card h2 {
          margin: 0 0 12px;
          font-size: 16px;
        }

        .status-update-card p {
          margin: 0;
          color: #334155;
          font-size: 14px;
        }

        .status-helper-text {
          margin-bottom: 2px;
        }

        .form-actions {
          display: flex;
          justify-content: flex-start;
          gap: 10px;
          margin: 10px 0;
        }

        .status-action-btn {
          border: 1px solid #0f766e;
          background: #0f766e;
          color: #ffffff;
          border-radius: 8px;
          min-height: 38px;
          padding: 0 14px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .status-action-btn.lock {
          border-color: #b91c1c;
          background: #b91c1c;
        }

        .status-action-btn.unlock {
          border-color: #0f766e;
          background: #0f766e;
        }

        .status-action-btn.warning {
          border-color: #d97706;
          background: #d97706;
        }

        .status-action-btn.protected {
          filter: grayscale(1);
          opacity: 0.5;
        }

        .status-action-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .status-protection-note {
          margin-top: 10px;
          border-radius: 8px;
          padding: 10px 12px;
          background: #f8fafc;
          border: 1px dashed #cbd5e1;
          color: #334155;
          font-size: 13px;
        }

        .modal-reason-field {
          display: grid;
          gap: 6px;
        }

        .modal-reason-field label {
          font-size: 13px;
          color: #334155;
          font-weight: 600;
        }

        .modal-reason-field textarea {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 10px;
          font-size: 14px;
          color: #0f172a;
          outline: none;
          background: #fff;
          resize: vertical;
        }

        .modal-reason-field textarea:focus {
          border-color: #94a3b8;
          box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.2);
        }

        .modal-error-text {
          margin: 0;
          color: #b91c1c;
          font-size: 13px;
        }

        .warning-template-list {
          display: grid;
          gap: 8px;
        }

        .warning-template-btn,
        .warning-template-reset-btn {
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          color: #334155;
          border-radius: 8px;
          padding: 9px 10px;
          text-align: left;
          font-size: 13px;
          line-height: 1.4;
          cursor: pointer;
        }

        .warning-template-btn:hover,
        .warning-template-reset-btn:hover {
          border-color: #94a3b8;
          background: #f1f5f9;
        }

        .update-success,
        .update-error {
          margin: 0;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 13px;
          border: 1px solid transparent;
        }

        .update-success {
          background: #ecfdf3;
          color: #047857;
          border-color: #a7f3d0;
        }

        .update-error {
          background: #fff1f2;
          color: #b91c1c;
          border-color: #fecaca;
        }

        .contact-card h2 {
          font-size: 20px;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #334155;
          margin-bottom: 9px;
          font-size: 14px;
        }

        .contact-card .info-item {
          font-size: 16px;
          gap: 10px;
          margin-bottom: 12px;
        }

        .muted {
          color: #64748b;
          margin: 0;
          font-size: 14px;
        }

        .simple-list {
          margin: 0;
          padding-left: 18px;
          color: #334155;
        }

        .table-wrap {
          overflow-x: auto;
        }

        table {
          width: 100%;
          min-width: 720px;
          border-collapse: collapse;
        }

        th,
        td {
          text-align: left;
          padding: 10px;
          border-bottom: 1px solid #edf2f7;
          font-size: 14px;
        }

        th {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          color: #475569;
          background: #f8fafc;
        }

        .table-empty-row {
          color: #64748b;
          border: 1px dashed #cbd5e1;
          border-radius: 10px;
          padding: 12px;
          text-align: center;
          font-size: 14px;
        }

        .activity-list {
          display: grid;
          gap: 8px;
        }

        .activity-item {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 10px;
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 10px;
        }

        .activity-icon {
          width: 26px;
          height: 26px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0f766e;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
        }

        .activity-title {
          margin: 0;
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
        }

        .activity-description {
          margin: 4px 0;
          font-size: 13px;
          color: #334155;
        }

        .activity-date {
          margin: 0;
          font-size: 12px;
          color: #64748b;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          padding: 4px 9px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          border: 1px solid transparent;
        }

        .status-pill.active {
          background: #ecfdf3;
          color: #047857;
          border-color: #a7f3d0;
        }

        .status-pill.banned {
          background: #fef2f2;
          color: #b91c1c;
          border-color: #fecaca;
        }

        .status-pill.unverified {
          background: #fff7ed;
          color: #c2410c;
          border-color: #fed7aa;
        }

        .status-pill.default {
          background: #f1f5f9;
          color: #334155;
          border-color: #cbd5e1;
        }

        @media (max-width: 900px) {
          .grid-two {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .profile-card {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .avatar-wrap {
            margin: 0 auto;
          }

          .meta-row {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminUserDetailPage;
