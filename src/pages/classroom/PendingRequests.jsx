import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  Printer,
  UserPlus,
  List,
  ListFilter,
} from 'lucide-react';
import ClassroomDetailLayout from '@/components/ClassroomDetailLayout';
import { classroomApi } from '@/apis/classroom.api';
import { classroomMemberApi, ENROLLMENT_STATUS } from '@/apis/classroom-member.api';
import { userApi } from '@/apis/user.api';
import { reportApi } from '@/apis/report.api';
import { useAuth } from '@/contexts/AuthContext';
import ApproveRequestsModal from './ApproveRequestsModal';
import RejectRequestsModal from './RejectRequestsModal';
import { copyToClipboard } from '@/lib/utils';
import '@/assets/css/pages/classroom/pendingRequests.css';

const REPORT_REASON_OPTIONS = [
  { value: '', label: '-- Chọn lý do --' },
  { value: 'SPAM', label: 'Spam' },
  { value: 'HARASSMENT', label: 'Quấy rối' },
  { value: 'INAPPROPRIATE_CONTENT', label: 'Nội dung phản cảm' },
];

const getRequestActionId = (request) =>
  request?.studentId ?? request?.student?.id ?? request?.memberId ?? request?.id;

const mapAcceptedMember = (item) => {
  const student = item?.student ?? item ?? {};
  const createdAt = item?.createdAt ?? null;

  return {
    studentId: student?.id ?? item?.id ?? null,
    studentName: student?.fullName ?? item?.fullName ?? '—',
    studentEmail: student?.email ?? item?.email ?? '',
    roleName: student?.role ?? item?.role ?? '',
    phoneNumber: student?.phoneNumber ?? item?.phoneNumber ?? '',
    avatarUrl: student?.avatarUrl ?? item?.avatarUrl ?? null,
    joinedAt: item?.joinedAt ?? item?.acceptedAt ?? student?.joinedAt ?? createdAt,
  };
};

const mapClassroomMember = (item) => {
  const student = item?.student ?? {};

  return {
    memberId: item?.id ?? student?.id ?? null,
    status: item?.status ?? '',
    studentId: student?.id ?? null,
    studentName: student?.fullName ?? '—',
    studentEmail: student?.email ?? '',
    roleName: student?.role ?? '',
    phoneNumber: student?.phoneNumber ?? '',
    avatarUrl: student?.avatarUrl ?? null,
    joinedAt: item?.joinedAt ?? null,
    requestedAt: item?.requestedAt ?? null,
  };
};

