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
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=Lora:wght@600;700&display=swap');
:root{--p:#3B6FED;--pd:#2B55C4;--pl:#EBF0FD;--bg:#FAFBFD;--card:#FFFFFF;--t:#1A2332;--t2:#5A6B82;--t3:#8E9BB3;--b:#E2E7EF;--f:'Be Vietnam Pro',sans-serif;--fd:'Lora',serif}
*{box-sizing:border-box}
.app{min-height:100vh;display:flex;flex-direction:column;background:var(--bg);font-family:var(--f);color:var(--t)}
.topbar{background:var(--card);border-bottom:1px solid var(--b);padding:0 24px;height:60px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:20}
.topbar-left{display:flex;align-items:center;gap:14px}
.topbar-back{display:flex;align-items:center;gap:8px;padding:6px 12px;border:none;background:none;color:var(--t2);font-size:13px;font-family:var(--f);cursor:pointer;border-radius:10px;transition:all .2s ease}
.topbar-back:hover{background:#EEF1F6;color:var(--t)}
.topbar-title{font-family:var(--fd);font-size:18px;font-weight:700}
.main{max-width:1720px;width:100%;margin:0 auto;padding:24px 12px 74px}
.crumb{font-size:12px;color:var(--t3);font-weight:700;letter-spacing:.04em;text-transform:uppercase;margin-bottom:12px}
.intro{display:flex;align-items:flex-start;gap:12px;margin-bottom:18px}
.intro-icon{width:44px;height:44px;border-radius:12px;background:var(--pl);color:var(--p);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.intro-title{font-family:var(--fd);font-size:30px;font-weight:700;line-height:1.25;margin-bottom:6px}
.intro-desc{font-size:14px;color:var(--t2);line-height:1.6}
.layout-grid{display:grid;grid-template-columns:1.35fr 1fr;gap:20px;margin-bottom:18px;align-items:stretch}
.layout-grid > *{height:100%}
.step-card{background:var(--card);border:1.5px solid var(--b);border-radius:16px;padding:22px;box-shadow:0 1px 3px rgba(26,35,50,.06);height:100%}
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
.setting-toggle-item .pill-group{gap:8px;flex-wrap:nowrap}
.setting-toggle-item .pill{flex:1;display:inline-flex;justify-content:center;padding:8px 12px}
.full{grid-column:1 / -1}
.help{font-size:11px;color:var(--t3);margin-top:4px}
.error{margin-top:12px;padding:10px 12px;border-radius:10px;background:#FDEDEB;color:#B91C1C;font-size:13px;font-weight:600}
.actions{display:flex;justify-content:flex-end;gap:10px}
.btn{height:42px;padding:0 18px;border-radius:10px;font-size:13px;font-weight:700;font-family:var(--f);cursor:pointer;border:none;display:inline-flex;align-items:center;gap:8px}
.btn.secondary{background:#FFF;border:1.5px solid var(--b);color:var(--t2)}
.btn.secondary:hover{border-color:var(--p);color:var(--p);background:var(--pl)}
.btn.primary{background:linear-gradient(135deg,var(--p),var(--pd));color:#FFF;box-shadow:0 6px 18px rgba(59,111,237,.28)}
.btn.primary:disabled{opacity:.6;cursor:not-allowed}
.loading{font-size:13px;color:var(--t2);margin-top:6px}
@media(max-width:1200px){.main{padding:22px 10px 74px}.layout-grid{grid-template-columns:1fr}.setting-grid,.setting-checks{grid-template-columns:1fr}.layout-grid > *{height:auto}.step-card,.setting-panel{height:auto}}
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

const SECTION_TYPE_OPTIONS = [
  { value: "OBJECTIVE", label: "Phần trắc nghiệm" },
  { value: "ESSAY", label: "Phần tự luận" },
  { value: "MIXED", label: "Phần hỗn hợp" },
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

const createMixedSectionDraft = (sectionType = "OBJECTIVE") => ({
  localId: `mixed-section-${Date.now()}-${Math.random()}`,
  id: null,
  title:
    sectionType === "ESSAY"
      ? "Phần tự luận"
      : sectionType === "MIXED"
        ? "Phần hỗn hợp"
        : "Phần trắc nghiệm",
  sectionType,
});

const normalizeSectionType = (value) => {
  const normalized = String(value || "")
    .trim()
    .toUpperCase();
  if (normalized === "ESSAY") return "ESSAY";
  if (normalized === "MIXED") return "MIXED";
  if (normalized === "OBJECTIVE" || normalized === "MULTIPLE_CHOICE") {
    return "OBJECTIVE";
  }
  return "OBJECTIVE";
};

const mapSectionsFromAssignment = (sections = []) => {
  if (!Array.isArray(sections)) return [];

  return sections
    .map((section) => {
      const id = toPositiveId(section?.id || section?.sectionId);
      const title = String(section?.title || "").trim();
      if (!id && !title) return null;

      return {
        localId: `mixed-section-${id || Math.random()}`,
        id,
        title: title || (id ? `Phần ${id}` : "Phần mới"),
        sectionType: normalizeSectionType(section?.sectionType),
      };
    })
    .filter(Boolean);
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
    requireFullScreen: false,
  });
  const [mixedSections, setMixedSections] = useState([
    createMixedSectionDraft("OBJECTIVE"),
    createMixedSectionDraft("ESSAY"),
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [isLoadingAssignment, setIsLoadingAssignment] = useState(false);
  const [errorText, setErrorText] = useState("");

  const pageTitle = isAiMode ? "Tạo bài tập với AI" : "Tạo bài tập thủ công";
  const crumbTitle = isAiMode ? "Tạo với AI" : "Tạo thủ công";
  const introDescription = isAiMode
    ? "Nhập thông tin cơ bản để khởi tạo bài tập nháp. Sau bước này hệ thống sẽ chuyển sang trang tạo câu hỏi với AI để bạn sinh đề theo cấu hình mong muốn."
    : "Nhập thông tin cơ bản để khởi tạo bài tập nháp. Sau bước này hệ thống sẽ chuyển sang trang soạn câu hỏi và tự động tạo phiên nháp để bạn tiếp tục làm dở.";
  let continueButtonLabel = "Tiếp tục đến soạn câu hỏi";
  if (isAiMode) {
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
          requireFullScreen: Boolean(loadedSetting?.requireFullScreen),
        });

        if (isAiMode && loadedFormat === "MIXED") {
          const loadedSections = mapSectionsFromAssignment(data?.sections);
          if (loadedSections.length > 0) {
            setMixedSections(loadedSections);
          }
        }
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

  useEffect(() => {
    if (!isAiMode || format !== "MIXED") return;

    setMixedSections((prev) =>
      prev.length
        ? prev
        : [
            createMixedSectionDraft("OBJECTIVE"),
            createMixedSectionDraft("ESSAY"),
          ],
    );
  }, [isAiMode, format]);

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

    const normalizedMixedSections = mixedSections.map((section) => ({
      ...section,
      title: String(section?.title || "").trim(),
      sectionType: normalizeSectionType(section?.sectionType),
      id: toPositiveId(section?.id),
    }));

    if (isAiMode && format === "MIXED") {
      if (!normalizedMixedSections.length) {
        setErrorText("Vui lòng tạo ít nhất một section cho đề hỗn hợp.");
        return;
      }

      const hasInvalidTitle = normalizedMixedSections.some(
        (section) => !section.title,
      );
      if (hasInvalidTitle) {
        setErrorText("Vui lòng nhập đầy đủ tên section.");
        return;
      }
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
        settingPayload.requireFullScreen = Boolean(setting.requireFullScreen);
        if (
          setting.limitTabs !== "" &&
          Number.isFinite(parsedLimitTabs) &&
          parsedLimitTabs >= 0
        ) {
          settingPayload.limitTabs = parsedLimitTabs;
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

      if (isAiMode && format === "MIXED") {
        const existingSections = normalizedMixedSections.filter(
          (section) => section.id,
        );
        const sectionsToCreate = normalizedMixedSections.filter(
          (section) => !section.id,
        );

        const createdSections = [];
        for (const section of sectionsToCreate) {
          const sectionResp = await assignmentApi.createSection(assignmentId, {
            title: section.title,
            sectionType: section.sectionType,
          });

          const createdId = toPositiveId(
            sectionResp?.result?.id || sectionResp?.result?.sectionId,
          );
          if (createdId) {
            createdSections.push({ ...section, id: createdId });
          }
        }

        const resolvedSections = [...existingSections, ...createdSections];
        if (resolvedSections.length > 0) {
          defaultSectionId = resolvedSections[0].id;
          sectionsForAiPage = resolvedSections
            .map((section) => {
              const safeSectionId = toPositiveId(section?.id);
              if (!safeSectionId) return null;

              return {
                id: safeSectionId,
                title:
                  String(section?.title || "").trim() ||
                  `Phần ${safeSectionId}`,
                sectionType: normalizeSectionType(section?.sectionType),
              };
            })
            .filter(Boolean);

          setMixedSections(
            resolvedSections.map((section) => ({
              ...section,
              localId:
                section.localId ||
                `mixed-section-${section.id}-${Math.random()}`,
            })),
          );
        }
      } else if (isAiMode) {
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

      const nextPath = isAiMode
        ? PATH_TEACHER.assignmentCreateAi
        : PATH_TEACHER.assignmentCreateManualQuestions;

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

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">Mô tả</label>
                <textarea
                  className="textarea"
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
                  <label className="label">
                    Section cho đề hỗn hợp <span className="req">*</span>
                  </label>
                  <div className="help" style={{ marginBottom: 8 }}>
                    Tạo section trước để sang trang AI có thể chọn sectionId khi
                    sinh câu hỏi theo từng phần.
                  </div>

                  <div style={{ display: "grid", gap: 8 }}>
                    {mixedSections.map((section, index) => (
                      <div
                        key={section.localId}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 180px 110px",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <input
                          className="input"
                          value={section.title}
                          placeholder={`Tên section ${index + 1}`}
                          onChange={(event) => {
                            const value = event.target.value;
                            setMixedSections((prev) =>
                              prev.map((item) =>
                                item.localId === section.localId
                                  ? { ...item, title: value }
                                  : item,
                              ),
                            );
                          }}
                        />

                        <select
                          className="select"
                          value={section.sectionType}
                          onChange={(event) => {
                            const value = normalizeSectionType(
                              event.target.value,
                            );
                            setMixedSections((prev) =>
                              prev.map((item) =>
                                item.localId === section.localId
                                  ? { ...item, sectionType: value }
                                  : item,
                              ),
                            );
                          }}
                        >
                          {SECTION_TYPE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          className="btn secondary"
                          style={{ height: 40, padding: "0 10px" }}
                          disabled={mixedSections.length <= 1}
                          onClick={() => {
                            setMixedSections((prev) =>
                              prev.filter(
                                (item) => item.localId !== section.localId,
                              ),
                            );
                          }}
                        >
                          Xóa
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="btn secondary"
                    style={{ marginTop: 8, height: 40 }}
                    onClick={() =>
                      setMixedSections((prev) => [
                        ...prev,
                        createMixedSectionDraft("OBJECTIVE"),
                      ])
                    }
                  >
                    + Thêm section
                  </button>
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
                  <label className="label">Mật khẩu (password)</label>
                  <input
                    className="input"
                    value={setting.password}
                    onChange={(event) =>
                      setSetting((prev) => ({
                        ...prev,
                        password: event.target.value,
                      }))
                    }
                    placeholder="Để trống nếu không dùng"
                  />
                </div>

                <div className="form-group">
                  <label className="label">
                    Thời gian làm bài (durationMinutes)
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
                  <label className="label">Bắt đầu (startTime)</label>
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
                  <label className="label">Hạn nộp (deadline)</label>
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
                    Hiển thị kết quả (resultVisibility)
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
                    Thời điểm release điểm (resultReleaseTime)
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
                    Cho phép nộp muộn (allowLateSubmission)
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
                    Trộn câu hỏi (shuffleQuestions)
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
                  <div className="setting-toggle-item">
                    <label className="label">
                      Giới hạn chuyển tab (limitTabs)
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

                  <div className="setting-toggle-item">
                    <label className="label">
                      Yêu cầu toàn màn hình (requireFullScreen)
                    </label>
                    <div className="pill-group">
                      <button
                        type="button"
                        className={`pill${setting.requireFullScreen ? " active" : ""}`}
                        onClick={() =>
                          setSetting((prev) => ({
                            ...prev,
                            requireFullScreen: true,
                          }))
                        }
                      >
                        Bật
                      </button>
                      <button
                        type="button"
                        className={`pill${!setting.requireFullScreen ? " active" : ""}`}
                        onClick={() =>
                          setSetting((prev) => ({
                            ...prev,
                            requireFullScreen: false,
                          }))
                        }
                      >
                        Tắt
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
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
