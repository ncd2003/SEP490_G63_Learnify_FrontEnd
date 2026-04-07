import { useEffect, useMemo, useState } from "react";
import { Search, RotateCcw, UserCog } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "@/apis/admin.api";
import { PATH_ADMIN } from "@/routes/paths";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const ROLE_OPTIONS = [
  { label: "Tất cả vai trò", value: "" },
  { label: "Admin", value: "ROLE_ADMIN" },
  { label: "Teacher", value: "ROLE_TEACHER" },
  { label: "Student", value: "ROLE_STUDENT" },
  { label: "Guest", value: "ROLE_GUEST" },
];

const STATUS_OPTIONS = [
  { label: "Tất cả trạng thái", value: "" },
  { label: "Hoạt động", value: "ACTIVE" },
  { label: "Đã khóa", value: "BANNED" },
  { label: "Chưa xác minh", value: "UNVERIFIED" },
  { label: "Đã xóa", value: "DELETED" },
];

const formatRole = (role) => {
  switch (role) {
    case "ROLE_ADMIN":
      return "Admin";
    case "ROLE_TEACHER":
      return "Teacher";
    case "ROLE_STUDENT":
      return "Student";
    case "ROLE_GUEST":
      return "Guest";
    default:
      return role || "-";
  }
};

const formatStatus = (status) => {
  switch (status) {
    case "ACTIVE":
      return "Hoạt động";
    case "BANNED":
      return "Đã khóa";
    case "UNVERIFIED":
      return "Chưa xác minh";
    case "DELETED":
      return "Đã xóa";
    default:
      return status || "-";
  }
};

