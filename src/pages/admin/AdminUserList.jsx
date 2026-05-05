import { useEffect, useMemo, useState } from "react";
import { Search, RotateCcw, UserCog, Eye } from "lucide-react";
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

const CREATE_ROLE_OPTIONS = [
  { label: "-- Chọn vai trò --", value: "" },
  { label: "Admin", value: "ROLE_ADMIN" },
  { label: "Teacher", value: "ROLE_TEACHER" },
  { label: "Student", value: "ROLE_STUDENT" },
];

const INITIAL_CREATE_FORM = {
  fullName: "",
  email: "",
  phoneNumber: "",
  role: "",
};

const formatRole = (role) => {
  switch (role) {
    case "ROLE_ADMIN":
      return "Admin";
    case "ROLE_TEACHER":
      return "Teacher";
    case "ROLE_STUDENT":
      return "Student";
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
  const [reloadKey, setReloadKey] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(INITIAL_CREATE_FORM);
  const [createFieldErrors, setCreateFieldErrors] = useState({});
  const [createSuccess, setCreateSuccess] = useState("");
  const [createError, setCreateError] = useState("");

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
  }, [keyword, role, status, page, size, reloadKey]);

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

  const openCreateModal = () => {
    setCreateForm(INITIAL_CREATE_FORM);
    setCreateFieldErrors({});
    setCreateSuccess("");
    setCreateError("");
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    if (creating) return;
    setIsCreateModalOpen(false);
  };

  const handleCreateFieldChange = (field, value) => {
    setCreateForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    setCreateFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setCreateSuccess("");
    setCreateError("");
  };

  const validateCreateForm = () => {
    const errors = {};

    if (!createForm.fullName.trim()) {
      errors.fullName = "Vui lòng điền đầy đủ các thông tin bắt buộc.";
    }

    if (!createForm.email.trim()) {
      errors.email = "Vui lòng điền đầy đủ các thông tin bắt buộc.";
    }

    if (!createForm.role) {
      errors.role = "Vui lòng điền đầy đủ các thông tin bắt buộc.";
    }

    if (createForm.email.trim() && !/^\S+@\S+\.\S+$/.test(createForm.email.trim())) {
      errors.email = "Email không hợp lệ.";
    }

    setCreateFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!validateCreateForm()) return;

    try {
      setCreating(true);
      setCreateSuccess("");
      setCreateError("");

      const payload = {
        fullName: createForm.fullName.trim(),
        email: createForm.email.trim(),
        role: createForm.role,
      };

      if (createForm.phoneNumber.trim()) {
        payload.phoneNumber = createForm.phoneNumber.trim();
      }

      const response = await adminApi.createUser(payload);
      setCreateSuccess(response?.message || "Tạo người dùng mới thành công. Mật khẩu đã được gửi qua email.");
      setCreateForm(INITIAL_CREATE_FORM);
      setCreateFieldErrors({});
      setPage(1);
      setReloadKey((prev) => prev + 1);
    } catch (err) {
      const backendMessage = err?.response?.data?.message;

      if (backendMessage && /email/i.test(backendMessage)) {
        setCreateFieldErrors((prev) => ({
          ...prev,
          email: `${backendMessage}`,
        }));
        return;
      }

      if (backendMessage && /đầy đủ|bắt buộc/i.test(backendMessage)) {
        setCreateFieldErrors({
          fullName: "Vui lòng điền đầy đủ các thông tin bắt buộc.",
          email: "Vui lòng điền đầy đủ các thông tin bắt buộc.",
          role: "Vui lòng điền đầy đủ các thông tin bắt buộc.",
        });
        return;
      }

      setCreateError(backendMessage || "Không thể tạo người dùng mới. Vui lòng thử lại.");
    } finally {
      setCreating(false);
    }
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
        <div className="header-tools">
          <div className="header-icon">
            <UserCog size={20} />
            <span>{totalElements.toLocaleString("vi-VN")} tài khoản</span>
          </div>
          <button type="button" className="btn-create-user" onClick={openCreateModal}>
            Thêm người dùng
          </button>
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
                        title="Chi tiết"
                      >
                        <Eye size={18} />
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

      {isCreateModalOpen && (
        <div className="create-modal-backdrop" onClick={closeCreateModal}>
          <div className="create-modal" onClick={(e) => e.stopPropagation()}>
            <div className="create-modal-header">
              <h3>Thêm người dùng mới</h3>
            </div>

            <form className="create-form" onSubmit={handleCreateUser}>
              <div className="create-form-grid two-cols">
                <div className="create-field">
                  <label htmlFor="create-full-name">Họ và tên *</label>
                  <input
                    id="create-full-name"
                    value={createForm.fullName}
                    onChange={(e) => handleCreateFieldChange("fullName", e.target.value)}
                    placeholder="Nhập họ và tên"
                  />
                  {createFieldErrors.fullName && <p className="create-field-error">{createFieldErrors.fullName}</p>}
                </div>

                <div className="create-field">
                  <label htmlFor="create-email">Email *</label>
                  <input
                    id="create-email"
                    value={createForm.email}
                    onChange={(e) => handleCreateFieldChange("email", e.target.value)}
                    placeholder="Nhập email"
                  />
                  {createFieldErrors.email && <p className="create-field-error">{createFieldErrors.email}</p>}
                </div>
              </div>

              <div className="create-form-grid two-cols">
                <div className="create-field">
                  <label htmlFor="create-phone">Số điện thoại (tùy chọn)</label>
                  <input
                    id="create-phone"
                    value={createForm.phoneNumber}
                    onChange={(e) => handleCreateFieldChange("phoneNumber", e.target.value)}
                    placeholder="Nhập số điện thoại"
                  />
                </div>

                <div className="create-field">
                  <label htmlFor="create-role">Vai trò *</label>
                  <select
                    id="create-role"
                    value={createForm.role}
                    onChange={(e) => handleCreateFieldChange("role", e.target.value)}
                  >
                    {CREATE_ROLE_OPTIONS.map((item) => (
                      <option value={item.value} key={item.value || "create-role-empty"}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  {createFieldErrors.role && <p className="create-field-error">{createFieldErrors.role}</p>}
                </div>
              </div>

              <div className="create-note-box">
                Hệ thống sẽ sinh mật khẩu ngẫu nhiên. Admin không được nhập hoặc xem mật khẩu này. Người dùng bắt buộc đổi
                mật khẩu sau lần đăng nhập đầu tiên.
              </div>

              {createSuccess && <p className="create-success">{createSuccess}</p>}
              {createError && <p className="create-error">{createError}</p>}

              <div className="create-actions">
                <button type="button" className="btn-secondary" onClick={closeCreateModal} disabled={creating}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary" disabled={creating}>
                  {creating ? "Đang tạo..." : "Tạo tài khoản"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

        .header-tools {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
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

        .btn-create-user {
          min-height: 38px;
          border: 1px solid #0f172a;
          background: #0f172a;
          color: #fff;
          border-radius: 8px;
          padding: 0 14px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
        }

        .filter-card,
        .table-card {
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          background: #fff;
          padding: 14px;
        }

        .create-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow-y: auto;
          padding: 24px 16px;
          z-index: 1200;
          backdrop-filter: blur(2px);
        }

        .create-modal {
          width: min(760px, calc(100vw - 32px));
          max-height: calc(100vh - 48px);
          margin: auto;
          border-radius: 14px;
          border: 1px solid #cbd5e1;
          background: #fff;
          box-shadow: 0 20px 45px rgba(15, 23, 42, 0.25);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .create-modal-header {
          border-bottom: 1px solid #e2e8f0;
          padding: 14px 18px;
          background: #f8fafc;
          flex-shrink: 0;
        }

        .create-modal-header h3 {
          margin: 0;
          font-size: 18px;
          color: #0f172a;
        }

        .create-form {
          padding: 16px 18px 18px;
          display: grid;
          gap: 14px;
          overflow-y: auto;
        }

        .create-form-grid {
          display: grid;
          gap: 12px;
        }

        .create-form-grid.two-cols {
          grid-template-columns: 1fr 1fr;
        }

        .create-field {
          display: grid;
          gap: 6px;
        }

        .create-field label {
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
        }

        .create-field input,
        .create-field select {
          min-height: 40px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 0 10px;
          font-size: 14px;
          color: #0f172a;
          outline: none;
          background: #fff;
        }

        .create-field input:focus,
        .create-field select:focus {
          border-color: #0f766e;
          box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.12);
        }

        .create-field-error {
          margin: 0;
          color: #dc2626;
          font-size: 12px;
          line-height: 1.35;
          font-weight: 600;
        }

        .create-note-box {
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          border-radius: 8px;
          padding: 11px 12px;
          font-size: 12px;
          color: #334155;
          line-height: 1.5;
        }

        .create-success,
        .create-error {
          margin: 0;
          font-size: 13px;
          font-weight: 600;
        }

        .create-success {
          color: #047857;
        }

        .create-error {
          color: #b91c1c;
        }

        .create-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding-top: 8px;
          border-top: 1px solid #e2e8f0;
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
          border: none;
          background: transparent;
          color: #64748b;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, color 0.15s;
        }

        .btn-row-view:hover {
          background: #f1f5f9;
          color: #0f766e;
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
          padding-top: 14px;
          border-top: 1px solid #e2e8f0;
          gap: 12px;
          color: #475569;
          font-size: 13px;
          font-weight: 600;
        }

        .pagination-actions {
          display: flex;
          gap: 6px;
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

          .header-tools {
            width: 100%;
            justify-content: space-between;
          }

          .filter-grid {
            grid-template-columns: 1fr;
          }

          .create-modal-backdrop {
            padding: 12px;
          }

          .create-modal {
            width: calc(100vw - 24px);
            max-height: calc(100vh - 24px);
            border-radius: 12px;
          }

          .create-modal-header,
          .create-form {
            padding-left: 14px;
            padding-right: 14px;
          }

          .create-form-grid.two-cols {
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
