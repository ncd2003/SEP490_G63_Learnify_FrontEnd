import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  CircleAlert,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { questionBankApi } from "@/apis/question-bank.api";
import { PATH_TEACHER } from "@/routes/paths";
import "@/assets/css/pages/question-bank/importQuestionPage.css";

const MAX_PREVIEW_ROWS = 5;
const ACCEPTED_EXTENSIONS = ["xlsx", "xls"];

const isValidStatus = (status) =>
  String(status || "").toUpperCase() === "VALID";

const mapToConfirmRequest = (previewItems) =>
  previewItems
    .filter((item) => isValidStatus(item.status))
    .map((item) => {
      const data = item.questionData ?? {};
      return {
        content: data.content,
        questionType: data.questionType,
        difficulty: data.difficulty,
        defaultPoints: Number(data.defaultPoints ?? 0),
        sampleAnswer: data.sampleAnswer ?? null,
        options: Array.isArray(data.options)
          ? data.options.map((option) => ({
              content: option.content,
              isCorrect: Boolean(option.isCorrect ?? option.correct),
            }))
          : null,
      };
    });

const ImportQuestionPage = () => {
  const navigate = useNavigate();
  const { bankId } = useParams();
  const safeBankId = Number(bankId);
  const hasValidBankId = Number.isFinite(safeBankId) && safeBankId > 0;
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewItems, setPreviewItems] = useState([]);
  const [error, setError] = useState("");
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const previewRows = useMemo(
    () => previewItems.slice(0, MAX_PREVIEW_ROWS),
    [previewItems],
  );
  const validCount = useMemo(
    () => previewItems.filter((item) => isValidStatus(item.status)).length,
    [previewItems],
  );
  const invalidCount = useMemo(
    () => previewItems.length - validCount,
    [previewItems.length, validCount],
  );
  const confirmPayload = useMemo(
    () => mapToConfirmRequest(previewItems),
    [previewItems],
  );

  const handleBack = () => {
    navigate(
      hasValidBankId
        ? PATH_TEACHER.questionBankMethod(safeBankId)
        : PATH_TEACHER.questionBank,
    );
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!Number.isFinite(safeBankId) || safeBankId <= 0) {
      setError("Không tìm thấy ngân hàng đề hợp lệ để import.");
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setError("Chỉ hỗ trợ định dạng .xlsx hoặc .xls.");
      setSelectedFile(null);
      setPreviewItems([]);
      return;
    }

    setIsPreviewing(true);
    try {
      const response = await questionBankApi.previewImportQuestions(
        safeBankId,
        file,
      );
      const result = Array.isArray(response?.result) ? response.result : [];
      setSelectedFile(file);
      setPreviewItems(result);
      setError("");
      toast.success(
        response?.message ?? `Đã đọc ${result.length} dòng từ file Excel.`,
      );
    } catch (err) {
      const message =
        err.response?.data?.message ?? "Không thể đọc và preview file import.";
      setError(message);
      setSelectedFile(null);
      setPreviewItems([]);
      toast.error(message, { id: `import-question-error-${Date.now()}` });
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleImport = async () => {
    if (!Number.isFinite(safeBankId) || safeBankId <= 0) {
      setError("Không tìm thấy ngân hàng đề hợp lệ để import.");
      return;
    }

    if (confirmPayload.length === 0) {
      setError("Không có câu hỏi hợp lệ để import.");
      return;
    }

    setIsImporting(true);
    setError("");

    try {
      const response = await questionBankApi.confirmImportQuestions(
        safeBankId,
        confirmPayload,
      );
      toast.success(
        response?.message ?? "Import danh sách câu hỏi thành công.",
      );
      navigate(PATH_TEACHER.questionBank);
    } catch (err) {
      const message =
        err.response?.data?.message ?? "Import danh sách câu hỏi thất bại.";
      setError(message);
      toast.error(message, { id: `confirm-import-error-${Date.now()}` });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="import-question-page">
      <div className="import-question-header-row">
        <button
          type="button"
          className="import-question-back-btn"
          onClick={handleBack}
        >
          <ArrowLeft size={16} />
          Quay lại ngân hàng đề
        </button>
      </div>

      <section className="import-question-card">
        <div className="import-question-title-row">
          <div className="import-question-title-icon">
            <FileSpreadsheet size={18} />
          </div>
          <div>
            <h1 className="import-question-title">
              Tạo Câu Hỏi Bằng File Import
            </h1>
            <p className="import-question-subtitle">
              Tải lên file Excel để preview, kiểm tra lỗi và xác nhận import vào
              ngân hàng đề ID #{safeBankId || "-"}.
            </p>
          </div>
        </div>

        <div className="import-question-hint">
          <CircleAlert size={16} />
          <p>
            Hệ thống sẽ gọi API preview để kiểm tra từng dòng. Chỉ các dòng
            trạng thái VALID mới được gửi sang API confirm import.
          </p>
        </div>

        <div className="import-question-upload-row">
          <label
            htmlFor="import-question-file"
            className="import-question-upload-btn"
          >
            <Upload size={16} />
            {isPreviewing ? "Đang preview..." : "Chọn file Excel"}
          </label>
          <input
            id="import-question-file"
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={handleFileSelect}
            className="import-question-file-input"
            disabled={isPreviewing || isImporting}
          />
        </div>

        {selectedFile && (
          <div className="import-question-selected-file">
            <CheckCircle2 size={16} />
            File đã chọn: {selectedFile.name} ({previewItems.length} dòng
            preview)
          </div>
        )}

        {previewItems.length > 0 && (
          <div className="import-question-preview-stats">
            <span className="ok">VALID: {validCount}</span>
            <span className="bad">INVALID: {invalidCount}</span>
          </div>
        )}

        {error && (
          <div className="import-question-error-box">
            <CircleAlert size={16} />
            {error}
          </div>
        )}
      </section>

      <section className="import-question-card">
        <h2 className="import-question-section-title">Xem trước dữ liệu</h2>

        {previewItems.length === 0 ? (
          <p className="import-question-empty">Chưa có dữ liệu xem trước.</p>
        ) : (
          <>
            <div className="import-question-table-wrap">
              <table className="import-question-table">
                <thead>
                  <tr>
                    <th>Dòng</th>
                    <th>Trạng thái</th>
                    <th>Nội dung</th>
                    <th>Loại</th>
                    <th>Độ khó</th>
                    <th>Điểm</th>
                    <th>Lỗi</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row) => (
                    <tr key={row.rowNumber}>
                      <td>{row.rowNumber}</td>
                      <td>
                        <span
                          className={`import-status-chip ${
                            isValidStatus(row.status) ? "valid" : "invalid"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td>{row.questionData?.content || "-"}</td>
                      <td>{row.questionData?.questionType || "-"}</td>
                      <td>{row.questionData?.difficulty || "-"}</td>
                      <td>{row.questionData?.defaultPoints ?? "-"}</td>
                      <td>
                        {Array.isArray(row.errors) && row.errors.length > 0
                          ? row.errors.join("; ")
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {previewItems.length > MAX_PREVIEW_ROWS && (
              <p className="import-question-preview-note">
                Đang hiển thị {MAX_PREVIEW_ROWS}/{previewItems.length} dòng để
                xem trước.
              </p>
            )}
          </>
        )}

        <div className="import-question-actions">
          <button
            type="button"
            className="import-question-cancel-btn"
            onClick={handleBack}
          >
            Hủy
          </button>
          <button
            type="button"
            className="import-question-submit-btn"
            disabled={
              isImporting || isPreviewing || confirmPayload.length === 0
            }
            onClick={handleImport}
          >
            {isImporting ? "Đang import..." : "Xác nhận import câu hỏi"}
          </button>
        </div>
      </section>
    </div>
  );
};

export default ImportQuestionPage;
