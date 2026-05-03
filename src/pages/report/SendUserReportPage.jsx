import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { reportApi } from "@/apis/report.api";

const REPORT_REASON_OPTIONS = [
  { value: "", label: "-- Chọn lý do --" },
  { value: "SPAM", label: "Spam" },
  { value: "HARASSMENT", label: "Quấy rối" },
  { value: "INAPPROPRIATE_CONTENT", label: "Nội dung phản cảm" },
];

const DEFAULT_PROFILE = {
  userId: "2048",
  fullName: "Nguyễn Văn B",
  role: "Học sinh",
  email: "nguyenvanb@learnify.vn",
  status: "Hoạt động",
};

const SendUserReportPage = () => {
  const location = useLocation();
  const initialState = location?.state || {};

  const [profile, setProfile] = useState({
    userId: String(initialState.targetUserId || DEFAULT_PROFILE.userId),
    fullName: initialState.targetName || DEFAULT_PROFILE.fullName,
    role: initialState.targetRoleLabel || DEFAULT_PROFILE.role,
    email: initialState.targetEmail || DEFAULT_PROFILE.email,
    status: initialState.targetStatusLabel || DEFAULT_PROFILE.status,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [detailedDescription, setDetailedDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [warningMessage, setWarningMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isTargetAdmin = useMemo(() => {
    const roleText = (profile.role || "").toLowerCase();
    return roleText.includes("admin") || roleText.includes("quản trị");
  }, [profile.role]);

  const openModal = () => {
    if (isTargetAdmin) return;
    setReason("");
    setDetailedDescription("");
    setValidationError("");
    setWarningMessage("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setIsModalOpen(false);
    setValidationError("");
    setWarningMessage("");
  };

  const handleSubmitReport = async () => {
    setValidationError("");
    setWarningMessage("");
    setSuccessMessage("");

    if (!reason) {
      setValidationError("Vui lòng chọn ít nhất một lý do báo cáo.");
      return;
    }

    const numericUserId = Number(profile.userId);
    if (!Number.isFinite(numericUserId) || numericUserId <= 0) {
      setWarningMessage("Vui lòng nhập Mã người dùng hợp lệ trước khi gửi báo cáo.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        reportedUserId: numericUserId,
        reason,
      };

      if (detailedDescription.trim()) {
        payload.detailedDescription = detailedDescription.trim();
      }

      await reportApi.createUserReport(payload);

      setSuccessMessage("Cảm ơn bạn đã gửi báo cáo. Chúng tôi sẽ xem xét và xử lý sớm nhất có thể.");
      setIsModalOpen(false);
    } catch (error) {
      const backendMessage = error?.response?.data?.message || "Không thể gửi báo cáo. Vui lòng thử lại.";
      if (/giới hạn|24 giờ|vượt quá/i.test(backendMessage)) {
        setWarningMessage(`${backendMessage}`);
      } else if (/lý do|reason/i.test(backendMessage)) {
        setValidationError(`${backendMessage}`);
      } else {
        setWarningMessage(backendMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="send-user-report-page">
      <section className="profile-card">
        <h1>Thông tin người dùng</h1>

        <div className="profile-grid">
          <div className="avatar-placeholder" aria-hidden="true">
            <span>[IMAGE]</span>
          </div>

          <div className="field-grid">
            <label>
              Mã người dùng
              <input
                value={profile.userId}
                onChange={(e) => setProfile((prev) => ({ ...prev, userId: e.target.value }))}
                placeholder="Nhập ID người dùng"
              />
            </label>

            <label>
              Họ và tên
              <input
                value={profile.fullName}
                onChange={(e) => setProfile((prev) => ({ ...prev, fullName: e.target.value }))}
                placeholder="Tên người dùng"
              />
            </label>

            <label>
              Vai trò
              <input
                value={profile.role}
                onChange={(e) => setProfile((prev) => ({ ...prev, role: e.target.value }))}
                placeholder="Vai trò"
              />
            </label>

            <label>
              Email
              <input
                value={profile.email}
                onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Email"
              />
            </label>
          </div>
        </div>

        <div className="report-actions">
          {!isTargetAdmin ? (
            <button type="button" className="btn-report" onClick={openModal}>
              Báo cáo
            </button>
          ) : (
            <div className="admin-restricted-note">
              Nút báo cáo được ẩn cho tài khoản Admin.
            </div>
          )}
        </div>

        {successMessage && <p className="report-success">{successMessage}</p>}
      </section>

      {isModalOpen && (
        <div className="report-modal-overlay" onClick={closeModal}>
          <div className="report-modal" onClick={(e) => e.stopPropagation()}>
            <div className="report-modal-header">
              <h2>Báo cáo người dùng</h2>
            </div>

            <div className="report-modal-body">
              <label>
                Lý do báo cáo *
                <select value={reason} onChange={(e) => setReason(e.target.value)}>
                  {REPORT_REASON_OPTIONS.map((item) => (
                    <option key={item.value || "empty"} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              {validationError && <p className="report-validation-error">{validationError}</p>}

              <label>
                Mô tả chi tiết (tùy chọn)
                <textarea
                  rows={4}
                  value={detailedDescription}
                  onChange={(e) => setDetailedDescription(e.target.value)}
                  placeholder="Nhập nội dung chi tiết nếu cần"
                />
              </label>

              {warningMessage && <p className="report-warning">{warningMessage}</p>}
            </div>

            <div className="report-modal-footer">
              <button type="button" className="btn-cancel" onClick={closeModal} disabled={submitting}>
                Hủy
              </button>
              <button type="button" className="btn-submit" onClick={handleSubmitReport} disabled={submitting}>
                {submitting ? "Đang gửi..." : "Gửi báo cáo"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .send-user-report-page {
          display: grid;
          gap: 16px;
          color: #0f172a;
        }

        .profile-card {
          border: 1px solid #dbe5ef;
          border-radius: 14px;
          background: #ffffff;
          padding: 16px;
        }

        .profile-card h1 {
          margin: 0 0 14px;
          font-size: clamp(22px, 2.4vw, 30px);
          line-height: 1.15;
        }

        .profile-grid {
          display: grid;
          grid-template-columns: 150px 1fr;
          gap: 14px;
        }

        .avatar-placeholder {
          border: 1px dashed #64748b;
          border-radius: 10px;
          min-height: 150px;
          display: grid;
          place-items: center;
          color: #475569;
          font-weight: 700;
          background: #f8fafc;
        }

        .field-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .field-grid label,
        .report-modal-body label {
          display: grid;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
        }

        .field-grid input,
        .report-modal-body select,
        .report-modal-body textarea {
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #fff;
          font-size: 14px;
          color: #0f172a;
          outline: none;
          padding: 9px 10px;
        }

        .field-grid input:focus,
        .report-modal-body select:focus,
        .report-modal-body textarea:focus {
          border-color: #0f766e;
          box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.12);
        }

        .report-actions {
          margin-top: 12px;
          display: flex;
          justify-content: flex-start;
          align-items: center;
        }

        .btn-report,
        .btn-cancel,
        .btn-submit {
          min-height: 36px;
          border-radius: 8px;
          border: 1px solid transparent;
          padding: 0 14px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .btn-report {
          background: #0f172a;
          color: #fff;
        }

        .btn-cancel {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #334155;
        }

        .btn-submit {
          background: #0f766e;
          color: #fff;
        }

        .btn-cancel:disabled,
        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .admin-restricted-note {
          border: 1px dashed #f59e0b;
          background: #fffbeb;
          color: #92400e;
          border-radius: 8px;
          padding: 8px 10px;
          font-size: 12px;
          font-weight: 600;
        }

        .report-success {
          margin: 12px 0 0;
          color: #047857;
          font-size: 13px;
          font-weight: 700;
        }

        .report-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1200;
          background: rgba(15, 23, 42, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          backdrop-filter: blur(2px);
        }

        .report-modal {
          width: min(760px, calc(100vw - 32px));
          border-radius: 12px;
          border: 1px solid #cbd5e1;
          background: #fff;
          box-shadow: 0 20px 45px rgba(15, 23, 42, 0.22);
          overflow: hidden;
        }

        .report-modal-header {
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
          padding: 12px 16px;
        }

        .report-modal-header h2 {
          margin: 0;
          font-size: 18px;
          color: #0f172a;
        }

        .report-modal-body {
          padding: 14px 16px;
          display: grid;
          gap: 10px;
        }

        .report-validation-error {
          margin: -2px 0 0;
          color: #dc2626;
          font-size: 12px;
          font-weight: 600;
        }

        .report-warning {
          margin: 2px 0 0;
          color: #b91c1c;
          font-size: 12px;
          font-weight: 600;
        }

        .report-modal-footer {
          border-top: 1px solid #e2e8f0;
          padding: 10px 16px;
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        @media (max-width: 880px) {
          .profile-grid {
            grid-template-columns: 1fr;
          }

          .avatar-placeholder {
            min-height: 120px;
          }
        }

        @media (max-width: 680px) {
          .field-grid {
            grid-template-columns: 1fr;
          }

          .report-modal-overlay {
            padding: 12px;
          }

          .report-modal {
            width: calc(100vw - 24px);
          }
        }
      `}</style>
    </div>
  );
};

export default SendUserReportPage;
