import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { assignmentApi } from "@/apis/assignment.api";
import { PATH_TEACHER } from "@/routes/paths";

const Icons = {
  ArrowLeft: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  Check: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  FileText: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  Eye: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  EyeOff: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M17.94 17.94A10.94 10.94 0 0112 20C5 20 1 12 1 12a21.77 21.77 0 015.06-6.94" />
      <path d="M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 8 11 8a21.62 21.62 0 01-2.12 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9.53 9.53a3 3 0 004.24 4.24" />
    </svg>
  ),
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Lora:wght@600;700&display=swap');
:root{--p:#3B6FED;--pd:#2B55C4;--pl:#EBF0FD;--bg:#FAFBFD;--card:#FFFFFF;--t:#1A2332;--t2:#5A6B82;--t3:#8E9BB3;--b:#E2E7EF;--f:'Be Vietnam Pro',sans-serif;--fd:'Be Vietnam Pro',sans-serif}
*{box-sizing:border-box}
.app{min-height:100%;display:flex;flex-direction:column;background:var(--bg);font-family:var(--f);color:var(--t)}
.topbar{background:var(--card);border-bottom:1px solid var(--b);padding:0 24px;height:60px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:20}
.topbar-left{display:flex;align-items:center;gap:14px}
.topbar-back{display:flex;align-items:center;gap:8px;padding:6px 12px;border:none;background:none;color:var(--t2);font-size:13px;font-family:var(--f);cursor:pointer;border-radius:10px;transition:all .2s ease}
.topbar-back:hover{background:#EEF1F6;color:var(--t)}
.topbar-title{font-family:var(--fd);font-size:18px;font-weight:700}
.main{max-width:1600px;width:100%;margin:0 auto;padding:24px clamp(10px,2vw,20px) 74px}
.crumb{font-size:12px;color:var(--t3);font-weight:700;letter-spacing:.04em;text-transform:uppercase;margin-bottom:12px}
.intro{display:flex;align-items:flex-start;gap:12px;margin-bottom:18px}
.intro-icon{width:44px;height:44px;border-radius:12px;background:var(--pl);color:var(--p);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.intro-title{font-family:var(--fd);font-size:30px;font-weight:700;line-height:1.25;margin-bottom:6px}
.intro-desc{font-size:14px;color:var(--t2);line-height:1.6}
.layout-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,520px),1fr));gap:20px;margin-bottom:18px;align-items:start}
.layout-grid > *{height:100%;min-width:0}
.step-card{background:var(--card);border:1.5px solid var(--b);border-radius:16px;padding:22px;box-shadow:0 1px 3px rgba(26,35,50,.06);height:100%;display:flex;flex-direction:column}
.step-head{display:flex;align-items:center;gap:10px;margin-bottom:16px}
.step-number{width:30px;height:30px;border-radius:50%;background:var(--pl);color:var(--p);font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.step-label{font-size:15px;font-weight:700;color:var(--t)}
.form-group{margin-bottom:14px}
.label{display:block;font-size:12px;font-weight:700;color:var(--t2);margin-bottom:6px;letter-spacing:.02em}
.req{color:#E34935}
.input,.select,.textarea{width:100%;border:1.5px solid var(--b);border-radius:10px;padding:10px 12px;font-size:14px;font-family:var(--f);color:var(--t);background:#F6F8FB;transition:all .2s ease}
.input:focus,.select:focus,.textarea:focus{outline:none;border-color:var(--p);background:#FFF;box-shadow:0 0 0 3px rgba(59,111,237,.1)}
.textarea{min-height:98px;resize:vertical;line-height:1.55}
.pill-group{display:flex;gap:10px;flex-wrap:wrap}
.pill{padding:9px 18px;border-radius:999px;font-size:13px;font-weight:500;font-family:var(--f);border:1.5px solid var(--b);background:#FFF;color:var(--t2);cursor:pointer;transition:all .2s ease}
.pill:hover{border-color:var(--p);color:var(--p);background:var(--pl)}
.pill.active{background:var(--p);color:#FFF;border-color:var(--p);box-shadow:0 2px 8px rgba(59,111,237,.25)}
.setting-panel{background:var(--card);border:1.5px solid var(--b);border-radius:16px;padding:22px;box-shadow:0 1px 3px rgba(26,35,50,.06);display:flex;flex-direction:column;height:100%}
.setting-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;align-content:start}
.setting-checks{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:auto;padding-top:6px}
.setting-toggle-item{padding:10px 12px;border:1.5px solid var(--b);border-radius:12px;background:#FFF}
.setting-toggle-item .label{margin-bottom:8px}
.setting-toggle-item .pill-group{gap:8px;flex-wrap:wrap}
.setting-toggle-item .pill{flex:1;min-width:86px;display:inline-flex;justify-content:center;padding:8px 12px}
.mixed-sections-list{display:grid;gap:8px}
.mixed-section-row{display:grid;grid-template-columns:minmax(0,1fr) 180px 110px;gap:8px;align-items:center}
.full{grid-column:1 / -1}
.help{font-size:11px;color:var(--t3);margin-top:4px}
.error{margin-top:12px;padding:10px 12px;border-radius:10px;background:#FDEDEB;color:#B91C1C;font-size:13px;font-weight:600}
.password-wrap{position:relative}
.password-input{padding-right:42px}
.password-peek-btn{position:absolute;top:50%;right:8px;transform:translateY(-50%);width:30px;height:30px;border:none;background:transparent;color:var(--t3);border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s ease}
.password-peek-btn:hover{background:var(--pl);color:var(--p)}
.actions{display:flex;justify-content:flex-end;gap:10px}
.btn{height:42px;padding:0 18px;border-radius:10px;font-size:13px;font-weight:700;font-family:var(--f);cursor:pointer;border:none;display:inline-flex;align-items:center;gap:8px}
.btn.secondary{background:#FFF;border:1.5px solid var(--b);color:var(--t2)}
.btn.secondary:hover{border-color:var(--p);color:var(--p);background:var(--pl)}
.btn.primary{background:linear-gradient(135deg,var(--p),var(--pd));color:#FFF;box-shadow:0 6px 18px rgba(59,111,237,.28)}
.btn.primary:disabled{opacity:.6;cursor:not-allowed}
.loading{font-size:13px;color:var(--t2);margin-top:6px}
@media(min-width:1320px){.layout-grid{grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);align-items:stretch}}
@media(max-width:1100px){.main{padding:22px 10px 74px}.setting-grid,.setting-checks{grid-template-columns:1fr}.layout-grid > *{height:auto}.step-card,.setting-panel{height:auto}}
@media(max-width:900px){.mixed-section-row{grid-template-columns:1fr}.mixed-section-row .btn{width:100%;justify-content:center}}
@media(max-width:640px){.topbar{padding:0 12px}.main{padding:18px 10px 74px}.intro-title{font-size:24px}.actions{flex-direction:column}.btn{justify-content:center;width:100%}}
`;

const CATEGORY_OPTIONS = [
  { value: "HOMEWORK", label: "Bài tập" },
  { value: "TEST", label: "Bài kiểm tra" },
];

const FORMAT_OPTIONS = [
  { value: "MULTIPLE_CHOICE", label: "Trắc nghiệm" },
  { value: "ESSAY", label: "Tự luận" },
  { value: "MIXED", label: "Hỗn hợp" },
];

const RESULT_VISIBILITY_OPTIONS = [
  { value: "", label: "Không thiết lập" },
  { value: "NONE", label: "Không cho phép xem lại" },
  { value: "SCORE_ONLY", label: "Chỉ xem điểm" },
  { value: "SCORE_AND_ANSWERS", label: "Xem điểm và đáp án" },
  { value: "FULL_DETAILS", label: "Xem chi tiết đầy đủ" },
];

const RESULT_RELEASE_TIME_OPTIONS = [
  { value: "", label: "Không thiết lập" },
  { value: "IMMEDIATELY", label: "Ngay lập tức" },
  { value: "AFTER_DEADLINE", label: "Sau deadline" },
  { value: "MANUAL", label: "Giáo viên tự mở" },
];

const normalizeFormatFromQuery = (value) => {
  const v = String(value || "").toUpperCase();
  if (v === "MC") return "MULTIPLE_CHOICE";
  if (v === "MULTIPLE_CHOICE" || v === "ESSAY" || v === "MIXED") return v;
  return "MIXED";
};

const toDateTimeLocal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (num) => String(num).padStart(2, "0");
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

const toInstantString = (value) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
};

const toPositiveId = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const resolveDefaultSectionId = (sections, format) => {
  const list = Array.isArray(sections) ? sections : [];
  if (!list.length) return null;

  const normalizedFormat = String(format || "").toUpperCase();
  const targetSectionType =
    normalizedFormat === "ESSAY" ? "ESSAY" : "OBJECTIVE";

  const matched = list.find((section) => {
    const normalizedSectionType = String(section?.sectionType || "")
      .trim()
      .toUpperCase();

    if (targetSectionType === "OBJECTIVE") {
      return (
        normalizedSectionType === "OBJECTIVE" ||
        normalizedSectionType === "MULTIPLE_CHOICE"
      );
    }

    return normalizedSectionType === targetSectionType;
  });

  return (
    toPositiveId(matched?.id || matched?.sectionId) ||
    toPositiveId(list[0]?.id || list[0]?.sectionId)
  );
};

const toAiSectionsStorageKey = (assignmentId) => {
  const safeId = toPositiveId(assignmentId);
  return safeId ? `learnify:assignment-ai:sections:${safeId}` : null;
};

const ManualAssignmentSetupPage = ({ mode = "manual" }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isAiMode = String(mode || "").toLowerCase() === "ai";
  const sourceMode = String(searchParams.get("source") || "")
    .trim()
    .toLowerCase();
  const isQuestionBankMode = sourceMode === "question-bank";
  const bankIdFromQuery = toPositiveId(searchParams.get("bankId"));

  const existingAssignmentId = searchParams.get("assignmentId")
    ? Number(searchParams.get("assignmentId"))
    : null;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("HOMEWORK");
  const [format, setFormat] = useState(
    normalizeFormatFromQuery(searchParams.get("format")),
  );
  const [setting, setSetting] = useState({
    password: "",
    durationMinutes: 45,
    startTime: "",
    deadline: "",
    allowLateSubmission: false,
    resultVisibility: "",
    resultReleaseTime: "",
    shuffleQuestions: false,
    limitTabs: "",
    maxAttemptsType: "UNLIMITED",
    maxAttempts: 1,
  });
  const [submitting, setSubmitting] = useState(false);
  const [isLoadingAssignment, setIsLoadingAssignment] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [isPasswordPeekVisible, setIsPasswordPeekVisible] = useState(false);

  const pageTitle = isQuestionBankMode
    ? "Tạo bài tập từ ngân hàng câu hỏi"
    : isAiMode
      ? "Tạo bài tập với AI"
      : "Tạo bài tập thủ công";
  const crumbTitle = isQuestionBankMode
    ? "Tạo từ ngân hàng câu hỏi"
    : isAiMode
      ? "Tạo với AI"
      : "Tạo thủ công";
  const introDescription = isQuestionBankMode
    ? "Nhập thông tin cơ bản để khởi tạo bài tập nháp. Sau bước này hệ thống sẽ chuyển sang trang import/chọn câu hỏi từ ngân hàng để bạn thêm câu hỏi vào bài tập."
    : isAiMode
      ? "Nhập thông tin cơ bản để khởi tạo bài tập nháp. Sau bước này hệ thống sẽ chuyển sang trang tạo câu hỏi với AI để bạn sinh đề theo cấu hình mong muốn."
      : "Nhập thông tin cơ bản để khởi tạo bài tập nháp. Sau bước này hệ thống sẽ chuyển sang trang soạn câu hỏi và tự động tạo phiên nháp để bạn tiếp tục làm dở.";
  let continueButtonLabel = "Tiếp tục đến soạn câu hỏi";
  if (isQuestionBankMode) {
    continueButtonLabel = "Tiếp tục đến import câu hỏi";
  } else if (isAiMode) {
    continueButtonLabel = "Tiếp tục đến tạo câu hỏi với AI";
  }
  if (submitting) {
    continueButtonLabel = "Đang khởi tạo...";
  }

  const settingPanelTitle =
    category === "TEST" ? "Thiết lập bài kiểm tra" : "Thiết lập bài tập";

  const queryBase = useMemo(() => {
    const next = new URLSearchParams(searchParams);
    next.delete("assignmentId");
    return next;
  }, [searchParams]);

  const withQuery = (path, overrides = {}) => {
    const next = new URLSearchParams(queryBase);
    Object.entries(overrides).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    });

    const query = next.toString();
    return query ? `${path}?${query}` : path;
  };

  const handleBack = () => {
    const preserved = searchParams.toString();
    navigate(
      preserved
        ? `${PATH_TEACHER.assignmentCreateMethod}?${preserved}`
        : PATH_TEACHER.assignmentCreateMethod,
    );
  };

  useEffect(() => {
    if (!existingAssignmentId) return;
    let alive = true;

    const load = async () => {
      setIsLoadingAssignment(true);
      try {
        const resp = await assignmentApi.getAssignment(existingAssignmentId);
        if (!alive) return;

        const data = resp?.result || {};
        const loadedSetting = data?.setting || {};

        setTitle(String(data?.title || ""));
        setDescription(String(data?.description || ""));
        setCategory(String(data?.category || "HOMEWORK").toUpperCase());
        const loadedFormat = normalizeFormatFromQuery(data?.format);
        setFormat(loadedFormat);
        setSetting({
          password: String(loadedSetting?.password || ""),
          durationMinutes: Number(loadedSetting?.durationMinutes || 45) || 45,
          startTime: toDateTimeLocal(loadedSetting?.startTime),
          deadline: toDateTimeLocal(loadedSetting?.deadline),
          allowLateSubmission: Boolean(loadedSetting?.allowLateSubmission),
          resultVisibility: String(loadedSetting?.resultVisibility || ""),
          resultReleaseTime: String(loadedSetting?.resultReleaseTime || ""),
          shuffleQuestions: Boolean(loadedSetting?.shuffleQuestions),
          limitTabs:
            loadedSetting?.limitTabs === null ||
            loadedSetting?.limitTabs === undefined
              ? ""
              : String(loadedSetting.limitTabs),
          maxAttemptsType: loadedSetting?.maxAttempts ? "LIMITED" : "UNLIMITED",
          maxAttempts: loadedSetting?.maxAttempts || 1,
        });
      } catch (error) {
        console.error("Load assignment failed", error);
      } finally {
        if (alive) setIsLoadingAssignment(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [existingAssignmentId, isAiMode]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const safeTitle = String(title || "").trim();
    const safeDescription = String(description || "").trim();
    const durationMinutes = Number(setting.durationMinutes);

    if (!category || !format) {
      setErrorText("Vui lòng chọn loại và định dạng bài tập.");
      return;
    }

    if (!safeTitle) {
      setErrorText("Vui lòng nhập tiêu đề bài tập.");
      return;
    }

    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      setErrorText("Thời gian làm bài phải lớn hơn 0 phút.");
      return;
    }

    if (
      setting.startTime &&
      setting.deadline &&
      new Date(setting.startTime).getTime() >=
        new Date(setting.deadline).getTime()
    ) {
      setErrorText("Thời gian bắt đầu phải nhỏ hơn thời hạn nộp.");
      return;
    }

    const parsedLimitTabs = Number(setting.limitTabs);
    if (
      category === "TEST" &&
      setting.limitTabs !== "" &&
      (!Number.isFinite(parsedLimitTabs) || parsedLimitTabs < 0)
    ) {
      setErrorText("Giới hạn chuyển tab phải là số nguyên không âm.");
      return;
    }

    setSubmitting(true);
    setErrorText("");

    try {
      const settingPayload = {
        allowLateSubmission: Boolean(setting.allowLateSubmission),
        shuffleQuestions: Boolean(setting.shuffleQuestions),
      };

      if (String(setting.password || "").trim()) {
        settingPayload.password = String(setting.password || "").trim();
      }

      if (Number.isFinite(durationMinutes) && durationMinutes > 0) {
        settingPayload.durationMinutes = durationMinutes;
      }

      const startTime = toInstantString(setting.startTime);
      const deadline = toInstantString(setting.deadline);
      if (startTime) settingPayload.startTime = startTime;
      if (deadline) settingPayload.deadline = deadline;

      if (String(setting.resultVisibility || "").trim()) {
        settingPayload.resultVisibility = String(setting.resultVisibility || "")
          .trim()
          .toUpperCase();
      }

      if (String(setting.resultReleaseTime || "").trim()) {
        settingPayload.resultReleaseTime = String(
          setting.resultReleaseTime || "",
        )
          .trim()
          .toUpperCase();
      }

      if (category === "TEST") {
        if (
          setting.limitTabs !== "" &&
          Number.isFinite(parsedLimitTabs) &&
          parsedLimitTabs >= 0
        ) {
          settingPayload.limitTabs = parsedLimitTabs;
        }
      } else if (category === "HOMEWORK") {
        if (setting.maxAttemptsType === "LIMITED") {
          const parsedAttempts = Number(setting.maxAttempts);
          if (Number.isFinite(parsedAttempts) && parsedAttempts > 0) {
            settingPayload.maxAttempts = parsedAttempts;
          } else {
            throw new Error("Số lần làm bài tối đa phải lớn hơn 0.");
          }
        } else {
          settingPayload.maxAttempts = null;
        }
      }

      const basePayload = {
        title: safeTitle,
        description: safeDescription || null,
        setting: settingPayload,
      };

      let assignmentId =
        Number.isFinite(existingAssignmentId) && existingAssignmentId > 0
          ? existingAssignmentId
          : null;
      let defaultSectionId = null;
      let sectionsForAiPage = [];

      if (assignmentId) {
        await assignmentApi.updateAssignment(assignmentId, basePayload);
      } else {
        const createPayload = {
          ...basePayload,
          category,
          format,
          status: "DRAFT",
        };

        const resp = await assignmentApi.createAssignment(createPayload);
        const resolvedId =
          resp?.result?.id || resp?.result?.assignmentId || resp?.result;

        if (!Number.isFinite(Number(resolvedId)) || Number(resolvedId) <= 0) {
          throw new Error("Không lấy được assignmentId từ phản hồi tạo mới.");
        }

        assignmentId = Number(resolvedId);
        defaultSectionId = resolveDefaultSectionId(
          resp?.result?.sections,
          format,
        );
      }

      if (isAiMode && format !== "MIXED") {
        const safeDefaultSectionId = toPositiveId(defaultSectionId);
        if (safeDefaultSectionId) {
          const sectionTypeByFormat =
            format === "ESSAY"
              ? "ESSAY"
              : format === "MULTIPLE_CHOICE"
                ? "OBJECTIVE"
                : "MIXED";

          sectionsForAiPage = [
            {
              id: safeDefaultSectionId,
              title:
                format === "ESSAY"
                  ? "Phần tự luận"
                  : format === "MULTIPLE_CHOICE"
                    ? "Phần trắc nghiệm"
                    : "Phần hỗn hợp",
              sectionType: sectionTypeByFormat,
            },
          ];
        }
      }

      if (isAiMode && typeof window !== "undefined") {
        const storageKey = toAiSectionsStorageKey(assignmentId);
        if (storageKey) {
          if (sectionsForAiPage.length > 0) {
            window.sessionStorage.setItem(
              storageKey,
              JSON.stringify(sectionsForAiPage),
            );
          } else {
            window.sessionStorage.removeItem(storageKey);
          }
        }
      }

      const nextPath = isQuestionBankMode
        ? PATH_TEACHER.assignmentQuestionBankPicker
        : isAiMode
          ? PATH_TEACHER.assignmentCreateAi
          : PATH_TEACHER.assignmentCreateManualQuestions;

      if (isQuestionBankMode) {
        navigate(
          withQuery(nextPath, {
            assignmentId,
            bankId: bankIdFromQuery,
          }),
        );
        return;
      }

      const nextSectionId =
        format === "MIXED"
          ? isAiMode
            ? defaultSectionId
            : undefined
          : defaultSectionId;

      navigate(
        withQuery(nextPath, {
          assignmentId,
          format: format.toLowerCase(),
          category: category.toLowerCase(),
          sectionId: nextSectionId,
        }),
      );
    } catch (error) {
      console.error(
        "Create/update assignment before manual editor failed",
        error,
      );
      const apiMessage = error?.response?.data?.message;
      setErrorText(
        apiMessage || "Không thể khởi tạo bài tập. Vui lòng thử lại.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app">
      <style>{CSS}</style>

      <div className="topbar">
        <div className="topbar-left">
          <button type="button" className="topbar-back" onClick={handleBack}>
            <Icons.ArrowLeft /> Quay lại
          </button>
          <div className="topbar-title">{pageTitle}</div>
        </div>
        <button
          type="submit"
          form="manual-setup-form"
          className="btn primary"
          disabled={submitting || isLoadingAssignment}
        >
          <Icons.Check /> {submitting ? "Đang khởi tạo..." : "Tiếp tục"}
        </button>
      </div>

      <div className="main">
        <div className="crumb">Khu vực làm việc / Bài tập / {crumbTitle}</div>

        <div className="intro">
          <div className="intro-icon">
            <Icons.FileText />
          </div>
          <div>
            <h1 className="intro-title">
              Cấu hình bài tập trước khi soạn câu hỏi
            </h1>
            <p className="intro-desc">{introDescription}</p>
          </div>
        </div>

        {isLoadingAssignment ? (
          <div className="loading">Đang tải dữ liệu bài tập...</div>
        ) : null}

        <form id="manual-setup-form" onSubmit={handleSubmit}>
          <div className="layout-grid">
            <div className="step-card">
              <div className="step-head">
                <div className="step-number">1</div>
                <div className="step-label">Thông tin cơ bản và phân loại</div>
              </div>

              <div className="form-group">
                <label className="label">
                  Tiêu đề bài tập <span className="req">*</span>
                </label>
                <input
                  className="input"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ví dụ: Kiểm tra chương 2 - Hóa học"
                  maxLength={180}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 14, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <label className="label">Mô tả</label>
                <textarea
                  className="textarea"
                  style={{ flexGrow: 1 }}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Mô tả ngắn về mục tiêu, phạm vi bài tập..."
                  maxLength={1000}
                />
              </div>

              <div className="form-group">
                <label className="label">
                  Loại bài tập <span className="req">*</span>
                </label>
                <div className="pill-group">
                  {CATEGORY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`pill${category === opt.value ? " active" : ""}`}
                      onClick={() => setCategory(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="label">
                  Định dạng câu hỏi <span className="req">*</span>
                </label>
                <div className="pill-group">
                  {FORMAT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`pill${format === opt.value ? " active" : ""}`}
                      onClick={() => setFormat(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {isAiMode && format === "MIXED" ? (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div className="help" style={{ marginTop: 10 }}>
                    Với đề hỗn hợp, bạn sẽ cấu hình và quản lý section trực tiếp
                    ở bước AI tiếp theo.
                  </div>
                </div>
              ) : null}
            </div>

            <div className="setting-panel">
              <div className="step-head">
                <div className="step-number">2</div>
                <div className="step-label">{settingPanelTitle}</div>
              </div>

              <div className="setting-grid">
                <div className="form-group">
                  <label className="label">Mật khẩu</label>
                  <div className="password-wrap">
                    <input
                      className="input password-input"
                      type={isPasswordPeekVisible ? "text" : "password"}
                      value={setting.password}
                      onChange={(event) =>
                        setSetting((prev) => ({
                          ...prev,
                          password: event.target.value,
                        }))
                      }
                      placeholder="Để trống nếu không dùng"
                    />
                    <button
                      type="button"
                      className="password-peek-btn"
                      aria-label="Nhấn giữ để xem mật khẩu"
                      title="Nhấn giữ để xem mật khẩu"
                      onMouseDown={() => setIsPasswordPeekVisible(true)}
                      onMouseUp={() => setIsPasswordPeekVisible(false)}
                      onMouseLeave={() => setIsPasswordPeekVisible(false)}
                      onTouchStart={() => setIsPasswordPeekVisible(true)}
                      onTouchEnd={() => setIsPasswordPeekVisible(false)}
                      onTouchCancel={() => setIsPasswordPeekVisible(false)}
                      onBlur={() => setIsPasswordPeekVisible(false)}
                    >
                      {isPasswordPeekVisible ? <Icons.EyeOff /> : <Icons.Eye />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="label">
                    Thời gian làm bài
                  </label>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    value={setting.durationMinutes}
                    onChange={(event) =>
                      setSetting((prev) => ({
                        ...prev,
                        durationMinutes: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="label">Bắt đầu</label>
                  <input
                    className="input"
                    type="datetime-local"
                    value={setting.startTime}
                    onChange={(event) =>
                      setSetting((prev) => ({
                        ...prev,
                        startTime: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="label">Hạn nộp</label>
                  <input
                    className="input"
                    type="datetime-local"
                    value={setting.deadline}
                    onChange={(event) =>
                      setSetting((prev) => ({
                        ...prev,
                        deadline: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="label">
                    Hiển thị kết quả
                  </label>
                  <select
                    className="select"
                    value={setting.resultVisibility}
                    onChange={(event) =>
                      setSetting((prev) => ({
                        ...prev,
                        resultVisibility: event.target.value,
                      }))
                    }
                  >
                    {RESULT_VISIBILITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">
                    Thời điểm công bố điểm
                  </label>
                  <select
                    className="select"
                    value={setting.resultReleaseTime}
                    onChange={(event) =>
                      setSetting((prev) => ({
                        ...prev,
                        resultReleaseTime: event.target.value,
                      }))
                    }
                  >
                    {RESULT_RELEASE_TIME_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="setting-toggle-item">
                  <label className="label">
                    Cho phép nộp muộn
                  </label>
                  <div className="pill-group">
                    <button
                      type="button"
                      className={`pill${setting.allowLateSubmission ? " active" : ""}`}
                      onClick={() =>
                        setSetting((prev) => ({
                          ...prev,
                          allowLateSubmission: true,
                        }))
                      }
                    >
                      Bật
                    </button>
                    <button
                      type="button"
                      className={`pill${!setting.allowLateSubmission ? " active" : ""}`}
                      onClick={() =>
                        setSetting((prev) => ({
                          ...prev,
                          allowLateSubmission: false,
                        }))
                      }
                    >
                      Tắt
                    </button>
                  </div>
                </div>

                <div className="setting-toggle-item">
                  <label className="label">
                    Trộn câu hỏi
                  </label>
                  <div className="pill-group">
                    <button
                      type="button"
                      className={`pill${setting.shuffleQuestions ? " active" : ""}`}
                      onClick={() =>
                        setSetting((prev) => ({
                          ...prev,
                          shuffleQuestions: true,
                        }))
                      }
                    >
                      Bật
                    </button>
                    <button
                      type="button"
                      className={`pill${!setting.shuffleQuestions ? " active" : ""}`}
                      onClick={() =>
                        setSetting((prev) => ({
                          ...prev,
                          shuffleQuestions: false,
                        }))
                      }
                    >
                      Tắt
                    </button>
                  </div>
                </div>
              </div>

              {category === "TEST" ? (
                <div className="setting-checks">
                  <div className="setting-toggle-item full">
                    <label className="label">
                      Giới hạn chuyển tab
                    </label>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      value={setting.limitTabs}
                      onChange={(event) =>
                        setSetting((prev) => ({
                          ...prev,
                          limitTabs: event.target.value,
                        }))
                      }
                      placeholder="Để trống nếu không giới hạn"
                    />

                  </div>
                </div>
              ) : (
                <div className="setting-checks">
                  <div className="setting-toggle-item full">
                    <label className="label">
                      Số lần làm bài tối đa
                    </label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div className="pill-group" style={{ flex: 1 }}>
                        <button
                          type="button"
                          className={`pill${setting.maxAttemptsType === "UNLIMITED" ? " active" : ""}`}
                          onClick={() => setSetting(p => ({ ...p, maxAttemptsType: "UNLIMITED" }))}
                        >
                          Vô hạn
                        </button>
                        <button
                          type="button"
                          className={`pill${setting.maxAttemptsType === "LIMITED" ? " active" : ""}`}
                          onClick={() => setSetting(p => ({ ...p, maxAttemptsType: "LIMITED" }))}
                        >
                          Giới hạn
                        </button>
                      </div>
                      {setting.maxAttemptsType === "LIMITED" && (
                        <div style={{ position: 'relative', width: 90 }}>
                          <input
                            className="input"
                            type="number"
                            min="1"
                            value={setting.maxAttempts}
                            onChange={(e) => setSetting(p => ({ ...p, maxAttempts: e.target.value }))}
                            style={{ paddingRight: 32, textAlign: 'center', height: '100%' }}
                          />
                          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--t2)', fontWeight: 600 }}>lần</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {errorText ? <div className="error">{errorText}</div> : null}

          <div className="actions">
            <button
              type="button"
              className="btn secondary"
              onClick={handleBack}
            >
              <Icons.ArrowLeft /> Quay lại chọn phương thức
            </button>
            <button
              type="submit"
              className="btn primary"
              disabled={submitting || isLoadingAssignment}
            >
              <Icons.Check /> {continueButtonLabel}
            </button>
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              fontWeight: 700,
              color: "#1D4ED8",
              background: "#EFF6FF",
              border: "1px solid #BFDBFE",
              borderRadius: 10,
              padding: "8px 12px",
            }}
          >
            Gợi ý bằng Text: Bạn có thể thay đổi các cài đặt này sau khi đã soạn
            xong đề thi.
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualAssignmentSetupPage;