const formatDateTime = (iso) => {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const StatusPill = ({ status }) => {
  const className = useMemo(() => {
    switch (status) {
      case "ACTIVE":
        return "status-pill active";
      case "BANNED":
        return "status-pill banned";
      case "UNVERIFIED":
        return "status-pill unverified";
      default:
        return "status-pill default";
    }
  }, [status]);

  return <span className={className}>{formatStatus(status)}</span>;
};

const AdminUserListPage = () => {
  const navigate = useNavigate();
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);

  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await adminApi.getUsers({
          keyword,
          role,
          status,
          page,
          size,
        });

        const result = response?.result || {};
        setRows(result.content || []);
        setTotalPages(result.totalPages || 1);
        setTotalElements(result.totalElements || 0);
      } catch (err) {
        const backendMessage = err?.response?.data?.message;
        setError(backendMessage || "Không thể tải danh sách người dùng. Vui lòng thử lại.");
        setRows([]);
        setTotalPages(1);
        setTotalElements(0);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [keyword, role, status, page, size]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setKeyword(keywordInput.trim());
  };

  const resetFilters = () => {
    setKeywordInput("");
    setKeyword("");
    setRole("");
    setStatus("");
    setSize(10);
    setPage(1);
  };

  return (
    <div className="admin-user-list-page">
      <div className="header-card">
        <div>
          <p className="screen-label">User Management</p>
          <h1>Danh sách người dùng</h1>
          <p className="screen-subtitle">
            Theo dõi tài khoản người dùng, tìm kiếm nhanh theo tên/email và lọc theo vai trò hoặc trạng thái.
          </p>
        </div>
        <div className="header-icon">
          <UserCog size={20} />
          <span>{totalElements.toLocaleString("vi-VN")} tài khoản</span>
        </div>
      </div>

      <form className="filter-card" onSubmit={handleSearch}>
        <div className="filter-grid">
          <div className="filter-item search-item">
            <label htmlFor="keyword">Tìm kiếm</label>
            <div className="search-box">
              <Search size={16} />
              <input
                id="keyword"
                placeholder="Nhập tên hoặc email..."
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-item">
            <label htmlFor="role">Vai trò</label>
            <select
              id="role"
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setPage(1);
              }}
            >
              {ROLE_OPTIONS.map((item) => (
                <option value={item.value} key={item.value || "all-role"}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="status">Trạng thái</label>
            <select
              id="status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              {STATUS_OPTIONS.map((item) => (
                <option value={item.value} key={item.value || "all-status"}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="size">Số dòng / trang</label>
            <select
              id="size"
              value={size}
              onChange={(e) => {
                setSize(Number(e.target.value));
                setPage(1);
              }}
            >
              {PAGE_SIZE_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="filter-actions">
          <button type="submit" className="btn-primary">
            <Search size={16} />
            Tìm kiếm
          </button>
          <button type="button" className="btn-secondary" onClick={resetFilters}>
            <RotateCcw size={16} />
            Đặt lại
          </button>
        </div>
      </form>

      <div className="table-card">
        {error && <div className="error-banner">{error}</div>}

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Họ và tên</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="state-cell">Đang tải dữ liệu...</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="state-cell">Không có dữ liệu phù hợp.</td>
                </tr>
              ) : (
                rows.map((user) => (
                  <tr key={user.id}>
                    <td className="id-cell">#{user.id}</td>
                    <td>{user.fullName || "-"}</td>
                    <td>{user.email || "-"}</td>
                    <td>{formatRole(user.role)}</td>
                    <td>
                      <StatusPill status={user.status} />
                    </td>
                    <td>{formatDateTime(user.createdAt)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-row-view"
                        onClick={() => navigate(PATH_ADMIN.users.detail(user.id))}
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination-row">
          <span>
            Trang {page}/{Math.max(totalPages, 1)}
          </span>

          <div className="pagination-actions">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={loading || page <= 1}
            >
              Trước
            </button>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(prev + 1, Math.max(totalPages, 1)))}
              disabled={loading || page >= Math.max(totalPages, 1)}
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .admin-user-list-page {
          display: grid;
          gap: 16px;
          color: #0f172a;
        }

        .header-card {
          border: 1px solid #dbe5ef;
          border-radius: 14px;
          background: linear-gradient(145deg, #ecfeff 0%, #eef2ff 100%);
          padding: 18px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .screen-label {
          margin: 0 0 6px;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #0f766e;
          font-weight: 700;
        }

        .header-card h1 {
          margin: 0;
          font-size: clamp(22px, 2.5vw, 30px);
          line-height: 1.15;
        }

        .screen-subtitle {
          margin-top: 8px;
          color: #475569;
          font-size: 14px;
          max-width: 740px;
        }

        .header-icon {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid #bfdbfe;
          color: #1e3a8a;
          background: #eff6ff;
          padding: 8px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .filter-card,
        .table-card {
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          background: #fff;
          padding: 14px;
        }

        .filter-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 10px;
        }

        .filter-item {
          display: grid;
          gap: 6px;
        }

        .filter-item label {
          font-size: 12px;
          color: #475569;
          font-weight: 600;
        }

        .search-box,
        .filter-item select {
          min-height: 40px;
          border: 1px solid #cbd5e1;
          border-radius: 9px;
          background: #fff;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 10px;
          color: #64748b;
        }

        .search-box input {
          border: none;
          outline: none;
          width: 100%;
          color: #0f172a;
          font-size: 14px;
        }

        .filter-item select {
          padding: 0 10px;
          font-size: 14px;
          color: #0f172a;
          outline: none;
        }

        .filter-actions {
          margin-top: 10px;
          display: flex;
          gap: 8px;
        }

        .btn-primary,
        .btn-secondary,
        .pagination-actions button {
          border: 1px solid transparent;
          border-radius: 8px;
          min-height: 38px;
          padding: 0 12px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-primary {
          background: #0f766e;
          color: #fff;
        }

        .btn-secondary {
          background: #f8fafc;
          color: #334155;
          border-color: #cbd5e1;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 860px;
        }

        th,
        td {
          text-align: left;
          padding: 11px 10px;
          border-bottom: 1px solid #edf2f7;
          font-size: 14px;
        }

        th {
          color: #475569;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          background: #f8fafc;
        }

        .id-cell {
          font-weight: 600;
          color: #334155;
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          padding: 4px 9px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          border: 1px solid transparent;
        }

        .status-pill.active {
          background: #ecfdf3;
          color: #047857;
          border-color: #a7f3d0;
        }

        .status-pill.banned {
          background: #fef2f2;
          color: #b91c1c;
          border-color: #fecaca;
        }

        .status-pill.unverified {
          background: #fff7ed;
          color: #c2410c;
          border-color: #fed7aa;
        }

        .status-pill.default {
          background: #f1f5f9;
          color: #334155;
          border-color: #cbd5e1;
        }

        .state-cell {
          text-align: center;
          color: #64748b;
          padding: 24px 8px;
        }

        .btn-row-view {
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          color: #0f172a;
          border-radius: 8px;
          min-height: 32px;
          padding: 0 10px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .error-banner {
          margin-bottom: 10px;
          border: 1px solid #fecaca;
          background: #fff1f2;
          color: #b91c1c;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 13px;
        }

        .pagination-row {
          margin-top: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          color: #475569;
          font-size: 13px;
        }

        .pagination-actions {
          display: flex;
          gap: 8px;
        }

        .pagination-actions button {
          background: #f8fafc;
          color: #0f172a;
          border-color: #cbd5e1;
        }

        .pagination-actions button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        @media (max-width: 1080px) {
          .filter-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 680px) {
          .header-card {
            flex-direction: column;
          }

          .filter-grid {
            grid-template-columns: 1fr;
          }

          .filter-actions {
            flex-wrap: wrap;
          }

          .pagination-row {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminUserListPage;
