import { useState } from "react";
import { Trash2, X } from "lucide-react";
import classroomApi from "@/apis/classroomApi";

const DeleteConfirmModal = ({ classroom, onClose, onSuccess }) => {
  const [deleting, setDeleting] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleDelete = async () => {
    setDeleting(true);
    setServerError("");
    try {
      await classroomApi.deleteClassroom(classroom.id);
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setServerError(
        err.response?.data?.message ?? "Xóa lớp học thất bại. Vui lòng thử lại."
      );
      setDeleting(false);
    }
  };

  if (!classroom) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Xóa lớp học</h2>
          <button
            onClick={onClose}
            disabled={deleting}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <Trash2 size={18} className="text-red-500" />
            </div>
            <div>
              <p className="text-sm text-gray-700">
                Bạn có chắc muốn xóa lớp{" "}
                <span className="font-semibold text-gray-900">
                  {classroom.name}
                </span>{" "}
                không? Hành động này không thể hoàn tác.
              </p>
              {serverError && (
                <p className="mt-3 text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
                  {serverError}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-5 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {deleting ? "Đang xóa..." : "Xóa lớp học"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
