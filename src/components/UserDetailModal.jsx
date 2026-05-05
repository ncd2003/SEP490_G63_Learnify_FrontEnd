import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { userApi } from '@/apis/user.api';
import { reportApi } from '@/apis/report.api';
import { useAuth } from '@/contexts/AuthContext';
import '@/assets/css/pages/classroom/pendingRequests.css';

const REPORT_REASON_OPTIONS = [
  { value: '', label: '-- Chọn lý do --' },
  { value: 'SPAM', label: 'Spam' },
  { value: 'HARASSMENT', label: 'Quấy rối' },
  { value: 'INAPPROPRIATE_CONTENT', label: 'Nội dung phản cảm' },
];

const getInitials = (name) =>
  (name ?? '').split(' ').filter(Boolean).slice(-2).map((w) => w[0]).join('').toUpperCase() || '?';

const formatRoleLabel = (roleName) => {
  const role = (roleName || '').toUpperCase();
  if (role.includes('TEACHER')) return 'Giáo viên';
  if (role.includes('STUDENT')) return 'Học sinh';
  if (role.includes('ADMIN')) return 'Quản trị viên';
  return 'Người dùng';
};

/**
 * Reusable modal to display user details and allow reporting
 */
export default function UserDetailModal({ isOpen, onClose, userId, initialData }) {
  const { user } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetail, setReportDetail] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState('');
  const [reportSuccess, setReportSuccess] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);

  useEffect(() => {
    if (isOpen && userId) {
      setProfile(null);
      setProfileError('');
      setReportSuccess('');
      setIsReportModalOpen(false);
      setProfileLoading(true);
      
      userApi.getProfile(userId)
        .then(response => {
          if (response.code === 1000) {
            setProfile(response.result);
          } else {
            setProfileError(response.message || 'Không thể tải thông tin người dùng.');
          }
        })
        .catch(err => {
          setProfileError(err.response?.data?.message || 'Không thể tải thông tin người dùng.');
        })
        .finally(() => {
          setProfileLoading(false);
        });
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (!reportSubmitting) {
      onClose();
    }
  };

  const openReportUser = () => {
    setReportReason('');
    setReportDetail('');
    setReportError('');
    setReportSuccess('');
    setEvidenceFile(null);
    setIsReportModalOpen(true);
  };

  const closeReportModal = () => {
    if (reportSubmitting) return;
    setIsReportModalOpen(false);
    setReportError('');
  };

  const handleSubmitReport = async () => {
    if (!userId) return;

    setReportError('');
    setReportSuccess('');

    if (!reportReason) {
      setReportError('Vui lòng chọn ít nhất một lý do báo cáo.');
      return;
    }

    try {
      setReportSubmitting(true);
      const payload = {
        reportedUserId: userId,
        reason: reportReason,
      };

      if (reportDetail.trim()) {
        payload.detailedDescription = reportDetail.trim();
      }

      await reportApi.createUserReport(payload, evidenceFile);
      setReportSuccess('Cảm ơn bạn đã gửi báo cáo. Chúng tôi sẽ xem xét sớm nhất có thể.');
      setIsReportModalOpen(false);
      setTimeout(() => setReportSuccess(''), 3500);
    } catch (err) {
      const backendMessage = err?.response?.data?.message || 'Không thể gửi báo cáo. Vui lòng thử lại.';
      setReportError(backendMessage);
    } finally {
      setReportSubmitting(false);
    }
  };

  const displayAvatar = profile?.avatarUrl || initialData?.avatarUrl;
  const displayName = profile?.fullName || initialData?.fullName || '—';
  const displayRole = profile?.role || initialData?.roleName;
  const displayEmail = profile?.email || initialData?.email;
  const showContactDetails = true;

  return (
    <div className="member-detail-modal-overlay" onClick={handleClose} style={{ zIndex: 9999 }}>
      <div className="member-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="member-detail-modal-header">
          {!isReportModalOpen ? (
            <h3>Thông tin {formatRoleLabel(displayRole).toLowerCase()}</h3>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                type="button" 
                className="member-detail-back-btn" 
                onClick={closeReportModal}
                disabled={reportSubmitting}
                title="Quay lại thông tin"
                style={{ border: 'none', background: 'transparent', fontSize: '18px', cursor: 'pointer', padding: 0 }}
              >
                &larr;
              </button>
              <h3>Báo cáo người dùng</h3>
            </div>
          )}
          <button 
            type="button" 
            className="member-detail-close-icon" 
            onClick={handleClose}
            title="Đóng"
            style={{ border: 'none', background: 'transparent', fontSize: '18px', cursor: 'pointer' }}
          >
            &#10005;
          </button>
        </div>

        {reportSuccess && <div className="pending-requests-alert alert-success sidebar-alert">{reportSuccess}</div>}

        {!isReportModalOpen ? (
          /* --- PROFILE VIEW --- */
          profileLoading ? (
            <div className="pending-side-loading">
              <Loader2 size={16} className="spin" />
              <span>Đang tải hồ sơ...</span>
            </div>
          ) : profileError && !initialData ? (
            <div className="pending-requests-alert alert-error sidebar-alert">{profileError}</div>
          ) : (
            <div className="member-profile-card">
              <div className="member-profile-head">
                <div className="member-profile-avatar">
                  {displayAvatar ? (
                    <img src={displayAvatar} alt={displayName} />
                  ) : (
                    <span>{getInitials(displayName)}</span>
                  )}
                </div>
                <div className="member-profile-meta">
                  <strong>{displayName}</strong>
                  {displayRole && <span>{formatRoleLabel(displayRole)}</span>}
                  {showContactDetails && displayEmail && <span>{displayEmail}</span>}
                </div>
              </div>

              {showContactDetails && profile && (
                <div className="member-profile-info-list">
                  <div className="info-list-item">
                    <span className="info-list-icon">📞</span>
                    <div className="info-list-content">
                      <small>Số điện thoại</small>
                      <p>{profile.phoneNumber || '—'}</p>
                    </div>
                  </div>
                  <div className="info-list-item">
                    <span className="info-list-icon">📅</span>
                    <div className="info-list-content">
                      <small>Ngày sinh</small>
                      <p>{profile.birthDate || '—'}</p>
                    </div>
                  </div>
                  <div className="info-list-item">
                    <span className="info-list-icon">📍</span>
                    <div className="info-list-content">
                      <small>Địa chỉ</small>
                      <p>{profile.address || '—'}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="member-profile-actions">
                <button
                  type="button"
                  className="member-report-text-btn"
                  onClick={openReportUser}
                  disabled={Number(userId) === Number(user?.id) || reportSubmitting}
                >
                  🚩 {Number(userId) === Number(user?.id) ? 'Không thể tự báo cáo' : 'Báo cáo vi phạm'}
                </button>
              </div>
            </div>
          )
        ) : (
          /* --- REPORT FORM VIEW --- */
          <div className="report-swap-content">
            <label className="report-field">
              Lý do báo cáo *
              <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} disabled={reportSubmitting}>
                {REPORT_REASON_OPTIONS.map((option) => (
                  <option key={option.value || 'empty'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="report-field">
              Mô tả chi tiết (tùy chọn)
              <textarea
                rows={5}
                value={reportDetail}
                onChange={(e) => setReportDetail(e.target.value)}
                placeholder="Nhập nội dung chi tiết..."
                disabled={reportSubmitting}
              />
            </label>

            <label className="report-field">
              Minh chứng (tùy chọn)
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => setEvidenceFile(e.target.files[0] || null)}
                disabled={reportSubmitting}
                style={{ marginTop: '4px' }}
              />
              {evidenceFile && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                  Đã chọn: {evidenceFile.name} ({(evidenceFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </label>

            {reportError && <div className="pending-requests-alert alert-error sidebar-alert">{reportError}</div>}

            <div className="report-swap-actions">
              <button type="button" className="btn-cancel" onClick={closeReportModal} disabled={reportSubmitting}>
                Hủy
              </button>
              <button type="button" className="btn-danger" onClick={handleSubmitReport} disabled={reportSubmitting}>
                {reportSubmitting ? 'Đang gửi...' : 'Gửi báo cáo'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
