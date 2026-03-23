import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  BarChart2,
  CheckCircle2,
  ChevronRight,
  Clock,
  Database,
  Info,
  Lock,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { questionBankApi } from "@/apis/question-bank.api";
import {
  getLabelFromOptions,
  gradeOptions,
  subjectOptions,
} from "@/pages/question-bank/question-bank-options";
import { PATH_TEACHER } from "@/routes/paths";
import "@/assets/css/pages/question-bank/editResourceBankPage.css";

const MSG81 = "Ngân hàng đề đã được cập nhật thành công.";
const MSG82 = "Vui lòng nhập tên hợp lệ cho Ngân hàng đề trước khi lưu.";

const HISTORY = [
  { date: "2026-02-03 10:20", text: "Cập nhật mô tả ngân hàng" },
  {
    date: "2026-01-25 14:35",
    text: 'Đổi tên từ "Toán 10 - Chương Hàm số" thành "Toán 10 - Hàm số"',
  },
  { date: "2026-01-10 08:45", text: "Tạo ngân hàng đề" },
];

const EditResourceBankPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { bankId } = useParams();

  const safeBankId = Number(bankId);
  const stateBank = location.state?.bank ?? null;

  const [bankData, setBankData] = useState(stateBank);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nameError, setNameError] = useState("");
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    mc: 0,
    essay: 0,
    usage: 0,
  });

  useEffect(() => {
    if (stateBank) {
      setBankData(stateBank);
      setName(stateBank.name ?? "");
      setDescription(stateBank.description ?? "");
    }
  }, [stateBank]);

  useEffect(() => {
    if (!Number.isFinite(safeBankId) || safeBankId <= 0) {
      return;
    }

    if (bankData) {
      return;
    }

    const hydrateBank = async () => {
      try {
        const response = await questionBankApi.getQuestionBanks({
          page: 1,
          size: 100,
          sortBy: "createdAt",
          sortDirection: "DESC",
        });
        const banks = response?.result?.content ?? [];
        const matched = banks.find((item) => Number(item.id) === safeBankId);
        if (matched) {
          setBankData(matched);
          setName(matched.name ?? "");
          setDescription(matched.description ?? "");
        }
      } catch {
        // Keep page usable with route param fallback.
      }
    };

    hydrateBank();
  }, [bankData, safeBankId]);

  useEffect(() => {
    if (!Number.isFinite(safeBankId) || safeBankId <= 0) {
      return;
    }

    const fetchStats = async () => {
      try {
        const [all, mc, essay] = await Promise.all([
          questionBankApi.getQuestions(safeBankId, { page: 1, size: 1 }),
          questionBankApi.getQuestions(safeBankId, {
            page: 1,
            size: 1,
            type: "MULTIPLE_CHOICE",
          }),
          questionBankApi.getQuestions(safeBankId, {
            page: 1,
            size: 1,
            type: "ESSAY",
          }),
        ]);

        setStats({
          total: all?.result?.totalElements ?? 0,
          mc: mc?.result?.totalElements ?? 0,
          essay: essay?.result?.totalElements ?? 0,
          usage: 0,
        });
      } catch {
        setStats({ total: 0, mc: 0, essay: 0, usage: 0 });
      }
    };

    fetchStats();
  }, [safeBankId]);

  const gradeLabel = useMemo(() => {
    if (!bankData?.gradeLevel) return "-";
    return getLabelFromOptions(gradeOptions, bankData.gradeLevel);
  }, [bankData?.gradeLevel]);

  const subjectLabel = useMemo(() => {
    if (!bankData?.subject) return "-";
    return getLabelFromOptions(subjectOptions, bankData.subject);
  }, [bankData?.subject]);

  const validate = () => {
    const trimmed = String(name ?? "").trim();
    if (trimmed.length < 3) {
      setNameError(MSG82);
      return false;
    }
    setNameError("");
    return true;
  };

  const handleSave = async () => {
    setStatus(null);
    if (!validate()) {
      setStatus("error");
      return;
    }

    if (!Number.isFinite(safeBankId) || safeBankId <= 0) {
      setStatus("error");
      toast.error("ID ngân hàng đề không hợp lệ.");
      return;
    }

    setIsLoading(true);
    try {
      await questionBankApi.updateQuestionBank(safeBankId, {
        name: String(name).trim(),
        description: description || "",
      });
      setStatus("success");
      toast.success(MSG81);
      setBankData((prev) =>
        prev
          ? {
              ...prev,
              name: String(name).trim(),
              description: description || "",
            }
          : prev,
      );
    } catch (err) {
      setStatus("error");
      toast.error(
        err.response?.data?.message ??
          "Cập nhật ngân hàng đề thất bại. Vui lòng thử lại.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setName(bankData?.name ?? "");
    setDescription(bankData?.description ?? "");
    setNameError("");
    setStatus(null);
    navigate(PATH_TEACHER.questionBank);
  };

  return (
    <div className="edit-rb-page">
      <nav className="edit-rb-crumb">
        <Link to={PATH_TEACHER.questionBank} className="edit-rb-crumb-link">
          Ngân hàng đề
        </Link>
        <ChevronRight size={12} />
        <Link
          to={PATH_TEACHER.questionBankDetail(safeBankId)}
          className="edit-rb-crumb-link"
        >
          {bankData?.name || `Ngân hàng #${safeBankId}`}
        </Link>
        <ChevronRight size={12} />
        <span>Chỉnh sửa</span>
      </nav>

      <div className="edit-rb-heading">
        <div className="edit-rb-icon">
          <Database size={22} />
        </div>
        <div>
          <div className="edit-rb-heading-row">
            <h1>Chỉnh Sửa Ngân Hàng Đề</h1>
            <span className="edit-rb-badge">CHẾ ĐỘ CHỈNH SỬA</span>
          </div>
          <p>
            Cập nhật tên và mô tả ·{" "}
            {bankData?.name || `Ngân hàng #${safeBankId}`}
          </p>
        </div>
      </div>

      {status === "success" && (
        <div className="edit-rb-alert is-success">
          <CheckCircle2 size={17} />
          <div>
            <strong>MSG81: Cập nhật thành công</strong>
            <p>Ngân hàng đề đã được cập nhật. Tất cả thay đổi đã được lưu.</p>
          </div>
          <button type="button" onClick={() => setStatus(null)}>
            <X size={13} />
          </button>
        </div>
      )}

      {status === "error" && (
        <div className="edit-rb-alert is-error">
          <AlertCircle size={17} />
          <div>
            <strong>MSG82: Thông tin không hợp lệ</strong>
            <p>{MSG82}</p>
          </div>
          <button type="button" onClick={() => setStatus(null)}>
            <X size={13} />
          </button>
        </div>
      )}

      <div className="edit-rb-notice">
        <Info size={15} />
        <div>
          <h3>Lưu ý khi chỉnh sửa</h3>
          <p>
            Bạn có thể cập nhật tên và mô tả. Khối lớp và môn học không thể thay
            đổi sau khi tạo. Tất cả câu hỏi trong ngân hàng sẽ không bị ảnh
            hưởng.
          </p>
        </div>
      </div>

      <section className="edit-rb-stats">
        <div className="edit-rb-section-title">
          <BarChart2 size={14} />
          Thống kê ngân hàng đề
        </div>
        <div className="edit-rb-stats-grid">
          {[
            { label: "Tổng câu hỏi", value: stats.total, style: "is-total" },
            { label: "Trắc nghiệm", value: stats.mc, style: "is-mc" },
            { label: "Tự luận", value: stats.essay, style: "is-essay" },
            { label: "Lần sử dụng", value: stats.usage, style: "is-used" },
          ].map((item) => (
            <div className="edit-rb-stat-item" key={item.label}>
              <div className={`edit-rb-stat-value ${item.style}`}>
                {item.value}
              </div>
              <div className="edit-rb-stat-label">{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="edit-rb-card">
        <div className="edit-rb-meta-grid">
          {[
            ["Mã ngân hàng", `#${safeBankId}`],
            ["Khối lớp", gradeLabel],
            ["Môn học", subjectLabel],
            ["Tên hiện tại", bankData?.name || "-"],
          ].map(([label, value]) => (
            <div className="edit-rb-meta-item" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>

        <div className="edit-rb-section-title with-line">
          <Database size={14} />
          Thông tin ngân hàng đề
        </div>

        <div className="edit-rb-field">
          <label>
            Tên ngân hàng <span>*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError("");
            }}
            placeholder="Ví dụ: Toán 10 - Hàm số bậc nhất"
            className={nameError ? "has-error" : ""}
          />
          {nameError ? (
            <p className="edit-rb-error-text">{nameError}</p>
          ) : (
            <p className="edit-rb-hint">
              Đặt tên dễ nhận biết để phân biệt với các ngân hàng khác
            </p>
          )}
        </div>

        <div className="edit-rb-grid-2">
          <div className="edit-rb-field">
            <label>
              Khối lớp
              <span className="edit-rb-lock-chip">
                <Lock size={9} /> Không thể thay đổi
              </span>
            </label>
            <input type="text" value={gradeLabel} disabled />
          </div>

          <div className="edit-rb-field">
            <label>
              Môn học
              <span className="edit-rb-lock-chip">
                <Lock size={9} /> Không thể thay đổi
              </span>
            </label>
            <input type="text" value={subjectLabel} disabled />
          </div>
        </div>

        <div className="edit-rb-field">
          <label>
            Mô tả <small>(Không bắt buộc)</small>
          </label>
          <textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Nhập mô tả ngắn về mục đích sử dụng ngân hàng đề này..."
          />
        </div>

        <div className="edit-rb-history">
          <div className="edit-rb-history-title">
            <Clock size={13} /> Lịch sử thay đổi
          </div>
          <div className="edit-rb-history-list">
            {HISTORY.map((item) => (
              <div
                className="edit-rb-history-row"
                key={`${item.date}-${item.text}`}
              >
                <span className="edit-rb-history-date">{item.date}</span>
                <span className="edit-rb-history-text">- {item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="edit-rb-actions">
          <button
            type="button"
            className="edit-rb-btn-danger"
            onClick={() => setShowConfirm(true)}
          >
            <Trash2 size={14} /> Xóa ngân hàng
          </button>
          <div className="edit-rb-actions-right">
            <button
              type="button"
              className="edit-rb-btn-secondary"
              onClick={handleCancel}
            >
              Hủy
            </button>
            <button
              type="button"
              className="edit-rb-btn-primary"
              onClick={handleSave}
              disabled={isLoading}
            >
              <Save size={14} /> {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </div>
      </section>

      <div className="edit-rb-back-wrap">
        <Link
          to={PATH_TEACHER.questionBankDetail(safeBankId)}
          className="edit-rb-back-link"
        >
          <ArrowLeft size={14} /> Quay lại xem ngân hàng
        </Link>
      </div>

      {showConfirm && (
        <div className="edit-rb-overlay" onClick={() => setShowConfirm(false)}>
          <div
            className="edit-rb-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="edit-rb-modal-icon">
              <Trash2 size={26} />
            </div>
            <h3>Xác nhận xóa ngân hàng đề</h3>
            <p>
              Bạn có chắc chắn muốn xóa ngân hàng{" "}
              <strong>{bankData?.name || "N/A"}</strong>? Hành động này không
              thể khôi phục.
            </p>
            <div className="edit-rb-modal-actions">
              <button
                type="button"
                className="edit-rb-btn-secondary"
                onClick={() => setShowConfirm(false)}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="edit-rb-btn-danger"
                onClick={() => setShowConfirm(false)}
              >
                <Trash2 size={14} /> Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditResourceBankPage;
