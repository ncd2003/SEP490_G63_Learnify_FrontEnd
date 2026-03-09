import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Trash2,
  LayoutList,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import useClassrooms from "@/hooks/use-classrooms";
import useDebounce from "@/hooks/use-debounce";
import ClassroomRow from "./classroom-row";
import EditClassroomDialog from "@/pages/classroom/edit/edit-classroom-dialog";
import CreateClassroomDialog from "@/pages/classroom/create/create-classroom-dialog";
import DeleteClassroomDialog from "@/pages/classroom/delete/delete-classroom-dialog";
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

const ClassroomPage = () => {
  const { user } = useAuth();
  const { classrooms, loading, error, refetch } = useClassrooms(user?.id);

  const [activeTab, setActiveTab] = useState(TABS.ACTIVE);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortValue, setSortValue] = useState("");
  const [activeMenu, setActiveMenu] = useState(null);
  const [editingClassroom, setEditingClassroom] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingClassroom, setDeletingClassroom] = useState(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const filteredClassrooms = useMemo(() => {
    let result = [...classrooms];

    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
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
  }, [classrooms, debouncedSearch, sortValue]);

  const handleMenuClick = (id) => setActiveMenu((prev) => (prev === id ? null : id));
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
    <div className="classroom-list-container">
        {/* Tabs + top-right actions */}
        <div className="tabs-header">
          <div className="tabs-wrapper">
            <button
              onClick={() => setActiveTab(TABS.ACTIVE)}
              className={`tab-button ${activeTab === TABS.ACTIVE ? "active" : ""}`}
            >
              Lớp của bạn{" "}
              {filteredClassrooms.length > 0 && activeTab === TABS.ACTIVE
                ? `(${filteredClassrooms.length})`
                : ""}
            </button>
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
                    />
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {editingClassroom && (
          <EditClassroomDialog
            classroom={editingClassroom}
            onClose={handleEditClose}
            onSuccess={handleEditSuccess}
          />
        )}

        {showCreateModal && (
          <CreateClassroomDialog
            onClose={handleCreateClose}
            onSuccess={handleCreateSuccess}
          />
        )}

        {deletingClassroom && (
          <DeleteClassroomDialog
            classroom={deletingClassroom}
            onClose={handleDeleteClose}
            onSuccess={handleDeleteSuccess}
          />
        )}
      </div>
  );
};

export default ClassroomPage;
