import { memo } from "react";
import { Library, MoreVertical } from "lucide-react";
import {
  getLabelFromOptions,
  gradeOptions,
  subjectOptions,
} from "@/pages/question-bank/question-bank-options";

/**
 * @param {{
 *   questionBank: import("@/schema/question-bank.schema").TQuestionBank,
 *   activeMenu: number | null,
 *   onMenuClick: (id: number) => void,
 *   onMenuClose: () => void,
 *   onViewDetail: (questionBank: object) => void,
 *   onCreateQuestion: (questionBank: object) => void,
 *   onEdit: (questionBank: object) => void,
 *   onDelete: (questionBank: object) => void,
 * }} props
 */
const QuestionBankRow = memo(
  ({
    questionBank,
    activeMenu,
    onMenuClick,
    onMenuClose,
    onViewDetail,
    onCreateQuestion,
    onEdit,
    onDelete,
  }) => {
    const isMenuOpen = activeMenu === questionBank.id;

    return (
      <tr>
        <td>
          <div className="classroom-info">
            <div className="classroom-thumbnail">
              <div className="classroom-thumbnail-placeholder">
                <Library size={20} />
              </div>
            </div>
            <div className="classroom-details">
              <button
                type="button"
                className="classroom-name classroom-name-clickable"
                onClick={() => onViewDetail(questionBank)}
                style={{ background: "none", border: "none", padding: 0 }}
              >
                {questionBank.name}
              </button>
              <p className="classroom-code">ID &bull; {questionBank.id}</p>
            </div>
          </div>
        </td>

        <td className="classroom-stat">
          {getLabelFromOptions(gradeOptions, questionBank.gradeLevel)}
        </td>
        <td className="classroom-stat">
          {getLabelFromOptions(subjectOptions, questionBank.subject)}
        </td>
        <td>
          {questionBank.description || (
            <span className="classroom-code">Chưa có mô tả</span>
          )}
        </td>

        <td className="row-actions">
          <button
            onClick={() => onMenuClick(questionBank.id)}
            className="action-menu-trigger"
          >
            <MoreVertical size={18} />
          </button>

          {isMenuOpen && (
            <>
              <div className="menu-backdrop" onClick={onMenuClose} />
              <div className="action-menu">
                <button
                  className="action-menu-item"
                  onClick={() => {
                    onMenuClose();
                    onViewDetail(questionBank);
                  }}
                >
                  Xem chi tiết
                </button>
                <button
                  className="action-menu-item"
                  onClick={() => {
                    onMenuClose();
                    onCreateQuestion(questionBank);
                  }}
                >
                  Thêm câu hỏi
                </button>
                <button
                  className="action-menu-item"
                  onClick={() => {
                    onMenuClose();
                    onEdit(questionBank);
                  }}
                >
                  Chỉnh sửa
                </button>
                <button
                  className="action-menu-item danger"
                  onClick={() => {
                    onMenuClose();
                    onDelete(questionBank);
                  }}
                >
                  Xóa ngân hàng
                </button>
              </div>
            </>
          )}
        </td>
      </tr>
    );
  },
);

QuestionBankRow.displayName = "QuestionBankRow";

export default QuestionBankRow;
