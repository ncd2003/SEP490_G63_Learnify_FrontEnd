import { useNavigate } from "react-router-dom";
import { PATH_AUTH } from "@/routes/paths";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      {/* Số 404 lớn */}
      <h1 className="text-[120px] font-extrabold leading-none text-gray-100 select-none">
        404
      </h1>

      {/* Tiêu đề */}
      <h2 className="mt-2 text-2xl font-semibold text-gray-800">
        Trang không tồn tại
      </h2>

      {/* Mô tả */}
      <p className="mt-3 text-sm text-gray-500 text-center max-w-sm">
        Trang bạn đang tìm kiếm có thể đã bị xóa, đổi tên hoặc tạm thời không
        khả dụng.
      </p>

      {/* Nút quay lại */}
      <div className="mt-8 flex gap-3">
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          ← Quay lại
        </button>
        <button
          onClick={() => navigate(PATH_AUTH.home, { replace: true })}
          className="px-5 py-2 rounded-md bg-gray-900 text-sm text-white hover:bg-gray-700 transition-colors"
        >
          Về trang chủ
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;
