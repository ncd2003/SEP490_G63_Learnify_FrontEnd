import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Trash2,
  LayoutList,
  MoreVertical,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import useClassrooms from "@/hooks/useClassrooms";
import DashboardLayout from "@/components/DashboardLayout";
import EditClassroomModal from "@/pages/classroom/EditClassroomModal";
import CreateClassroomModal from "@/pages/classroom/CreateClassroomModal";
import DeleteConfirmModal from "@/pages/classroom/DeleteConfirmModal";
import { PATH_TEACHER } from "@/routes/paths";
import "@/assets/css/pages/classroom/classroomList.css";

const SORT_OPTIONS = [
  { value: "", label: "Sắp xếp..." },
  { value: "name_asc", label: "Tên A → Z" },
  { value: "name_desc", label: "Tên Z → A" },
];

const TABS = {
  ACTIVE: "active",
  HIDDEN: "hidden",
};

const TABLE_HEADERS = [
  { key: "name", label: "Tên lớp", className: "text-left" },
  { key: "students", label: "Học sinh", className: "text-center" },
  { key: "lectures", label: "Bài giảng", className: "text-center" },
  { key: "assignments", label: "Bài tập", className: "text-center" },
  { key: "documents", label: "Tài liệu", className: "text-center" },
];

const ClassroomRow = ({ classroom, onMenuClick, activeMenu, onMenuClose, onEdit, onDelete, navigate }) => {
  const isMenuOpen = activeMenu === classroom.id;

  const handleNavigateToClassroom = () => {
    navigate(PATH_TEACHER.classroom.detail(classroom.id));
  };

  return (
    <tr>
      {/* Tên lớp */}
      <td>
        <div className="classroom-info">
          <div
            className="classroom-thumbnail classroom-thumbnail-clickable"
            onClick={handleNavigateToClassroom}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleNavigateToClassroom();
            }}
          >
            {classroom.imageUrl ? (
              <img src={classroom.imageUrl} alt={classroom.name} />
            ) : (
              <div className="classroom-thumbnail-placeholder">
                <BookOpen size={20} />
              </div>
            )}
          </div>
          <div className="classroom-details">
            <p
              className="classroom-name classroom-name-clickable"
              onClick={handleNavigateToClassroom}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleNavigateToClassroom();
              }}
            >
              {classroom.name}
            </p>
            <p className="classroom-code">Mã lớp &bull; {classroom.code}</p>
          </div>
        </div>
      </td>

      {/* Học sinh */}
      <td className="classroom-stat">{classroom.studentCount ?? 0}</td>

      {/* Bài giảng */}
      <td className="classroom-stat">{classroom.lectureCount ?? 0}</td>

      {/* Bài tập */}
      <td className="classroom-stat">{classroom.assignmentCount ?? 0}</td>

      {/* Tài liệu */}
      <td className="classroom-stat">{classroom.documentCount ?? 0}</td>

      {/* Actions */}
      <td className="row-actions">
        <button onClick={() => onMenuClick(classroom.id)} className="action-menu-trigger">
          <MoreVertical size={18} />
        </button>

        {isMenuOpen && (
          <>
            <div className="menu-backdrop" onClick={onMenuClose} />
            <div className="action-menu">
              <button className="action-menu-item">Xem lớp học</button>
              <button
                onClick={() => {
                  onMenuClose();
                  onEdit(classroom);
                }}
                className="action-menu-item"
              >
                Chỉnh sửa
              </button>
              <button className="action-menu-item">Ẩn lớp học</button>
              <button
                onClick={() => {
                  onMenuClose();
                  onDelete(classroom);
                }}
                className="action-menu-item danger"
              >
                Xóa lớp học
              </button>
            </div>
          </>
        )}
      </td>
    </tr>
  );
};

