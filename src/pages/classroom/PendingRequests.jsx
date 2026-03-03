import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ClassroomDetailLayout from '@/components/ClassroomDetailLayout';
import classroomApi from '@/apis/classroomApi';
import ApproveRequestsModal from './ApproveRequestsModal';
import RejectRequestsModal from './RejectRequestsModal';
import '@/assets/css/pages/classroom/pendingRequests.css';

const PendingRequests = () => {
  const { id } = useParams(); // classroomId from URL
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [classroomInfo, setClassroomInfo] = useState(null);

  useEffect(() => {
    fetchClassroomInfo();
    fetchPendingRequests();
  }, [id]);

  const fetchClassroomInfo = async () => {
    try {
      const response = await classroomApi.getClassroomById(id);
      if (response.code === 1000) {
        setClassroomInfo(response.result);
      }
    } catch (err) {
      console.error('Error fetching classroom info:', err);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await classroomApi.getPendingRequests(id);
      if (response.code === 1000) {
        setPendingRequests(response.result || []);
      } else {
        setError('Không thể tải danh sách yêu cầu');
      }
    } catch (err) {
      setError('Đã xảy ra lỗi khi tải dữ liệu');
      console.error('Error fetching pending requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(pendingRequests.map((req) => req.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (requestId) => {
    setSelectedIds((prev) =>
      prev.includes(requestId)
        ? prev.filter((id) => id !== requestId)
        : [...prev, requestId]
    );
  };

  const handleApprove = () => {
    if (selectedIds.length === 0) {
      setError('Vui lòng chọn ít nhất một yêu cầu để duyệt');
      return;
    }
    setShowApproveModal(true);
  };

  const handleReject = () => {
    if (selectedIds.length === 0) {
      setError('Vui lòng chọn ít nhất một yêu cầu để từ chối');
      return;
    }
    setShowRejectModal(true);
  };

  const handleApproveConfirm = async () => {
    try {
      setError('');
      const response = await classroomApi.approveRequests(id, selectedIds);
      if (response.code === 1000) {
        setSuccess('Đã duyệt yêu cầu tham gia thành công'); // MSG44
        setSelectedIds([]);
        await fetchPendingRequests(); // Refresh list
        setTimeout(() => setSuccess(''), 3000);
      } else if (response.code === 48) {
        setError('Lớp học đã đạt sức chứa tối đa (60 học sinh)'); // MSG48
      } else {
        setError(response.message || 'Có lỗi xảy ra khi duyệt yêu cầu');
      }
    } catch (err) {
      setError('Đã xảy ra lỗi khi duyệt yêu cầu');
      console.error('Error approving requests:', err);
    } finally {
      setShowApproveModal(false);
    }
  };

  const handleRejectConfirm = async () => {
    try {
      setError('');
      const response = await classroomApi.rejectRequests(id, selectedIds);
      if (response.code === 1000) {
        setSuccess('Đã từ chối yêu cầu tham gia'); // MSG44
        setSelectedIds([]);
        await fetchPendingRequests(); // Refresh list
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(response.message || 'Có lỗi xảy ra khi từ chối yêu cầu');
      }
    } catch (err) {
      setError('Đã xảy ra lỗi khi từ chối yêu cầu');
      console.error('Error rejecting requests:', err);
    } finally {
      setShowRejectModal(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ClassroomDetailLayout>
      <div className="pending-requests-page">
        <h1 className="pending-requests-title">Yêu cầu tham gia đang chờ duyệt</h1>

        <div className="pending-requests-info-box">
          <div className="info-box-text">
            Lớp hiện đang có - {classroomInfo?.name || 'Lớp A'} / Sĩ số: {classroomInfo?.studentCount || 0}/{classroomInfo?.maxStudents || 60} học sinh
          </div>
          <div className="info-box-actions">
            <button
              className="btn-approve"
              onClick={handleApprove}
              disabled={selectedIds.length === 0}
            >
              Duyệt
            </button>
            <button
              className="btn-reject"
              onClick={handleReject}
              disabled={selectedIds.length === 0}
            >
              Từ chối
            </button>
          </div>
        </div>

        {error && (
          <div className="pending-requests-alert alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="pending-requests-alert alert-success">
            {success}
          </div>
        )}

        {loading ? (
          <div className="pending-requests-loading">Đang tải...</div>
        ) : pendingRequests.length === 0 ? (
          <div className="pending-requests-empty">
            Không có yêu cầu tham gia nào đang chờ duyệt
          </div>
        ) : (
          <div className="pending-requests-table-wrapper">
            <table className="pending-requests-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.length === pendingRequests.length &&
                        pendingRequests.length > 0
                      }
                      onChange={handleSelectAll}
                      aria-label="Chọn tất cả"
                    />
                  </th>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>Thời gian yêu cầu</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((request) => (
                  <tr key={request.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(request.id)}
                        onChange={() => handleSelectOne(request.id)}
                        aria-label={`Chọn ${request.studentName}`}
                      />
                    </td>
                    <td>{request.studentName}</td>
                    <td>{request.studentEmail}</td>
                    <td>{formatDateTime(request.requestTime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showApproveModal && (
          <ApproveRequestsModal
            count={selectedIds.length}
            onConfirm={handleApproveConfirm}
            onCancel={() => setShowApproveModal(false)}
          />
        )}

        {showRejectModal && (
          <RejectRequestsModal
            count={selectedIds.length}
            onConfirm={handleRejectConfirm}
            onCancel={() => setShowRejectModal(false)}
          />
        )}
      </div>
    </ClassroomDetailLayout>
  );
};

export default PendingRequests;
