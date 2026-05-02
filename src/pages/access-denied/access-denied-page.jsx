import { useLocation, useNavigate } from "react-router-dom";
import { PATH_AUTH } from "@/routes/paths";

const AccessDeniedPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const errorCode = query.get("code") || "2003";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <h1 className="text-[120px] font-extrabold leading-none text-gray-100 select-none">
        403
      </h1>

      <h2 className="mt-2 text-2xl font-semibold text-gray-800">
        Từ chối quyền truy cập
      </h2>

      <p className="mt-3 text-sm text-gray-500 text-center max-w-sm">
        Bạn không có quyền truy cập vào tài nguyên này hoặc lớp học đã bị giới hạn.
      </p>

      <p className="mt-2 text-sm text-gray-500 text-center max-w-sm">
        <strong>Mã lỗi:</strong> {errorCode}
      </p>

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

export default AccessDeniedPage;
