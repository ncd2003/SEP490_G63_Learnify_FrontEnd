import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  MessageSquare, 
  Users, 
  FileText, 
  FolderOpen, 
  BarChart3,
  ClipboardCheck,
  ChevronLeft,
  Calendar,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PATH_TEACHER } from '@/routes/paths';
import { classroomApi } from '@/apis/classroom.api';
import '@/assets/css/components/classroomDetailLayout.css';

const MENU_ITEMS = [
  { key: 'feed', label: 'Bảng tin', icon: MessageSquare, path: '' },
  { key: 'schedule', label: 'Lịch học', icon: Calendar, path: '/schedule' },
  { key: 'members', label: 'Thành viên', icon: Users, path: '/pending-requests' },
  { key: 'assignments', label: 'Bài tập', icon: FileText, path: '/assignments' },
  { key: 'folders', label: 'Tài liệu', icon: FolderOpen, path: '/folders' },
  { key: 'grades', label: 'Bảng điểm', icon: BarChart3, path: '/grades' },
  { key: 'attendance', label: 'Điểm danh', icon: ClipboardCheck, path: '/attendance' },
];

const ClassroomDetailLayout = ({ children }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    fetchClassroomInfo();
  }, [id]);

  const fetchClassroomInfo = async () => {
    try {
      setLoading(true);
      const response = await classroomApi.getClassroomById(id);
      //console.log('Classroom detail response:', response);
      if (response.code === 1000) {
        //console.log('Classroom data:', response.result);
        setClassroom(response.result);
      }
    } catch (err) {
      console.error('Error fetching classroom info:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToClassrooms = () => {
    navigate(PATH_TEACHER.classroom.root);
  };

  const getActiveMenuItem = () => {
    const path = location.pathname;
    if (path.includes('/attendance')) return 'attendance';
    if (path.includes('/schedule')) return 'schedule';
    if (path.includes('/pending-requests')) return 'members';
    if (path.includes('/members')) return 'members';
    if (path.includes('/assignments')) return 'assignments';
    if (path.includes('/folders')) return 'folders';
    if (path.includes('/grades')) return 'grades';
    return 'feed';
  };

  const activeKey = getActiveMenuItem();

  const safeNumber = (value) => {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  };

  const formatStorageInGb = (value) => {
    const gbValue = Math.max(0, safeNumber(value)) / (1024 * 1024 * 1024);

    if (gbValue >= 100) {
      return gbValue.toFixed(0);
    }

    if (gbValue >= 10) {
      return gbValue.toFixed(1);
    }

    return gbValue.toFixed(2);
  };

  const usageItems = Array.isArray(user?.userBenefitUsageDTO)
    ? user.userBenefitUsageDTO
    : [];
  const storageUsage = usageItems.find((item) => item?.benefitCode === 'STORAGE');
  const aiRequestUsage = usageItems.find((item) => item?.benefitCode === 'AI_REQUEST');

  const storageUsed = Math.max(0, safeNumber(storageUsage?.used));
  const storageLimit = Math.max(0, safeNumber(storageUsage?.limitValue));
  const rawStoragePercent =
    storageLimit > 0 ? (storageUsed / storageLimit) * 100 : 0;
  const storagePercent = Number.isFinite(rawStoragePercent)
    ? Math.max(0, rawStoragePercent)
    : 0;
  const storagePercentLabel =
    storageUsed <= 0 || storageLimit <= 0
      ? '0%'
      : storagePercent < 0.0001
        ? '<0.0001%'
        : storagePercent < 0.01
          ? `${storagePercent.toFixed(4)}%`
          : storagePercent < 1
            ? `${storagePercent.toFixed(2)}%`
            : `${storagePercent.toFixed(1)}%`;
  const storagePercentBar =
    storagePercent > 0 ? Math.max(1, Math.min(100, storagePercent)) : 0;
  const storageUsageLabel = `${formatStorageInGb(storageUsed)} / ${formatStorageInGb(storageLimit)} GB`;

  const aiUsed = Math.max(0, Math.trunc(safeNumber(aiRequestUsage?.used)));
  const aiLimit = Math.max(0, Math.trunc(safeNumber(aiRequestUsage?.limitValue)));

  const planLabel =
    typeof user?.plan === 'string'
      ? user.plan.replace(/_/g, ' ')
      : user?.plan?.name || 'FREE';

  if (loading) {
    return (
      <div className="classroom-detail-loading">
        <div>Đang tải thông tin lớp học...</div>
      </div>
    );
  }

  return (
    <div className={`classroom-detail-layout ${collapsed ? 'is-collapsed' : ''}`}>
      {/* Sidebar */}
      <aside className={`classroom-sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="classroom-sidebar-header">
          <button 
            className="back-to-classrooms-btn"
            onClick={handleBackToClassrooms}
            aria-label="Quay lại danh sách lớp học"
          >
            <ChevronLeft size={20} />
          </button>
          {!collapsed && (
            <h2 className="classroom-sidebar-title">Thông tin lớp học - {classroom?.name}</h2>
          )}
          <button
            type="button"
            className="collapse-toggle-btn"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          >
            {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
          </button>
        </div>

        {!collapsed && (
          <>
            <div className="classroom-info-card">
              <div className="classroom-info-row">
                <span className="classroom-info-label">Giảng viên:</span>
                <span className="classroom-info-value">{user?.fullName || user?.username}</span>
              </div>
              {/* <div className="classroom-info-row">
                <span className="classroom-info-email">{user?.email}</span>
              </div> */}
              <div className="classroom-info-row">
                <span className="classroom-info-label">Mã lớp:</span>
                <span className="classroom-info-value">{classroom?.code || 'Chưa có mã'}</span>
              </div>
              {classroom?.schedule && (
                <div className="classroom-info-row">
                  <Calendar size={16} className="classroom-info-icon" />
                  <span className="classroom-info-schedule">{classroom.schedule}</span>
                </div>
              )}
            </div>
          </>
        )}

        <nav className="classroom-nav">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeKey === item.key;
            return (
              <button
                key={item.key}
                className={`classroom-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  if (item.key === 'feed') {
                    navigate(PATH_TEACHER.classroom.detail(id));
                  } else if (item.key === 'folders') {
                    navigate(PATH_TEACHER.classroom.folders(id));
                  } else {
                    navigate(`${PATH_TEACHER.classroom.detail(id)}${item.path}`);
                  }
                }}
              >
                <Icon size={20} />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="classroom-plan-usage-card">
            <div className="classroom-plan-usage-head">
              <span className="classroom-plan-usage-label">Gói hiện tại</span>
              <strong className="classroom-plan-usage-value">{planLabel}</strong>
            </div>

            <div className="classroom-benefit-usage-item">
              <div className="classroom-benefit-usage-row">
                <span>STORAGE</span>
                <span>{storagePercentLabel}</span>
              </div>
              <div className="classroom-storage-progress" aria-hidden="true">
                <div
                  className="classroom-storage-progress-fill"
                  style={{ width: `${storagePercentBar}%` }}
                />
              </div>
              <div className="classroom-benefit-usage-subtext">{storageUsageLabel}</div>
            </div>

            <div className="classroom-benefit-usage-item">
              <div className="classroom-benefit-usage-row">
                <span>AI_REQUEST</span>
                <span>{`${aiUsed}/${aiLimit}`}</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="classroom-main-content">
        {children}
      </main>
    </div>
  );
};

export default ClassroomDetailLayout;
