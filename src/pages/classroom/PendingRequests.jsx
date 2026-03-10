import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Users, Clock } from 'lucide-react';
import ClassroomDetailLayout from '@/components/ClassroomDetailLayout';
import { classroomApi } from '@/apis/classroom.api';
import { enrollmentApi } from '@/apis/enrollment.api';
import ApproveRequestsModal from './ApproveRequestsModal';
import RejectRequestsModal from './RejectRequestsModal';
import '@/assets/css/pages/classroom/pendingRequests.css';

const PendingRequests = () => {
  const { id } = useParams();

  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
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

  useEffect(() => {
    fetchClassroomInfo();
    fetchPendingRequests();
  }, [fetchClassroomInfo, fetchPendingRequests]);

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

  return (
    <ClassroomDetailLayout>
      <div className="pending-requests-page">
        <h1 className="pending-requests-title">Yêu cầu tham gia đang chờ duyệt</h1>

        {/* Info box */}
        <div className="pending-requests-info-box">
          <div className="info-box-left">
            <div className="info-box-class">
              <span className="info-label">Lớp:</span>
              <span className="info-value">{classroomInfo?.name || '—'}</span>
            </div>
            <div className="info-box-capacity">
              <Users size={14} />
              <span>Sĩ số: {classroomInfo?.studentCount ?? 0}{classroomInfo?.maxStudents ? ` / ${classroomInfo.maxStudents}` : ''}</span>
              <span className="info-separator">•</span>
              <Clock size={14} />
              <span>Đang chờ: <strong>{pendingRequests.length}</strong></span>
            </div>
          </div>
          <div className="info-box-right">
            <span className="pending-badge">Yêu cầu đang chờ (Pending)</span>
            <span className="info-hint">Chọn nhiều hàng để xử lý đồng thời</span>
          </div>
        </div>

        {/* Bulk action buttons */}
        <div className="pending-bulk-actions">
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

        {/* Alerts */}
        {error && <div className="pending-requests-alert alert-error">{error}</div>}
        {success && <div className="pending-requests-alert alert-success">{success}</div>}

        {/* Table */}
        {loading ? (
          <div className="pending-requests-loading">
            <Loader2 size={28} className="spin" />
            <span>Đang tải danh sách yêu cầu...</span>
          </div>
        ) : pendingRequests.length === 0 ? (
          <div className="pending-requests-empty">
            <CheckCircle size={40} className="empty-check-icon" />
            <p className="empty-title">Không có yêu cầu nào đang chờ duyệt</p>
            <p className="empty-desc">Tất cả yêu cầu tham gia đã được xử lý.</p>
          </div>
        ) : (
          <div className="pending-requests-table-wrapper">
            <table className="pending-requests-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleSelectAll}
                      aria-label="Chọn tất cả"
                    />
                  </th>
                  <th>Học sinh</th>
                  <th>Email</th>
                  <th>Thời gian yêu cầu</th>
                  <th className="col-actions">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((request) => (
                  <tr
                    key={request.memberId}
                    className={selectedIds.includes(request.memberId) ? 'row-selected' : ''}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(request.memberId)}
                        onChange={() => handleSelectOne(request.memberId)}
                        aria-label={`Chọn ${request.studentName}`}
                      />
                    </td>
                    <td>
                      <div className="student-cell">
                        <div className="student-avatar">
                          {request.avatarUrl ? (
                            <img src={request.avatarUrl} alt={request.studentName} />
                          ) : (
                            <span>{getInitials(request.studentName)}</span>
                          )}
                        </div>
                        <span className="student-name">{request.studentName}</span>
                      </div>
                    </td>
                    <td className="cell-email">{request.studentEmail}</td>
                    <td className="cell-date">{formatDateTime(request.requestedAt)}</td>
                    <td className="cell-row-actions">
                      <button
                        className="row-btn-approve"
                        title="Duyệt"
                        disabled={actionLoading}
                        onClick={() => openApprove([request.memberId])}
                      >
                        <CheckCircle size={15} />
                        Duyệt
                      </button>
                      <button
                        className="row-btn-reject"
                        title="Từ chối"
                        disabled={actionLoading}
                        onClick={() => openReject([request.memberId])}
                      >
                        <XCircle size={15} />
                        Từ chối
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

export default PendingRequests;

