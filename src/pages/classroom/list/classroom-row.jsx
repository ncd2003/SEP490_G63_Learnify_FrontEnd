import { memo } from "react";
import { BookOpen, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PATH_TEACHER } from "@/routes/paths";

/**
 * @param {{
 *   classroom: import("@/schema/classroom.schema").TClassroom & { studentCount?: number, lectureCount?: number, assignmentCount?: number, documentCount?: number },
 *   activeMenu: number | null,
 *   onMenuClick: (id: number) => void,
 *   onMenuClose: () => void,
 *   onEdit: (classroom: object) => void,
 *   onHide: (classroom: object) => void,
 *   onDelete: (classroom: object) => void,
 * }} props
 */
const ClassroomRow = memo(({ classroom, activeMenu, onMenuClick, onMenuClose, onEdit, onHide, onDelete }) => {
  const navigate = useNavigate();
  const isMenuOpen = activeMenu === classroom.id;

  const handleNavigate = () => {
    navigate(PATH_TEACHER.classroom.detail(classroom.id));
  };

  return (
    <tr>
      {/* Tên lớp */}
      <td>
        <div className="classroom-info">
          <div
            className="classroom-thumbnail classroom-thumbnail-clickable"
            onClick={handleNavigate}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => { if (e.key === "Enter") handleNavigate(); }}
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
              onClick={handleNavigate}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => { if (e.key === "Enter") handleNavigate(); }}
            >
              {classroom.name}
            </p>
            <p className="classroom-code">Mã lớp &bull; {classroom.code}</p>
          </div>
        </div>
      </td>

      <td className="classroom-stat">{classroom.studentCount ?? 0}</td>
      <td className="classroom-stat">{classroom.lectureCount ?? 0}</td>
      <td className="classroom-stat">{classroom.assignmentCount ?? 0}</td>
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
              <button className="action-menu-item" onClick={handleNavigate}>
                Xem lớp học
              </button>
              <button
                className="action-menu-item"
                onClick={() => { onMenuClose(); onEdit(classroom); }}
              >
                Chỉnh sửa
              </button>
              <button
                className="action-menu-item"
                onClick={() => { onMenuClose(); onHide?.(classroom); }}
              >
                Ẩn lớp học
              </button>
              <button
                className="action-menu-item danger"
                onClick={() => { onMenuClose(); onDelete(classroom); }}
              >
                Xóa lớp học
              </button>
            </div>
          </>
        )}
      </td>
    </tr>
  );
});

ClassroomRow.displayName = "ClassroomRow";

export default ClassroomRow;
