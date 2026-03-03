import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  MessageSquare, 
  Users, 
  FileText, 
  FolderOpen, 
  BarChart3,
  ChevronLeft,
  Calendar 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PATH_TEACHER } from '@/routes/paths';
import classroomApi from '@/apis/classroomApi';
import '@/assets/css/components/classroomDetailLayout.css';

const MENU_ITEMS = [
  { key: 'feed', label: 'Bảng tin', icon: MessageSquare, path: '' },
  { key: 'schedule', label: 'Lịch học', icon: Calendar, path: '/schedule' },
  { key: 'members', label: 'Thành viên', icon: Users, path: '/pending-requests' },
  { key: 'assignments', label: 'Bài tập', icon: FileText, path: '/assignments' },
  { key: 'documents', label: 'Tài liệu', icon: FolderOpen, path: '/documents' },
  { key: 'grades', label: 'Bảng điểm', icon: BarChart3, path: '/grades' },
];

const ClassroomDetailLayout = ({ children }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClassroomInfo();
  }, [id]);

  const fetchClassroomInfo = async () => {
    try {
      setLoading(true);
      const response = await classroomApi.getClassroomById(id);
      console.log('Classroom detail response:', response);
      if (response.code === 1000) {
        console.log('Classroom data:', response.result);
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
    if (path.includes('/schedule')) return 'schedule';
    if (path.includes('/pending-requests')) return 'members';
    if (path.includes('/members')) return 'members';
    if (path.includes('/assignments')) return 'assignments';
    if (path.includes('/documents')) return 'documents';
    if (path.includes('/grades')) return 'grades';
    return 'feed';
  };

  const activeKey = getActiveMenuItem();

  if (loading) {
    return (
      <div className="classroom-detail-loading">
        <div>Đang tải thông tin lớp học...</div>
      </div>
    );
  }

  return (
    <div className="classroom-detail-layout">
      {/* Sidebar */}
      <aside className="classroom-sidebar">
        <div className="classroom-sidebar-header">
          <button 
            className="back-to-classrooms-btn"
            onClick={handleBackToClassrooms}
            aria-label="Quay lại danh sách lớp học"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="classroom-sidebar-title">Thông tin lớp học - {classroom?.name}</h2>
        </div>

        <div className="classroom-info-card">
          <div className="classroom-info-row">
            <span className="classroom-info-label">Giảng viên:</span>
            <span className="classroom-info-value">{user?.fullName || user?.username}</span>
          </div>
          <div className="classroom-info-row">
            <span className="classroom-info-email">{user?.email}</span>
          </div>
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
                  } else {
                    navigate(`${PATH_TEACHER.classroom.detail(id)}${item.path}`);
                  }
                }}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="classroom-main-content">
        {children}
      </main>
    </div>
  );
};

export default ClassroomDetailLayout;
