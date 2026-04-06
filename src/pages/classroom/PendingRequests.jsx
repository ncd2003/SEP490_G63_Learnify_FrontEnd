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
import { enrollmentApi } from '@/apis/enrollment.api';
import ApproveRequestsModal from './ApproveRequestsModal';
import RejectRequestsModal from './RejectRequestsModal';
import { copyToClipboard } from '@/lib/utils';
import '@/assets/css/pages/classroom/pendingRequests.css';

const PendingRequests = () => {
  const { id } = useParams();

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

  const fetchClassroomInfo = useCallback(async () => {
    try {
      const response = await classroomApi.getClassroomById(id);
      if (response.code === 1000) setClassroomInfo(response.result);
    } catch (err) {
      console.error('Error fetching classroom info:', err);
    }
  }, [id]);

  const fetchPendingRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await enrollmentApi.getPendingMembers(id);
      if (response.code === 1000) {
        setPendingRequests(response.result ?? []);
      } else {
        setError(response.message || 'Không thể tải danh sách yêu cầu');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Đã xảy ra lỗi khi tải dữ liệu');
      console.error('Error fetching pending requests:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchAcceptedMembers = useCallback(async () => {
    try {
      setMembersLoading(true);
      const response = await enrollmentApi.getAcceptedMembers(id);
      if (response.code === 1000) {
        setMembers(response.result ?? []);
      }
    } catch (err) {
      console.error('Error fetching accepted members:', err);
    } finally {
      setMembersLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchClassroomInfo();
    fetchAcceptedMembers();
    fetchPendingRequests();
  }, [fetchClassroomInfo, fetchAcceptedMembers, fetchPendingRequests]);

  /* ── Selection helpers ─────────────────────────────────────────────── */
  const allSelected =
    pendingRequests.length > 0 && selectedIds.length === pendingRequests.length;

  const handleSelectAll = (e) =>
    setSelectedIds(e.target.checked ? pendingRequests.map((r) => r.memberId) : []);

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
      const response = await enrollmentApi.approveRequests(id, pendingAction.ids);
      if (response.code === 1000) {
        setSuccess('Đã phê duyệt yêu cầu tham gia thành công.');
        setSelectedIds([]);
        await fetchAcceptedMembers();
        await fetchClassroomInfo();
        await fetchPendingRequests();
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
      const response = await enrollmentApi.rejectRequests(id, pendingAction.ids);
      if (response.code === 1000) {
        setSuccess('Đã từ chối các yêu cầu tham gia.');
        setSelectedIds([]);
        await fetchAcceptedMembers();
        await fetchClassroomInfo();
        await fetchPendingRequests();
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

                <button
                  type="button"
                  className="members-add-btn"
                  onClick={handleCopyClassCode}
                  disabled={!classroomInfo?.code}
                >
                  <UserPlus size={16} />
                  Thêm học sinh
                </button>
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
                        <th>Email</th>
                        <th>SĐT</th>
                        <th>Tham gia lúc</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.map((member) => (
                        <tr key={member.memberId}>
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
                          <td className="cell-email">{member.studentEmail || '—'}</td>
                          <td>{member.phoneNumber || '—'}</td>
                          <td className="cell-date">{formatDateTime(member.joinedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <aside className="members-sidecard">
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
                        key={request.memberId}
                        className={`pending-side-item ${selectedIds.includes(request.memberId) ? 'selected' : ''}`}
                      >
                        <label className="pending-side-item-top">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(request.memberId)}
                            onChange={() => handleSelectOne(request.memberId)}
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
                            onClick={() => openApprove([request.memberId])}
                          >
                            <CheckCircle size={13} />
                            Duyệt
                          </button>
                          <button
                            className="row-btn-reject"
                            title="Từ chối"
                            disabled={actionLoading}
                            onClick={() => openReject([request.memberId])}
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
            </aside>
          </div>
        </section>

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

export default PendingRequests;