const ClassroomList = () => {
  const { user } = useAuth();
  const { classrooms, loading, error, refetch } = useClassrooms(user?.id);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(TABS.ACTIVE);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortValue, setSortValue] = useState("");
  const [activeMenu, setActiveMenu] = useState(null);
  const [editingClassroom, setEditingClassroom] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingClassroom, setDeletingClassroom] = useState(null);

  const filteredClassrooms = useMemo(() => {
    let result = [...classrooms];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.code.toLowerCase().includes(query)
      );
    }

    if (sortValue === "name_asc") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortValue === "name_desc") {
      result.sort((a, b) => b.name.localeCompare(a.name));
    }

    return result;
  }, [classrooms, searchQuery, sortValue]);

  const handleMenuClick = (id) => {
    setActiveMenu((prev) => (prev === id ? null : id));
  };

  const handleMenuClose = () => setActiveMenu(null);

  const handleEditClick = (classroom) => setEditingClassroom(classroom);
  const handleEditClose = () => setEditingClassroom(null);
  const handleEditSuccess = () => { refetch(); setEditingClassroom(null); };

  const handleCreateOpen = () => setShowCreateModal(true);
  const handleCreateClose = () => setShowCreateModal(false);
  const handleCreateSuccess = () => { refetch(); setShowCreateModal(false); };

  const handleDeleteClick = (classroom) => setDeletingClassroom(classroom);
  const handleDeleteClose = () => setDeletingClassroom(null);
  const handleDeleteSuccess = () => { refetch(); setDeletingClassroom(null); };

  return (
    <DashboardLayout>
      <div className="classroom-list-container">
        {/* Tabs + top-right actions */}
        <div className="tabs-header">
          <div className="tabs-wrapper">
            {/* Tab: Lớp của bạn */}
            <button
              onClick={() => setActiveTab(TABS.ACTIVE)}
              className={`tab-button ${activeTab === TABS.ACTIVE ? "active" : ""}`}
            >
              Lớp của bạn {filteredClassrooms.length > 0 && activeTab === TABS.ACTIVE ? `(${filteredClassrooms.length})` : ""}
            </button>

            {/* Tab: Lớp đã ẩn */}
            <button
              onClick={() => setActiveTab(TABS.HIDDEN)}
              className={`tab-button ${activeTab === TABS.HIDDEN ? "active" : ""}`}
            >
              Lớp đã ẩn
            </button>
          </div>

          <div className="header-actions">
            <button className="btn-secondary">
              <Trash2 size={15} />
              <span>Thùng rác</span>
            </button>
            <button className="btn-icon">
              <LayoutList size={18} />
            </button>
            <button onClick={handleCreateOpen} className="btn-create">
              <Plus size={16} />
              Tạo lớp học
            </button>
          </div>
        </div>

        {/* Search + Sort */}
        <div className="toolbar">
          {/* Search */}
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm lớp học..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Sort */}
          <select
            value={sortValue}
            onChange={(e) => setSortValue(e.target.value)}
            className="sort-select"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="table-wrapper">
          {loading ? (
            <div className="empty-state">Đang tải danh sách lớp học...</div>
          ) : error ? (
            <div className="empty-state error">{error}</div>
          ) : (
            <table className="classroom-table">
              <thead>
                <tr>
                  {TABLE_HEADERS.map((h) => (
                    <th key={h.key} className={h.className}>
                      {h.label}
                    </th>
                  ))}
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredClassrooms.length === 0 ? (
                  <tr>
                    <td colSpan={TABLE_HEADERS.length + 1} className="empty-cell">
                      {searchQuery
                        ? "Không tìm thấy lớp học phù hợp."
                        : "Bạn chưa có lớp học nào."}
                    </td>
                  </tr>
                ) : (
                  filteredClassrooms.map((classroom) => (
                    <ClassroomRow
                      key={classroom.id}
                      classroom={classroom}
                      onMenuClick={handleMenuClick}
                      activeMenu={activeMenu}
                      onMenuClose={handleMenuClose}
                      onEdit={handleEditClick}
                      onDelete={handleDeleteClick}
                      navigate={navigate}
                    />
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {editingClassroom && (
          <EditClassroomModal
            classroom={editingClassroom}
            onClose={handleEditClose}
            onSuccess={handleEditSuccess}
          />
        )}

        {showCreateModal && (
          <CreateClassroomModal
            onClose={handleCreateClose}
            onSuccess={handleCreateSuccess}
          />
        )}

        {deletingClassroom && (
          <DeleteConfirmModal
            classroom={deletingClassroom}
            onClose={handleDeleteClose}
            onSuccess={handleDeleteSuccess}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default ClassroomList;
