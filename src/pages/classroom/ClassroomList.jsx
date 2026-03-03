import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Trash2,
  LayoutList,
  MoreVertical,
  ChevronLeft,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import useClassrooms from "@/hooks/useClassrooms";
import EditClassroomModal from "@/pages/classroom/EditClassroomModal";
import CreateClassroomModal from "@/pages/classroom/CreateClassroomModal";
import DeleteConfirmModal from "@/pages/classroom/DeleteConfirmModal";

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

const ClassroomRow = ({ classroom, onMenuClick, activeMenu, onMenuClose, onEdit, onDelete }) => {
  const isMenuOpen = activeMenu === classroom.id;

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      {/* Tên lớp */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
            {classroom.imageUrl ? (
              <img
                src={classroom.imageUrl}
                alt={classroom.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-100">
                <BookOpen size={20} className="text-blue-400" />
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{classroom.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Mã lớp &bull; {classroom.code}
            </p>
          </div>
        </div>
      </td>

      {/* Học sinh */}
      <td className="py-3 px-4 text-center text-sm text-gray-700">
        {classroom.studentCount ?? 0}
      </td>

      {/* Bài giảng */}
      <td className="py-3 px-4 text-center text-sm text-gray-700">
        {classroom.lectureCount ?? 0}
      </td>

      {/* Bài tập */}
      <td className="py-3 px-4 text-center text-sm text-gray-700">
        {classroom.assignmentCount ?? 0}
      </td>

      {/* Tài liệu */}
      <td className="py-3 px-4 text-center text-sm text-gray-700">
        {classroom.documentCount ?? 0}
      </td>

      {/* Actions */}
      <td className="py-3 px-4 text-center relative">
        <button
          onClick={() => onMenuClick(classroom.id)}
          className="p-1 rounded hover:bg-gray-200 transition-colors text-gray-500"
        >
          <MoreVertical size={18} />
        </button>

        {isMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={onMenuClose}
            />
            <div className="absolute right-6 top-8 z-20 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-36">
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Xem lớp học
              </button>
              <button
                onClick={() => { onMenuClose(); onEdit(classroom); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Chỉnh sửa
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Ẩn lớp học
              </button>
              <button
                onClick={() => { onMenuClose(); onDelete(classroom); }}
                className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50"
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
    <div className="min-h-screen bg-white">
      {/* Tabs + top-right actions */}
      <div className="flex items-center justify-between px-6 pt-4 pb-0 border-b border-gray-200">
        <div className="flex items-center gap-1">
          {/* Tab: Lớp của bạn */}
          <button
            onClick={() => setActiveTab(TABS.ACTIVE)}
            className={`px-4 py-2 rounded-t text-sm font-medium transition-colors ${
              activeTab === TABS.ACTIVE
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Lớp của bạn {filteredClassrooms.length > 0 && activeTab === TABS.ACTIVE ? filteredClassrooms.length : ""}
          </button>

          {/* Tab: Lớp đã ẩn */}
          <button
            onClick={() => setActiveTab(TABS.HIDDEN)}
            className={`px-4 py-2 rounded-t text-sm font-medium transition-colors ${
              activeTab === TABS.HIDDEN
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Lớp đã ẩn
          </button>
        </div>

        <div className="flex items-center gap-2 mb-1">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
            <Trash2 size={15} />
            <span>Thùng rác</span>
          </button>
          <button className="p-1.5 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
            <LayoutList size={18} />
          </button>
        </div>
      </div>

      {/* Search + Sort + Create */}
      <div className="flex items-center gap-3 px-6 py-4">
        {/* Sidebar toggle */}
        <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors flex-shrink-0">
          <ChevronLeft size={18} />
        </button>

        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Sort */}
        <select
          value={sortValue}
          onChange={(e) => setSortValue(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-600 cursor-pointer"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Create button */}
        <button
          onClick={handleCreateOpen}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
        >
          <Plus size={16} />
          Tạo lớp học
        </button>
      </div>

      {/* Table */}
      <div className="px-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
            Đang tải danh sách lớp học...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20 text-red-500 text-sm">
            {error}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-200">
                {TABLE_HEADERS.map((h) => (
                  <th
                    key={h.key}
                    className={`py-2.5 px-4 font-medium text-gray-500 text-sm ${h.className}`}
                  >
                    {h.label}
                  </th>
                ))}
                <th className="py-2.5 px-4" />
              </tr>
            </thead>
            <tbody>
              {filteredClassrooms.length === 0 ? (
                <tr>
                  <td
                    colSpan={TABLE_HEADERS.length + 1}
                    className="py-16 text-center text-gray-400 text-sm"
                  >
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
  );
};

export default ClassroomList;
