import { ChevronRight, Layers, PenLine, Upload } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { PATH_TEACHER } from "@/routes/paths";
import "@/assets/css/pages/question-bank/addQuestionMethodPage.css";

const METHODS = [
  {
    key: "import",
    icon: Upload,
    title: "Tạo bằng Import file",
    description:
      "Tải file Excel, preview từng dòng hợp lệ và import nhanh vào ngân hàng đề.",
    to: (bankId) => PATH_TEACHER.questionBankImport(bankId),
    badge: "Nhanh",
  },
  {
    key: "ai",
    icon: Layers,
    title: "Tạo bằng AI",
    description:
      "AI phân tích tài liệu, sinh câu hỏi theo độ khó và số lượng bạn cấu hình.",
    to: (bankId) => PATH_TEACHER.questionBankAi(bankId),
    badge: "Tự động",
  },
  {
    key: "manual",
    icon: PenLine,
    title: "Tạo thủ công",
    description:
      "Soạn câu hỏi chi tiết theo ý bạn với đáp án và điểm số tùy chỉnh.",
    to: (bankId) => PATH_TEACHER.questionBankManual(bankId),
    badge: "Linh hoạt",
  },
];

const AddQuestionMethodPage = () => {
  const { bankId } = useParams();
  const safeBankId = Number(bankId);
  const hasValidBankId = Number.isFinite(safeBankId) && safeBankId > 0;

  return (
    <div className="add-question-method-page">
      <div className="add-question-method-header">
        <h1>Chọn phương thức tạo câu hỏi</h1>
        <p>Ngân hàng đề ID #{Number.isFinite(safeBankId) ? safeBankId : "-"}</p>
      </div>

      <div className="add-question-method-grid">
        {METHODS.map((method) => {
          const Icon = method.icon;
          return (
            <article key={method.key} className="method-card">
              <div className="method-card-top">
                <div className="method-icon-wrap">
                  <Icon size={22} />
                </div>
                <span className="method-badge">{method.badge}</span>
              </div>
              <h2>{method.title}</h2>
              <p>{method.description}</p>
              <Link
                to={
                  hasValidBankId
                    ? method.to(safeBankId)
                    : PATH_TEACHER.questionBank
                }
                className="method-cta"
              >
                Tiếp tục
                <ChevronRight size={16} />
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default AddQuestionMethodPage;
