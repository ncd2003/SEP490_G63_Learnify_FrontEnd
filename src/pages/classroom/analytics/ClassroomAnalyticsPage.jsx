import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { 
  FileText, 
  BarChart2, 
  ClipboardCheck, 
  Download, 
  ChevronDown,
  AlertCircle,
  Loader2
} from "lucide-react";
import { toast } from "react-hot-toast";
import ClassroomDetailLayout from "@/components/ClassroomDetailLayout";
import { classAnalyticsApi } from "@/apis/class-analytics.api";
import { isStudentRole } from "@/lib/auth-role";
import { useAuth } from "@/contexts/AuthContext";
import "@/assets/css/pages/classroom/classroomAnalytics.css";

const FILTER_OPTIONS = [
  { value: "", label: "Tất cả bài tập" },
  { value: "ASSIGNMENT", label: "Chỉ xem Bài tập" },
  { value: "TEST", label: "Chỉ xem Bài kiểm tra" },
  { value: "EXAM", label: "Chỉ xem Bài thi" },
];

const ClassroomAnalyticsPage = () => {
  const { id: classroomId } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [exporting, setExporting] = useState(false);

  // If student tries to access, they shouldn't see this, though the layout hides it from the sidebar
  // and the backend secures it via not owner exception, but it's good to have a simple check.
  const isStudent = isStudentRole(user?.role);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await classAnalyticsApi.getAnalytics(classroomId, categoryFilter);
      if (res?.result) {
        setData(res.result);
      }
    } catch (err) {
      console.error("Failed to load analytics:", err);
      // Fallback message if error message from backend isn't available
      setError(err?.response?.data?.message || "Lỗi kết nối máy chủ. Không thể tải dữ liệu thống kê hệ thống lúc này. Vui lòng tải lại trang.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isStudent && classroomId) {
      fetchAnalytics();
    }
  }, [classroomId, categoryFilter, isStudent]);

  const handleExport = async (format) => {
    try {
      setExporting(true);
      const res = await classAnalyticsApi.exportGradebook(classroomId, categoryFilter, format);
      
      // The response is a blob because we set responseType: 'blob' in the API call
      const url = window.URL.createObjectURL(new Blob([res]));
      const link = document.createElement("a");
      link.href = url;
      
      const extension = format === 'excel' ? 'xlsx' : 'csv';
      link.setAttribute("download", `class-${classroomId}-gradebook.${extension}`);
      
      document.body.appendChild(link);
      link.click();
      
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("Xuất báo cáo thành công.");
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("Không thể xuất dữ liệu. Vui lòng thử lại.");
    } finally {
      setExporting(false);
    }
  };

  if (isStudent) {
    return (
      <ClassroomDetailLayout activeMenuKeyOverride="analytics">
        <div className="analytics-dashboard-container">
          <div className="analytics-error">
            <AlertCircle size={20} />
            <span>Bạn không có quyền truy cập trang này.</span>
          </div>
        </div>
      </ClassroomDetailLayout>
    );
  }

  const { overview, gradebook } = data || {};
  const hasData = gradebook?.rows?.length > 0;

  return (
    <ClassroomDetailLayout activeMenuKeyOverride="analytics">
      <div className="analytics-dashboard-container">
        <div className="analytics-header">
          <h1 className="analytics-title">Thống kê lớp học</h1>
          
          <div className="analytics-actions">
            <div className="analytics-select-wrapper">
              <select 
                className="analytics-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                disabled={loading}
              >
                {FILTER_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="analytics-select-icon" size={16} />
            </div>
            
            <button 
              className="btn-export" 
              onClick={() => handleExport('excel')}
              disabled={loading || exporting || !hasData}
            >
              {exporting ? <Loader2 size={16} className="spinning" /> : <Download size={16} />}
              <span>Xuất bảng điểm</span>
            </button>
          </div>
        </div>

        {error ? (
          <div className="analytics-error">
            <AlertCircle size={24} />
            <span>{error}</span>
          </div>
        ) : loading ? (
          <div className="analytics-loading">
            <Loader2 size={32} className="spinning" />
            <p>Đang tải dữ liệu thống kê...</p>
          </div>
        ) : (
          <>
            {/* Overview Section */}
            <div className="analytics-overview">
              <div className="analytics-card">
                <div className="analytics-card-icon completion">
                  <FileText size={24} />
                </div>
                <div className="analytics-card-content">
                  <div className="analytics-card-label">Tỉ lệ nộp bài</div>
                  <div className="analytics-card-value">{overview?.assignmentCompletionRate || 0}%</div>
                </div>
              </div>
              
              <div className="analytics-card">
                <div className="analytics-card-icon average">
                  <BarChart2 size={24} />
                </div>
                <div className="analytics-card-content">
                  <div className="analytics-card-label">Điểm trung bình lớp</div>
                  <div className="analytics-card-value">{overview?.classAverageScore || 0}</div>
                </div>
              </div>
              
              <div className="analytics-card">
                <div className="analytics-card-icon attendance">
                  <ClipboardCheck size={24} />
                </div>
                <div className="analytics-card-content">
                  <div className="analytics-card-label">Tỉ lệ chuyên cần</div>
                  <div className="analytics-card-value">{overview?.attendanceRate || 0}%</div>
                </div>
              </div>
            </div>

            {/* Gradebook Section */}
            <div className="analytics-table-container">
              <div className="analytics-table-header">
                <h2 className="analytics-table-title">Bảng điểm</h2>
              </div>
              
              {hasData ? (
                <div className="analytics-table-wrapper">
                  <table className="analytics-table">
                    <thead>
                      <tr>
                        <th>Học sinh</th>
                        {gradebook.columns.map(col => (
                          <th key={col.classroomAssignmentId} className="score-cell">
                            <span className="column-header-title">{col.title}</span>
                            {col.deadline && (
                              <span className="column-header-date">
                                Hạn: {new Date(col.deadline).toLocaleDateString('vi-VN')}
                              </span>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {gradebook.rows.map(row => (
                        <tr key={row.studentId}>
                          <td className="student-name">{row.studentName}</td>
                          {gradebook.columns.map(col => {
                            const score = row.scores[col.assignmentId];
                            const isMissing = score === undefined || score === null;
                            
                            return (
                              <td key={`${row.studentId}-${col.classroomAssignmentId}`} className="score-cell">
                                {isMissing ? (
                                  <span className="score-missing">Chưa nộp</span>
                                ) : (
                                  <span className="score-value">{score}</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="analytics-empty-state">
                  <p>Không có dữ liệu bảng điểm phù hợp.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </ClassroomDetailLayout>
  );
};

export default ClassroomAnalyticsPage;