const MemberClass = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const isTeacher = (user?.role || '').toUpperCase() === 'ROLE_TEACHER';

  const [pendingRequests, setPendingRequests] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [membersLoading, setMembersLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal]   = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // { type: 'approve'|'reject', ids: number[] }
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [classroomInfo, setClassroomInfo] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetail, setReportDetail] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState('');
  const [reportSuccess, setReportSuccess] = useState('');

  const fetchClassroomInfo = useCallback(async () => {
    try {
      const response = await classroomApi.getClassroomById(id);
      if (response.code === 1000) setClassroomInfo(response.result);
    } catch (err) {
      console.error('Error fetching classroom info:', err);
    }
  }, [id]);

  const fetchMembersByRole = useCallback(async () => {
    setMembersLoading(true);
    setError('');

    if (isTeacher) {
      setLoading(true);
    } else {
      setLoading(false);
      setPendingRequests([]);
    }

    try {
      if (isTeacher) {
        const response = await classroomMemberApi.getClassroomMembers(id);

        if (response.code === 1000) {
          const normalized = (response.result ?? [])
            .map(mapClassroomMember)
            .filter((item) => item.studentId);

          setMembers(
            normalized.filter(
              (item) => item.status === ENROLLMENT_STATUS.ACCEPTED,
            ),
          );
          setPendingRequests(
            normalized.filter(
              (item) => item.status === ENROLLMENT_STATUS.PENDING,
            ),
          );
        } else {
          setMembers([]);
          setPendingRequests([]);
          setError(response.message || 'Không thể tải danh sách thành viên');
        }

        return;
      }

      const response = await classroomMemberApi.getAcceptedMembers(id);
      if (response.code === 1000) {
        const nextMembers = (response.result ?? [])
          .map(mapAcceptedMember)
          .filter((item) => item.studentId);
        setMembers(nextMembers);
      } else {
        setMembers([]);
        setError(response.message || 'Không thể tải danh sách thành viên');
      }

      setPendingRequests([]);
    } catch (err) {
      setMembers([]);
      setPendingRequests([]);
      setError(err.response?.data?.message || 'Đã xảy ra lỗi khi tải dữ liệu');
      console.error('Error fetching classroom members:', err);
    } finally {
      setMembersLoading(false);
      setLoading(false);
    }
  }, [id, isTeacher]);

  useEffect(() => {
    fetchClassroomInfo();
    fetchMembersByRole();
  }, [fetchClassroomInfo, fetchMembersByRole]);

  /* ── Selection helpers ─────────────────────────────────────────────── */
  const allSelected =
    pendingRequests.length > 0 && selectedIds.length === pendingRequests.length;

  const handleSelectAll = (e) =>
    setSelectedIds(
      e.target.checked
        ? pendingRequests.map((r) => getRequestActionId(r)).filter(Boolean)
        : [],
    );

  const handleSelectOne = (reqId) =>
    setSelectedIds((prev) =>
      prev.includes(reqId) ? prev.filter((x) => x !== reqId) : [...prev, reqId]
    );

  /* ── Open confirm modals ───────────────────────────────────────────── */
  const openApprove = (ids) => {
    setError('');
    if (!ids.length) { setError('Vui lòng chọn ít nhất một yêu cầu để duyệt'); return; }
    setPendingAction({ type: 'approve', ids });
    setShowApproveModal(true);
  };

  const openReject = (ids) => {
    setError('');
    if (!ids.length) { setError('Vui lòng chọn ít nhất một yêu cầu để từ chối'); return; }
    setPendingAction({ type: 'reject', ids });
    setShowRejectModal(true);
  };

  /* ── Confirm handlers ──────────────────────────────────────────────── */
  const handleApproveConfirm = async () => {
    setShowApproveModal(false);
    setActionLoading(true);
    setError('');
    try {
      const response = await classroomMemberApi.approveRequests(id, pendingAction.ids);
      if (response.code === 1000) {
        setSuccess('Đã phê duyệt yêu cầu tham gia thành công.');
        setSelectedIds([]);
        await fetchMembersByRole();
        await fetchClassroomInfo();
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setError(response.message || 'Có lỗi xảy ra khi duyệt yêu cầu');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Đã xảy ra lỗi khi duyệt yêu cầu');
    } finally {
      setActionLoading(false);
      setPendingAction(null);
    }
  };

  const handleRejectConfirm = async () => {
    setShowRejectModal(false);
    setActionLoading(true);
    setError('');
    try {
      const response = await classroomMemberApi.rejectRequests(id, pendingAction.ids);
      if (response.code === 1000) {
        setSuccess('Đã từ chối các yêu cầu tham gia.');
        setSelectedIds([]);
        await fetchMembersByRole();
        await fetchClassroomInfo();
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setError(response.message || 'Có lỗi xảy ra khi từ chối yêu cầu');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Đã xảy ra lỗi khi từ chối yêu cầu');
    } finally {
      setActionLoading(false);
      setPendingAction(null);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const getInitials = (name) =>
    (name ?? '').split(' ').filter(Boolean).slice(-2).map((w) => w[0]).join('').toUpperCase() || '?';

  const formatRoleLabel = (roleName) => {
    const role = (roleName || '').toUpperCase();
    if (role.includes('TEACHER')) return 'Giáo viên';
    if (role.includes('STUDENT')) return 'Học sinh';
    if (role.includes('ADMIN')) return 'Quản trị viên';
    return 'Người dùng';
  };

  const openReportUser = () => {
    if (!selectedMember?.studentId) return;
    setReportReason('');
    setReportDetail('');
    setReportError('');
    setReportSuccess('');
    setIsReportModalOpen(true);
  };

  const closeReportModal = () => {
    if (reportSubmitting) return;
    setIsReportModalOpen(false);
    setReportError('');
  };

  const handleSubmitReport = async () => {
    const targetId = Number(selectedMember?.studentId);
    if (!targetId) return;

    setReportError('');
    setReportSuccess('');

    if (!reportReason) {
      setReportError('MSG136: Vui lòng chọn ít nhất một lý do báo cáo.');
      return;
    }

    try {
      setReportSubmitting(true);
      const payload = {
        reportedUserId: targetId,
        reason: reportReason,
      };

      if (reportDetail.trim()) {
        payload.detailedDescription = reportDetail.trim();
      }

      await reportApi.createUserReport(payload);
      setReportSuccess('MSG134 (Success): Cảm ơn bạn đã gửi báo cáo. Chúng tôi sẽ xem xét sớm nhất có thể.');
      setIsReportModalOpen(false);
      setTimeout(() => setReportSuccess(''), 3500);
    } catch (err) {
      const backendMessage = err?.response?.data?.message || 'Không thể gửi báo cáo. Vui lòng thử lại.';
      setReportError(backendMessage);
    } finally {
      setReportSubmitting(false);
    }
  };

  const openMemberDetail = async (member) => {
    setSelectedMember(member);
    setIsMemberModalOpen(true);
    setSelectedProfile(null);
    setProfileError('');
    setProfileLoading(true);

    try {
      const response = await userApi.getProfile(member.studentId);
      if (response.code === 1000) {
        setSelectedProfile(response.result);
      } else {
        setProfileError(response.message || 'Không thể tải thông tin người dùng.');
      }
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Không thể tải thông tin người dùng.');
    } finally {
      setProfileLoading(false);
    }
  };

  const closeMemberModal = () => {
    setIsMemberModalOpen(false);
    setIsReportModalOpen(false);
  };

  const filteredMembers = members.filter((member) => {
    const keyword = memberSearch.trim().toLowerCase();
    if (!keyword) return true;
    const name = (member.studentName ?? '').toLowerCase();
    const email = (member.studentEmail ?? '').toLowerCase();
    const phone = (member.phoneNumber ?? '').toLowerCase();
    return name.includes(keyword) || email.includes(keyword) || phone.includes(keyword);
  });

  const handleCopyClassCode = async () => {
    if (!classroomInfo?.code) return;
    await copyToClipboard(classroomInfo.code, 'Mã lớp');
  };

  const handlePrintMembers = () => {
    window.print();
  };

  const classSize = members.length || classroomInfo?.studentCount || 0;

  return (
    <ClassroomDetailLayout>
      <div className="pending-requests-page">
        <section className="members-panel">
          <header className="members-panel-header">
            <h2>Thành viên lớp học ({classSize})</h2>
          </header>

          <div className="members-layout">
            <div className="members-main">
              <div className="members-toolbar">
                <div className="members-view-toggle" aria-hidden="true">
                  <button type="button" className="toggle-btn active">
                    <List size={18} />
                  </button>
                  <button type="button" className="toggle-btn">
                    <ListFilter size={18} />
                  </button>
                </div>

                <label className="members-search-box">
                  <Search size={18} />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Nhập và ấn enter để tìm kiếm"
                  />
                </label>

                <button
                  type="button"
                  className="members-icon-btn"
                  onClick={handlePrintMembers}
                  title="In danh sách"
                >
                  <Printer size={18} />
                </button>

                {isTeacher && (
                  <button
                    type="button"
                    className="members-add-btn"
                    onClick={handleCopyClassCode}
                    disabled={!classroomInfo?.code}
                  >
                    <UserPlus size={16} />
                    Thêm học sinh
                  </button>
                )}
              </div>

              {membersLoading ? (
                <div className="class-members-loading">
                  <Loader2 size={20} className="spin" />
                  <span>Đang tải thành viên lớp học...</span>
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="class-members-empty">
                  {memberSearch.trim() ? 'Không tìm thấy thành viên phù hợp.' : 'Chưa có học sinh nào trong lớp.'}
                </div>
              ) : (
                <div className="class-members-table-wrapper">
                  <table className="class-members-table">
                    <thead>
                      <tr>
                        <th>Họ và tên</th>
                        <th>Vai trò</th>
                        <th>Email</th>
                        <th>SĐT</th>
                        <th>Tham gia lúc</th>
                        <th>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.map((member) => (
                        <tr key={`${member.memberId || 'u'}-${member.studentId}`}>
                          <td>
                            <div className="student-cell">
                              <div className="student-avatar">
                                {member.avatarUrl ? (
                                  <img src={member.avatarUrl} alt={member.studentName} />
                                ) : (
                                  <span>{getInitials(member.studentName)}</span>
                                )}
                              </div>
                              <span className="student-name">{member.studentName}</span>
                            </div>
                          </td>
                          <td>{formatRoleLabel(member.roleName)}</td>
                          <td className="cell-email">{member.studentEmail || '—'}</td>
                          <td>{member.phoneNumber || '—'}</td>
                          <td className="cell-date">{formatDateTime(member.joinedAt)}</td>
                          <td>
                            <button
                              type="button"
                              className="member-view-btn"
                              onClick={() => openMemberDetail(member)}
                            >
                              Xem
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <aside className="members-sidecard">
              {isTeacher ? (
                <>
                  <h3>Chờ duyệt • {pendingRequests.length}</h3>
                  <p>
                    Yêu cầu vào lớp sẽ được hiển thị khi có học sinh tham gia bằng mã lớp
                    {' '}
                    <strong>{classroomInfo?.code || '—'}</strong>
                  </p>

                  {error && <div className="pending-requests-alert alert-error sidebar-alert">{error}</div>}
                  {success && <div className="pending-requests-alert alert-success sidebar-alert">{success}</div>}

                  {loading ? (
                    <div className="pending-side-loading">
                      <Loader2 size={16} className="spin" />
                      <span>Đang tải yêu cầu...</span>
                    </div>
                  ) : pendingRequests.length === 0 ? (
                    <div className="pending-side-empty">Hiện chưa có yêu cầu đang chờ duyệt.</div>
                  ) : (
                    <>
                      <label className="pending-side-selectall">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={handleSelectAll}
                          aria-label="Chọn tất cả yêu cầu"
                        />
                        <span>Chọn tất cả</span>
                      </label>

                      <div className="pending-side-list">
                        {pendingRequests.map((request) => (
                          <div
                            key={request.memberId ?? request.studentId}
                            className={`pending-side-item ${selectedIds.includes(getRequestActionId(request)) ? 'selected' : ''}`}
                          >
                            <label className="pending-side-item-top">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(getRequestActionId(request))}
                                onChange={() => handleSelectOne(getRequestActionId(request))}
                                aria-label={`Chọn ${request.studentName}`}
                              />
                              <div className="pending-side-student">
                                <span className="pending-side-name">{request.studentName}</span>
                                <span className="pending-side-email">{request.studentEmail || '—'}</span>
                                <span className="pending-side-time">{formatDateTime(request.requestedAt)}</span>
                              </div>
                            </label>

                            <div className="pending-side-item-actions">
                              <button
                                className="row-btn-approve"
                                title="Duyệt"
                                disabled={actionLoading}
                                onClick={() => openApprove([getRequestActionId(request)])}
                              >
                                <CheckCircle size={13} />
                                Duyệt
                              </button>
                              <button
                                className="row-btn-reject"
                                title="Từ chối"
                                disabled={actionLoading}
                                onClick={() => openReject([getRequestActionId(request)])}
                              >
                                <XCircle size={13} />
                                Từ chối
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pending-side-actions">
                        <button
                          className="btn-approve"
                          onClick={() => openApprove(selectedIds)}
                          disabled={selectedIds.length === 0 || actionLoading}
                        >
                          {actionLoading ? <Loader2 size={14} className="spin" /> : <CheckCircle size={14} />}
                          Duyệt {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() => openReject(selectedIds)}
                          disabled={selectedIds.length === 0 || actionLoading}
                        >
                          {actionLoading ? <Loader2 size={14} className="spin" /> : <XCircle size={14} />}
                          Từ chối {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
                        </button>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <h3>Danh sách thành viên</h3>
                  <p>Bấm vào nút Xem trong cột Hành động để xem chi tiết và gửi báo cáo.</p>
                </>
              )}
            </aside>
          </div>
        </section>

        {isMemberModalOpen && (
          <div className="member-detail-modal-overlay" onClick={closeMemberModal}>
            <div className="member-detail-modal" onClick={(e) => e.stopPropagation()}>
              <div className="member-detail-modal-header">
                {!isReportModalOpen ? (
                  <h3>Thông tin {formatRoleLabel(selectedMember?.roleName).toLowerCase()}</h3>
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
                  onClick={closeMemberModal}
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
                ) : profileError ? (
                  <div className="pending-requests-alert alert-error sidebar-alert">{profileError}</div>
                ) : selectedMember ? (
                  <div className="member-profile-card">
                    <div className="member-profile-head">
                      <div className="member-profile-avatar">
                        {selectedProfile?.avatarUrl ? (
                          <img src={selectedProfile.avatarUrl} alt={selectedProfile.fullName || selectedMember.studentName} />
                        ) : (
                          <span>{getInitials(selectedProfile?.fullName || selectedMember.studentName)}</span>
                        )}
                      </div>
                      <div className="member-profile-meta">
                        <strong>{selectedProfile?.fullName || selectedMember.studentName || '—'}</strong>
                        <span>{formatRoleLabel(selectedMember.roleName)}</span>
                        <span>{selectedProfile?.email || selectedMember.studentEmail || '—'}</span>
                      </div>
                    </div>

                    <div className="member-profile-info-list">
                      <div className="info-list-item">
                        <span className="info-list-icon">📞</span>
                        <div className="info-list-content">
                          <small>Số điện thoại</small>
                          <p>{selectedProfile?.phoneNumber || selectedMember.phoneNumber || '—'}</p>
                        </div>
                      </div>
                      <div className="info-list-item">
                        <span className="info-list-icon">📅</span>
                        <div className="info-list-content">
                          <small>Ngày sinh</small>
                          <p>{selectedProfile?.birthDate || '—'}</p>
                        </div>
                      </div>
                      <div className="info-list-item">
                        <span className="info-list-icon">📍</span>
                        <div className="info-list-content">
                          <small>Địa chỉ</small>
                          <p>{selectedProfile?.address || '—'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="member-profile-actions">
                      <button
                        type="button"
                        className="member-report-text-btn"
                        onClick={openReportUser}
                        disabled={Number(selectedMember.studentId) === Number(user?.id) || reportSubmitting}
                      >
                        🚩 {Number(selectedMember.studentId) === Number(user?.id) ? 'Không thể tự báo cáo' : 'Báo cáo vi phạm'}
                      </button>
                    </div>
                  </div>
                ) : null
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
        )}

        {/* Modals */}
        {showApproveModal && (
          <ApproveRequestsModal
            count={pendingAction?.ids.length ?? 0}
            onConfirm={handleApproveConfirm}
            onCancel={() => { setShowApproveModal(false); setPendingAction(null); }}
          />
        )}
        {showRejectModal && (
          <RejectRequestsModal
            count={pendingAction?.ids.length ?? 0}
            onConfirm={handleRejectConfirm}
            onCancel={() => { setShowRejectModal(false); setPendingAction(null); }}
          />
        )}
      </div>
    </ClassroomDetailLayout>
  );
};

export default MemberClass;

