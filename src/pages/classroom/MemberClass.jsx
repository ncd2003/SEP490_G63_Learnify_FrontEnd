import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  Printer,
  UserPlus,
  List,
  ListFilter,
  X,
} from 'lucide-react';
import ClassroomDetailLayout from '@/components/ClassroomDetailLayout';
import { classroomApi } from '@/apis/classroom.api';
import { classroomMemberApi, ENROLLMENT_STATUS } from '@/apis/classroom-member.api';
import { userApi } from '@/apis/user.api';
import { reportApi } from '@/apis/report.api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import ApproveRequestsModal from './ApproveRequestsModal';
import RejectRequestsModal from './RejectRequestsModal';
import '@/assets/css/pages/classroom/pendingRequests.css';

const REPORT_REASON_OPTIONS = [
  { value: '', label: '-- Chọn lý do --' },
  { value: 'SPAM', label: 'Spam' },
  { value: 'HARASSMENT', label: 'Quấy rối' },
  { value: 'INAPPROPRIATE_CONTENT', label: 'Nội dung phản cảm' },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (value = '') => value.trim().toLowerCase();

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
  const navigate = useNavigate();
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
  const [activeTeacherTab, setActiveTeacherTab] = useState('members');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteInput, setInviteInput] = useState('');
  const [inviteEmails, setInviteEmails] = useState([]);
  const [inviteInputFocused, setInviteInputFocused] = useState(false);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteLookupResults, setInviteLookupResults] = useState([]);
  const [inviteLookupLoading, setInviteLookupLoading] = useState(false);
  const [inviteLookupError, setInviteLookupError] = useState('');

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
          setError(response.message || 'Không thể tải danh sách thành viên lớp học lúc này. Vui lòng thử lại sau.');
          toast.error('Không thể tải danh sách thành viên lớp học lúc này. Vui lòng thử lại sau.');
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
        setError(response.message || 'Không thể tải danh sách thành viên lớp học lúc này. Vui lòng thử lại sau.');
        toast.error('Không thể tải danh sách thành viên lớp học lúc này. Vui lòng thử lại sau.');
      }

      setPendingRequests([]);
    } catch (err) {
      setMembers([]);
      setPendingRequests([]);
      if (err.response?.status === 403) {
        toast.error('Bạn không có quyền truy cập tài nguyên này');
        navigate(`/classrooms/${id}/feed`);
      } else {
        setError(err.response?.data?.message || 'Không thể tải danh sách thành viên lớp học lúc này. Vui lòng thử lại sau.');
        toast.error('Không thể tải danh sách thành viên lớp học lúc này. Vui lòng thử lại sau.');
      }
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

  const emailDirectory = useMemo(() => {
    const source = [...members, ...pendingRequests]
      .map((item) => {
        const email = normalizeEmail(item.studentEmail || '');
        if (!email) return null;

        return {
          email,
          label: item.studentName || email,
          subtitle: item.status === ENROLLMENT_STATUS.PENDING ? 'Đang chờ duyệt' : 'Thành viên lớp',
        };
      })
      .filter(Boolean);

    const unique = new Map();
    source.forEach((item) => {
      if (!unique.has(item.email)) unique.set(item.email, item);
    });

    return [...unique.values()];
  }, [members, pendingRequests]);

  useEffect(() => {
    if (!isInviteModalOpen) {
      setInviteLookupResults([]);
      setInviteLookupLoading(false);
      setInviteLookupError('');
      return;
    }

    const keyword = normalizeEmail(inviteInput);

    if (!keyword) {
      setInviteLookupResults([]);
      setInviteLookupLoading(false);
      setInviteLookupError('');
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setInviteLookupLoading(true);
      setInviteLookupError('');

      try {
        const response = await userApi.searchStudentsByEmail(keyword);

        const users = response?.result ?? [];
        const normalizedUsers = (Array.isArray(users) ? users : [])
          .map((item) => {
            const email = normalizeEmail(item?.email ?? '');
            if (!email) return null;

            return {
              email,
              label: item?.fullName || email,
              subtitle: 'Người dùng trong hệ thống',
            };
          })
          .filter(Boolean);

        if (!cancelled) {
          setInviteLookupResults(normalizedUsers);
        }
      } catch (err) {
        if (!cancelled) {
          setInviteLookupResults([]);
          setInviteLookupError(err?.response?.data?.message || 'Không thể tải gợi ý người dùng.');
        }
      } finally {
        if (!cancelled) {
          setInviteLookupLoading(false);
        }
      }
    }, 280);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [inviteInput, isInviteModalOpen]);

  const inviteSuggestions = useMemo(() => {
    const keyword = normalizeEmail(inviteInput);
    const selectedSet = new Set(inviteEmails.map((email) => normalizeEmail(email)));

    const combined = new Map();

    const addSuggestion = (item, fallbackSubtitle = '', disabled = false) => {
      const email = normalizeEmail(item?.email || '');
      if (!email || selectedSet.has(email) || combined.has(email)) return;

      combined.set(email, {
        email,
        label: item?.label || email,
        subtitle: item?.subtitle || fallbackSubtitle,
        disabled: disabled,
      });
    };

    const classMatches = keyword
      ? emailDirectory.filter((item) => item.email.includes(keyword) || item.label.toLowerCase().includes(keyword))
      : emailDirectory;

    classMatches.forEach((item) => {
      addSuggestion(item, item.subtitle || 'Đã có trong lớp', true);
    });

    inviteLookupResults.forEach((item) => {
      addSuggestion(item, 'Người dùng trong hệ thống', false);
    });

    const filtered = [...combined.values()];

    if (keyword && EMAIL_REGEX.test(keyword) && !selectedSet.has(keyword)) {
      return [
        {
          email: keyword,
          label: keyword,
          subtitle: 'Nhập để gửi lời mời nếu chưa có tài khoản',
        },
        ...filtered,
      ];
    }

    return filtered;
  }, [emailDirectory, inviteEmails, inviteInput, inviteLookupResults]);

  const addInviteEmails = useCallback((values) => {
    const nextEmails = [];
    const seen = new Set(inviteEmails.map((email) => normalizeEmail(email)));

    values.forEach((rawValue) => {
      const email = normalizeEmail(rawValue);
      if (!email || seen.has(email)) return;
      seen.add(email);
      nextEmails.push(email);
    });

    if (!nextEmails.length) return;

    setInviteEmails((prev) => [...prev, ...nextEmails]);
    setInviteInput('');
    setInviteError('');
  }, [inviteEmails]);

  const commitInviteDraft = useCallback(() => {
    const values = inviteInput
      .split(/[,;\n\t ]+/)
      .map((value) => value.trim())
      .filter(Boolean);

    if (!values.length) return;

    const invalidEmails = values.filter((value) => !EMAIL_REGEX.test(normalizeEmail(value)));
    if (invalidEmails.length) {
      setInviteError('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }

    addInviteEmails(values);
  }, [addInviteEmails, inviteInput]);

  const openInviteModal = () => {
    setInviteError('');
    setInviteInput('');
    setInviteEmails([]);
    setInviteInputFocused(false);
    setIsInviteModalOpen(true);
  };

  const closeInviteModal = () => {
    if (inviteSubmitting) return;
    setIsInviteModalOpen(false);
    setInviteInput('');
    setInviteEmails([]);
    setInviteInputFocused(false);
    setInviteError('');
  };

  const handleInviteSubmit = async () => {
    const draftEmails = inviteInput
      .split(/[,;\n\t ]+/)
      .map((value) => normalizeEmail(value))
      .filter(Boolean);

    const candidateEmails = [...inviteEmails, ...draftEmails];
    const uniqueEmails = [...new Set(candidateEmails.map((email) => normalizeEmail(email)))].filter(Boolean);

    if (!uniqueEmails.length) {
      setInviteError('Vui lòng nhập ít nhất một email.');
      return;
    }

    const invalidEmails = uniqueEmails.filter((email) => !EMAIL_REGEX.test(email));
    if (invalidEmails.length) {
      setInviteError('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }

    try {
      setInviteSubmitting(true);
      setInviteError('');
      const response = await classroomMemberApi.inviteStudents(Number(id), uniqueEmails.join(','));

      if (response.code === 1000) {
        setSuccess(response.message || 'Đã gửi lời mời tham gia lớp học thành công.');
        setIsInviteModalOpen(false);
        setInviteInput('');
        setInviteEmails([]);
        setInviteInputFocused(false);
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setInviteError(response.message || 'Không thể gửi lời mời.');
      }
    } catch (err) {
      setInviteError(err.response?.data?.message || 'Không thể gửi lời mời. Vui lòng thử lại sau.');
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleInviteKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',' || event.key === 'Tab') {
      if (inviteInput.trim()) {
        event.preventDefault();
        commitInviteDraft();
      }
      return;
    }

    if (event.key === 'Backspace' && !inviteInput && inviteEmails.length > 0) {
      setInviteEmails((prev) => prev.slice(0, -1));
    }
  };

  const handleInvitePaste = (event) => {
    const pastedText = event.clipboardData.getData('text');
    if (!pastedText) return;

    const values = pastedText
      .split(/[,;\n\t ]+/)
      .map((value) => value.trim())
      .filter(Boolean);

    if (!values.length) return;

    event.preventDefault();

    const invalidEmails = values.filter((value) => !EMAIL_REGEX.test(normalizeEmail(value)));
    if (invalidEmails.length) {
      setInviteError('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }

    addInviteEmails(values);
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

  const handleCopyClassCode = () => {
    openInviteModal();
  };

  const handlePrintMembers = () => {
    window.print();
  };

  const classSize = members.length || classroomInfo?.studentCount || 0;
  const pendingCount = pendingRequests.length;

  const showContactDetails = isTeacher;

  // Separate teachers and students
  const teacherMembers = filteredMembers.filter(m => (m.roleName || '').toUpperCase().includes('TEACHER'));
  
  // Add from classroomInfo if not found in list (fallback)
  if (teacherMembers.length === 0 && classroomInfo?.teacher?.id) {
    const t = classroomInfo.teacher;
    teacherMembers.push({
      studentId: t.id,
      studentName: t.fullName || 'Giáo viên',
      studentEmail: t.email,
      phoneNumber: t.phoneNumber,
      avatarUrl: t.avatarUrl,
      roleName: 'ROLE_TEACHER',
      joinedAt: null,
    });
  }

  // To prevent duplicates and keep students
  const studentMembers = filteredMembers.filter(m => !teacherMembers.some(t => t.studentId === m.studentId))
    .sort((a, b) => (a.studentName || '').localeCompare(b.studentName || ''));

  return (
    <ClassroomDetailLayout>
      <div className="pending-requests-page">
        <section className="members-panel">
          <header className="members-panel-header">
            <h2>Thành viên lớp học ({classSize})</h2>
          </header>

          {isTeacher && (
            <div className="members-tabs" role="tablist" aria-label="Phân loại thành viên lớp học">
              <button
                type="button"
                className={`members-tab ${activeTeacherTab === 'members' ? 'active' : ''}`}
                onClick={() => setActiveTeacherTab('members')}
                role="tab"
                aria-selected={activeTeacherTab === 'members'}
              >
                Danh sách thành viên
              </button>
              <button
                type="button"
                className={`members-tab ${activeTeacherTab === 'pending' ? 'active' : ''}`}
                onClick={() => setActiveTeacherTab('pending')}
                role="tab"
                aria-selected={activeTeacherTab === 'pending'}
              >
                Yêu cầu phê duyệt
                {pendingCount > 0 && (
                  <span className="members-tab-badge">{pendingCount}</span>
                )}
              </button>
            </div>
          )}

          {(!isTeacher || activeTeacherTab === 'members') && (
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
              ) : filteredMembers.length === 0 && teacherMembers.length === 0 ? (
                <div className="class-members-empty">
                  {memberSearch.trim() ? 'Không tìm thấy thành viên phù hợp.' : 'Chưa có thành viên nào trong lớp.'}
                </div>
              ) : (
                <div className="class-members-roster">
                  {teacherMembers.length > 0 && (
                    <div className="roster-section" style={{ marginBottom: '24px' }}>
                      <h3 style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '12px', marginBottom: '16px' }}>Giáo viên</h3>
                      <div className="class-members-table-wrapper">
                        <table className="class-members-table">
                          <thead>
                            <tr>
                              <th>Họ và tên</th>
                              {showContactDetails && <th>Email</th>}
                              {showContactDetails && <th>SĐT</th>}
                              <th>Hành động</th>
                            </tr>
                          </thead>
                          <tbody>
                            {teacherMembers.map((member) => (
                              <tr key={`teacher-${member.studentId}`}>
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
                                {showContactDetails && <td className="cell-email">{member.studentEmail || '—'}</td>}
                                {showContactDetails && <td>{member.phoneNumber || '—'}</td>}
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
                    </div>
                  )}

                  <div className="roster-section">
                    <h3 style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '12px', marginBottom: '16px' }}>Học sinh ({studentMembers.length})</h3>
                    {studentMembers.length === 0 ? (
                      <p style={{ color: '#6b7280' }}>Chưa có học sinh nào.</p>
                    ) : (
                      <div className="class-members-table-wrapper">
                        <table className="class-members-table">
                          <thead>
                            <tr>
                              <th>Họ và tên</th>
                              {showContactDetails && <th>Email</th>}
                              {showContactDetails && <th>SĐT</th>}
                              {showContactDetails && <th>Tham gia lúc</th>}
                              <th>Hành động</th>
                            </tr>
                          </thead>
                          <tbody>
                            {studentMembers.map((member) => (
                              <tr key={`student-${member.studentId}`}>
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
                                {showContactDetails && <td className="cell-email">{member.studentEmail || '—'}</td>}
                                {showContactDetails && <td>{member.phoneNumber || '—'}</td>}
                                {showContactDetails && <td className="cell-date">{formatDateTime(member.joinedAt)}</td>}
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
                </div>
              )}
            </div>
          )}

          {isTeacher && activeTeacherTab === 'pending' && (
            <section className="pending-tab-panel">
              <div className="members-sidecard pending-tab-card">
                <h3>Chờ duyệt • {pendingCount}</h3>
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
                ) : pendingCount === 0 ? (
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

                    <div className="pending-side-list pending-tab-list">
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

                    <div className="pending-side-actions pending-tab-actions">
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
              </div>
            </section>
          )}
        </section>

        {isMemberModalOpen && (
          <div className="member-detail-modal-overlay" onClick={closeMemberModal}>
            <div className="member-detail-modal" onClick={(e) => e.stopPropagation()}>
              <div className="member-detail-modal-header">
                <h3>Thông tin người dùng</h3>
                <button type="button" className="member-detail-close" onClick={closeMemberModal}>Đóng</button>
              </div>

              {reportSuccess && <div className="pending-requests-alert alert-success sidebar-alert">{reportSuccess}</div>}

              {profileLoading ? (
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
                      {showContactDetails && <span>{selectedProfile?.email || selectedMember.studentEmail || '—'}</span>}
                    </div>
                  </div>

                  {showContactDetails && (
                    <div className="member-profile-grid">
                      <div>
                        <small>Số điện thoại</small>
                        <p>{selectedProfile?.phoneNumber || selectedMember.phoneNumber || '—'}</p>
                      </div>
                      <div>
                        <small>Ngày sinh</small>
                        <p>{selectedProfile?.birthDate || '—'}</p>
                      </div>
                      <div className="member-profile-address">
                        <small>Địa chỉ</small>
                        <p>{selectedProfile?.address || '—'}</p>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    className="member-report-btn"
                    onClick={openReportUser}
                    disabled={Number(selectedMember.studentId) === Number(user?.id) || reportSubmitting}
                  >
                    {Number(selectedMember.studentId) === Number(user?.id) ? 'Không thể tự báo cáo chính mình' : 'Báo cáo người dùng'}
                  </button>
                </div>
              ) : null}

              {isReportModalOpen && (
                <div className="report-inline-modal">
                  <div className="report-inline-modal-head">
                    <h4>Báo cáo người dùng</h4>
                    <button type="button" className="member-detail-close" onClick={closeReportModal} disabled={reportSubmitting}>
                      Đóng
                    </button>
                  </div>

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
                      rows={4}
                      value={reportDetail}
                      onChange={(e) => setReportDetail(e.target.value)}
                      placeholder="Nhập nội dung chi tiết nếu cần"
                      disabled={reportSubmitting}
                    />
                  </label>

                  {reportError && <div className="pending-requests-alert alert-error sidebar-alert">{reportError}</div>}

                  <div className="report-inline-actions">
                    <button type="button" className="member-detail-close" onClick={closeReportModal} disabled={reportSubmitting}>
                      Hủy
                    </button>
                    <button type="button" className="member-report-btn" onClick={handleSubmitReport} disabled={reportSubmitting}>
                      {reportSubmitting ? 'Đang gửi...' : 'Gửi báo cáo'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {isInviteModalOpen && (
          <div className="member-detail-modal-overlay invite-modal-overlay" onClick={closeInviteModal}>
            <div className="member-detail-modal invite-modal" onClick={(e) => e.stopPropagation()}>
              <div className="member-detail-modal-header">
                <div>
                  <h3>Thêm học sinh</h3>
                  <p className="invite-modal-subtitle">Tìm và chọn email, hoặc nhập trực tiếp nhiều email cùng lúc.</p>
                </div>
                <button type="button" className="member-detail-close" onClick={closeInviteModal} disabled={inviteSubmitting}>
                  Đóng
                </button>
              </div>

              <div className="invite-modal-summary">
                <span>Lớp học</span>
                <strong>{classroomInfo?.className || classroomInfo?.name || '—'}</strong>
                <span>Mã lớp: {classroomInfo?.code || '—'}</span>
              </div>

              <label className="invite-field">
                <span>Tìm kiếm theo email</span>
                <div className={`invite-picker ${inviteInputFocused ? 'focused' : ''}`}>
                  <div className="invite-chip-row">
                    {inviteEmails.map((email) => (
                      <span key={email} className="invite-chip">
                        <span className="invite-chip-text">{email}</span>
                        <button
                          type="button"
                          className="invite-chip-remove"
                          onClick={() => setInviteEmails((prev) => prev.filter((item) => item !== email))}
                          aria-label={`Xóa ${email}`}
                          disabled={inviteSubmitting}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}

                    <input
                      type="text"
                      value={inviteInput}
                      onChange={(e) => {
                        setInviteInput(e.target.value.toLowerCase());
                        setInviteError('');
                      }}
                      onKeyDown={handleInviteKeyDown}
                      onPaste={handleInvitePaste}
                      onFocus={() => setInviteInputFocused(true)}
                      onBlur={() => setInviteInputFocused(false)}
                      placeholder="Nhập email và nhấn Enter hoặc dấu phẩy"
                      autoComplete="off"
                      disabled={inviteSubmitting}
                    />
                  </div>

                  {inviteInputFocused && inviteInput.trim() && (
                    <div className="invite-suggestions" role="listbox" aria-label="Gợi ý email">
                      {inviteSuggestions.length > 0 ? (
                        inviteSuggestions.slice(0, 8).map((item) => (
                          <button
                            key={item.email}
                            type="button"
                            className="invite-suggestion-item"
                            onMouseDown={(e) => {
                              if (item.disabled) return;
                              e.preventDefault();
                            }}
                            onClick={() => {
                              if (item.disabled) return;
                              addInviteEmails([item.email]);
                              setInviteInputFocused(true);
                            }}
                            disabled={inviteSubmitting || item.disabled}
                          >
                            <span className="invite-suggestion-email">{item.email}</span>
                            <span className="invite-suggestion-name">{item.label}</span>
                            <span className="invite-suggestion-meta">{item.subtitle || 'Nhấn để chọn'}</span>
                          </button>
                        ))
                      ) : (
                        <button
                          type="button"
                          className="invite-suggestion-item invite-suggestion-item--manual"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => addInviteEmails([inviteInput])}
                          disabled={inviteSubmitting || !EMAIL_REGEX.test(normalizeEmail(inviteInput))}
                        >
                          <span className="invite-suggestion-email">{normalizeEmail(inviteInput)}</span>
                          <span className="invite-suggestion-name">Chưa tìm thấy tài khoản trùng khớp</span>
                          <span className="invite-suggestion-meta">Nhấn để thêm email này</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <small className="invite-field-hint">Có thể dán nhiều email cùng lúc, cách nhau bằng dấu phẩy, khoảng trắng hoặc xuống dòng.</small>
              </label>

              {inviteError && <div className="pending-requests-alert alert-error sidebar-alert">{inviteError}</div>}

              <div className="invite-modal-actions">
                <button type="button" className="member-detail-close" onClick={closeInviteModal} disabled={inviteSubmitting}>
                  Hủy
                </button>
                <button type="button" className="member-report-btn invite-submit-btn" onClick={handleInviteSubmit} disabled={inviteSubmitting}>
                  {inviteSubmitting ? <Loader2 size={14} className="spin" /> : null}
                  Gửi lời mời
                </button>
              </div>
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

