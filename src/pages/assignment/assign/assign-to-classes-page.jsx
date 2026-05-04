import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { assignmentApi } from "@/apis/assignment.api";
import { PATH_TEACHER } from "@/routes/paths";

const defaultSettings = () => ({
  password: "",
  durationMinutes: 45,
  startTime: "",
  deadline: "",
  allowLateSubmission: false,
  resultVisibility: "AFTER_SUBMIT",
  resultReleaseTime: "IMMEDIATELY",
  submissionFormats: ["ONLINE"],
  shuffleQuestions: false,
  limitTabs: "",
  requireFullScreen: false,
  maxAttempts: 1,
  maxAttemptsType: "UNLIMITED",
});

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

const SETTINGS_PANEL_CSS = `
.assign-setting-panel{background:#FFFFFF;border:1.5px solid #E2E8F0;border-radius:14px;padding:14px;box-shadow:0 1px 3px rgba(26,35,50,.04)}
.assign-step-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}
.assign-step-head-left{display:flex;align-items:center;gap:10px}
.assign-step-number{width:28px;height:28px;border-radius:50%;background:#EFF6FF;color:#2563EB;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.assign-step-label{font-size:14px;font-weight:700;color:#1E293B}
.assign-save-btn{height:34px;padding:0 14px;border-radius:10px;border:none;background:linear-gradient(135deg,#3B82F6,#2563EB);color:#FFF;font-size:12px;font-weight:700;font-family:'Be Vietnam Pro','Segoe UI',sans-serif;cursor:pointer;display:inline-flex;align-items:center;gap:7px;white-space:nowrap}
.assign-save-btn:disabled{cursor:not-allowed;opacity:.65}
.assign-form-group{margin-bottom:12px}
.assign-form-group:last-child{margin-bottom:0}
.assign-label{display:block;font-size:11px;font-weight:700;color:#64748B;margin-bottom:5px;letter-spacing:.02em}
.assign-input,.assign-select{width:100%;height:36px;border:1.5px solid #E2E8F0;border-radius:10px;padding:0 11px;font-size:12px;font-family:'Be Vietnam Pro','Segoe UI',sans-serif;color:#1E293B;background:#F8FAFC;transition:all .2s ease;outline:none}
.assign-input:focus,.assign-select:focus{border-color:#3B82F6;background:#FFFFFF;box-shadow:0 0 0 3px rgba(59,130,246,.12)}
.assign-input-wrap{position:relative}
.assign-input-wrap .assign-input{padding-right:38px}
.assign-input-eye{position:absolute;right:8px;top:50%;transform:translateY(-50%);border:none;background:transparent;color:#94A3B8;cursor:pointer;padding:4px;border-radius:8px;display:flex;align-items:center;justify-content:center}
.assign-input-eye:hover{color:#2563EB;background:#EFF6FF}
.assign-input-eye:focus-visible{outline:2px solid rgba(59,130,246,.35);outline-offset:2px}
.assign-setting-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;align-content:start}
.assign-full-width{grid-column:1 / -1}
.assign-setting-checks{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:2px}
.assign-toggle-item{padding:10px 12px;border:1.5px solid #E2E8F0;border-radius:12px;background:#FFFFFF}
.assign-pill-group{display:flex;gap:8px;flex-wrap:nowrap}
.assign-pill{flex:1;display:inline-flex;justify-content:center;align-items:center;padding:8px 11px;border-radius:999px;font-size:12px;font-weight:600;font-family:'Be Vietnam Pro','Segoe UI',sans-serif;border:1.5px solid #E2E8F0;background:#FFFFFF;color:#64748B;cursor:pointer;transition:all .2s ease}
.assign-pill:hover{border-color:#3B82F6;color:#2563EB;background:#EFF6FF}
.assign-pill.active{background:#3B82F6;border-color:#3B82F6;color:#FFFFFF;box-shadow:0 2px 8px rgba(59,130,246,.25)}
@media(max-width:1024px){.assign-setting-grid,.assign-setting-checks{grid-template-columns:1fr}}
@media(max-width:640px){.assign-step-head{flex-direction:column;align-items:flex-start}.assign-save-btn{width:100%;justify-content:center}}
`;

const toLocalDateTimeInput = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const toIsoDateTime = (value) => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
};

const toOverridePayload = (config = {}, category = "HOMEWORK") => {
  const isTest = String(category || "").toUpperCase() === "TEST";
  const durationMinutes = Number(config.durationMinutes);
  const limitTabs = Number(config.limitTabs);

  return {
    password: String(config.password || "").trim() || null,
    durationMinutes:
      Number.isFinite(durationMinutes) && durationMinutes > 0
        ? Math.round(durationMinutes)
        : null,
    startTime: toIsoDateTime(config.startTime),
    deadline: toIsoDateTime(config.deadline),
    allowLateSubmission: Boolean(config.allowLateSubmission),
    shuffleQuestions: Boolean(config.shuffleQuestions),
    resultVisibility: String(config.resultVisibility || "").trim() || null,
    resultReleaseTime: String(config.resultReleaseTime || "").trim() || null,
    limitTabs:
      !isTest || String(config.limitTabs || "").trim() === ""
        ? null
        : Number.isFinite(limitTabs)
          ? Math.max(0, Math.round(limitTabs))
          : null,
    requireFullScreen: isTest ? Boolean(config.requireFullScreen) : false,
    maxAttempts:
      config.maxAttemptsType === "UNLIMITED"
        ? null
        : Number.isFinite(Number(config.maxAttempts))
          ? Math.max(1, Math.round(Number(config.maxAttempts)))
          : 1,
  };
};

const getInitials = (name) => {
  const value = String(name || "").trim();
  if (!value) return "CL";
  return (
    value.replace(/\d/g, "").substring(0, 2).toUpperCase() ||
    value.substring(0, 2).toUpperCase()
  );
};

const normalizeClassroom = (item) => {
  const id = Number(item?.id || item?.classroomId);
  if (!Number.isFinite(id) || id <= 0) return null;

  return {
    id,
    name: String(item?.name || item?.className || `Lớp ${id}`),
    subject: String(item?.subject || "Môn học"),
    students: Number(
      item?.students || item?.studentCount || item?.totalStudents || 0,
    ),
  };
};

const Ic = {
  Users: (p) => (
    <svg
      {...p}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  ArrowLeft: (p) => (
    <svg
      {...p}
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
  Check: (p) => (
    <svg
      {...p}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  ChevDown: (p) => (
    <svg
      {...p}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  Send: (p) => (
    <svg
      {...p}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
};

const Toast = ({ message, type }) =>
  message ? (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        padding: "10px 18px",
        borderRadius: 10,
        background: type === "error" ? "#EF4444" : "#10B981",
        color: "#fff",
        fontSize: 12,
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: 7,
        boxShadow: "0 8px 32px rgba(0,0,0,.15)",
        zIndex: 9999,
      }}
    >
      <Ic.Check width={12} height={12} />
      {message}
    </div>
  ) : null;

const AssignToClassesPage = () => {
  const navigate = useNavigate();
  const { assignmentId: assignmentIdParam } = useParams();

  const assignmentId = Number(assignmentIdParam);

  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [settings, setSettings] = useState({});
  const [openCards, setOpenCards] = useState({});
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [savingClassOverride, setSavingClassOverride] = useState({});
  const [baseSettings, setBaseSettings] = useState(defaultSettings());
  const [assignmentCategory, setAssignmentCategory] = useState("HOMEWORK");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2400);
  };

  useEffect(() => {
    let alive = true;

    const loadClasses = async () => {
      if (!Number.isFinite(assignmentId) || assignmentId <= 0) {
        setClasses([]);
        setLoadingClasses(false);
        return;
      }

      setLoadingClasses(true);
      try {
        const response =
          await assignmentApi.getAvailableClassroomsForAssignment(assignmentId);
        const normalized = (
          Array.isArray(response?.result) ? response.result : []
        )
          .map(normalizeClassroom)
          .filter(Boolean);
        const uniqueClassrooms = Array.from(
          new Map(normalized.map((item) => [item.id, item])).values(),
        );

        if (alive) {
          setClasses(uniqueClassrooms);
          setSelected(new Set());
          setSettings({});
          setOpenCards({});
        }
      } catch (error) {
        if (alive) {
          setClasses([]);
          setSelected(new Set());
          setSettings({});
          setOpenCards({});
          showToast(
            error?.response?.data?.message ||
              "Không thể tải danh sách lớp có thể giao bài.",
            "error",
          );
        }
      } finally {
        if (alive) setLoadingClasses(false);
      }
    };

    loadClasses();

    return () => {
      alive = false;
    };
  }, [assignmentId]);

  useEffect(() => {
    if (!Number.isFinite(assignmentId) || assignmentId <= 0) return;

    let alive = true;

    assignmentApi
      .getAssignment(assignmentId)
      .then((response) => {
        if (!alive) return;

        const setting = response?.result?.setting || {};
        const category = String(response?.result?.category || "HOMEWORK")
          .trim()
          .toUpperCase();
        const nextDefaults = {
          ...defaultSettings(),
          password: String(setting.password || ""),
          durationMinutes: Number(setting.durationMinutes || 45),
          startTime: toLocalDateTimeInput(setting.startTime),
          deadline: toLocalDateTimeInput(setting.deadline),
          allowLateSubmission: Boolean(setting.allowLateSubmission),
          shuffleQuestions: Boolean(setting.shuffleQuestions),
          resultVisibility: String(setting.resultVisibility || ""),
          resultReleaseTime: String(setting.resultReleaseTime || ""),
          limitTabs:
            setting.limitTabs === null || setting.limitTabs === undefined
              ? ""
              : String(setting.limitTabs),
          requireFullScreen: Boolean(setting.requireFullScreen),
          maxAttemptsType: setting.maxAttempts ? "LIMITED" : "UNLIMITED",
          maxAttempts: Number(setting.maxAttempts || 1),
        };

        setAssignmentCategory(category === "TEST" ? "TEST" : "HOMEWORK");
        setBaseSettings(nextDefaults);
      })
      .catch(() => {
        if (!alive) return;
        setAssignmentCategory("HOMEWORK");
        setBaseSettings(defaultSettings());
      });

    return () => {
      alive = false;
    };
  }, [assignmentId]);

  const toggleClass = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setSettings((s) => {
          const n = { ...s };
          delete n[id];
          return n;
        });
        setOpenCards((o) => {
          const n = { ...o };
          delete n[id];
          return n;
        });
        setVisiblePasswords((current) => {
          const nextVisibility = { ...current };
          delete nextVisibility[id];
          return nextVisibility;
        });
      } else {
        next.add(id);
        setSettings((s) => ({ ...s, [id]: { ...baseSettings } }));
        setOpenCards((o) => ({ ...o, [id]: true }));
        setVisiblePasswords((current) => ({ ...current, [id]: false }));
      }
      return next;
    });
  };

  const updateSetting = (classId, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [classId]: {
        ...(prev[classId] || { ...baseSettings }),
        [key]: value,
      },
    }));
  };

  const toggleCard = (id) => {
    setOpenCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const setPasswordVisibility = (classId, isVisible) => {
    setVisiblePasswords((prev) => ({ ...prev, [classId]: isVisible }));
  };

  const selectedArr = useMemo(() => Array.from(selected), [selected]);

  const isTestCategory = assignmentCategory === "TEST";
  const settingPanelTitle = isTestCategory
    ? "Thiết lập bài kiểm tra"
    : "Thiết lập bài tập";

  const totalStudents = useMemo(
    () =>
      selectedArr.reduce(
        (sum, id) => sum + (classes.find((c) => c.id === id)?.students || 0),
        0,
      ),
    [selectedArr, classes],
  );

  const handleAssign = async () => {
    if (!selectedArr.length || submitting) return;

    if (!Number.isFinite(assignmentId) || assignmentId <= 0) {
      showToast("AssignmentId không hợp lệ.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const response = await assignmentApi.assignToClassrooms(assignmentId, {
        classrooms: selectedArr.map((classroomId) => ({
          classroomId,
          settingOverride: toOverridePayload(
            settings[classroomId] || baseSettings,
            assignmentCategory,
          ),
        })),
      });

      const totalAssigned = Number(response?.result?.totalAssigned || 0);
      const totalSkipped = Number(response?.result?.totalSkipped || 0);

      if (totalSkipped > 0) {
        showToast(
          `Giao bài thành công (${totalAssigned} lớp mới, ${totalSkipped} lớp đã được giao trước đó).`,
        );
      } else {
        showToast("Giao bài cho lớp học thành công!");
      }

      setTimeout(() => {
        navigate(PATH_TEACHER.assignments);
      }, 400);
    } catch (error) {
      showToast(
        error?.response?.data?.message ||
          "Giao bài thất bại, vui lòng thử lại.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveClassSetting = async (classroomId) => {
    if (submitting || savingClassOverride[classroomId]) return;

    if (!Number.isFinite(assignmentId) || assignmentId <= 0) {
      showToast("AssignmentId không hợp lệ.", "error");
      return;
    }

    if (!Number.isFinite(classroomId) || classroomId <= 0) {
      showToast("ClassroomId không hợp lệ.", "error");
      return;
    }

    const classInfo = classes.find((item) => item.id === classroomId);
    const overridePayload = toOverridePayload(
      settings[classroomId] || baseSettings,
      assignmentCategory,
    );

    setSavingClassOverride((prev) => ({
      ...prev,
      [classroomId]: true,
    }));

    try {
      await assignmentApi.updateClassroomOverride(
        assignmentId,
        classroomId,
        overridePayload,
      );
      setOpenCards((prev) => ({ ...prev, [classroomId]: false }));
      showToast(`Đã cập nhật cài đặt lớp ${classInfo?.name || classroomId}.`);
    } catch (error) {
      showToast(
        error?.response?.data?.message ||
          `Không thể cập nhật cài đặt lớp ${classInfo?.name || classroomId}.`,
        "error",
      );
    } finally {
      setSavingClassOverride((prev) => {
        const next = { ...prev };
        delete next[classroomId];
        return next;
      });
    }
  };

  return (
    <>
      <style>{SETTINGS_PANEL_CSS}</style>
      <div
        style={{
          display: "flex",
          height: "100vh",
          overflow: "hidden",
          fontFamily: "'Be Vietnam Pro', 'Segoe UI', sans-serif",
          background: "#F7F8FC",
        }}
      >
        <div
          style={{
            width: 260,
            background: "#fff",
            borderRight: "1.5px solid #E2E8F0",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              padding: "16px 18px",
              background: "linear-gradient(135deg, #3B82F6, #2563EB)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                fontSize: 14,
                fontWeight: 700,
                color: "#fff",
              }}
            >
              <Ic.Users width={15} height={15} />
              Chọn lớp học
            </div>
            <div
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,.7)",
                marginTop: 3,
              }}
            >
              Tích chọn lớp để giao bài
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
            {loadingClasses ? (
              <div style={{ color: "#94A3B8", fontSize: 12, padding: 12 }}>
                Đang tải danh sách lớp...
              </div>
            ) : classes.length ? (
              classes.map((cls) => {
                const on = selected.has(cls.id);
                return (
                  <div
                    key={cls.id}
                    onClick={() => toggleClass(cls.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      padding: "8px 10px",
                      borderRadius: 8,
                      cursor: "pointer",
                      marginBottom: 2,
                      background: on ? "#EFF6FF" : "transparent",
                    }}
                  >
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 4,
                        border: `2px solid ${on ? "#2563EB" : "#CBD5E1"}`,
                        background: on ? "#2563EB" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {on && (
                        <Ic.Check
                          width={9}
                          height={9}
                          style={{ color: "#fff" }}
                        />
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#1E293B",
                        }}
                      >
                        Lớp {cls.name}
                      </div>
                      <div style={{ fontSize: 10, color: "#94A3B8" }}>
                        {cls.subject}
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 10,
                        background: "#EFF6FF",
                        color: "#1D4ED8",
                        flexShrink: 0,
                      }}
                    >
                      {cls.students}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ color: "#94A3B8", fontSize: 12, padding: 12 }}>
                Chưa có lớp học nào.
              </div>
            )}
          </div>

          <div
            style={{
              padding: "12px 14px",
              borderTop: "1.5px solid #F1F5F9",
              background: "#FAFBFD",
            }}
          >
            {selected.size > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                  padding: "6px 10px",
                  background: "#F0F9FF",
                  borderRadius: 8,
                  border: "1px solid #BAE6FD",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{ fontSize: 16, fontWeight: 800, color: "#0369A1" }}
                  >
                    {selected.size}
                  </div>
                  <div style={{ fontSize: 10, color: "#0369A1" }}>lớp</div>
                </div>
                <div style={{ width: 1, background: "#BAE6FD" }} />
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{ fontSize: 16, fontWeight: 800, color: "#0369A1" }}
                  >
                    {totalStudents}
                  </div>
                  <div style={{ fontSize: 10, color: "#0369A1" }}>học sinh</div>
                </div>
              </div>
            )}

            <button
              onClick={handleAssign}
              disabled={!selected.size || submitting}
              style={{
                width: "100%",
                padding: "10px 0",
                border: "none",
                borderRadius: 10,
                background:
                  selected.size && !submitting
                    ? "linear-gradient(135deg, #3B82F6, #2563EB)"
                    : "#E2E8F0",
                color: selected.size && !submitting ? "#fff" : "#94A3B8",
                fontSize: 13,
                fontWeight: 700,
                fontFamily: "inherit",
                cursor:
                  selected.size && !submitting ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
              }}
            >
              <Ic.Send width={13} height={13} />
              {submitting ? "Đang giao bài..." : "Giao bài"}
            </button>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: 54,
              background: "#fff",
              borderBottom: "1.5px solid #E2E8F0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 24px",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={() => navigate(-1)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 12px",
                  border: "1.5px solid #E2E8F0",
                  borderRadius: 8,
                  background: "none",
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  color: "#64748B",
                  cursor: "pointer",
                }}
              >
                <Ic.ArrowLeft width={13} height={13} />
                Quay lại
              </button>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#1E293B" }}>
                Giao bài cho lớp học
              </span>
            </div>

            <button
              onClick={handleAssign}
              disabled={!selected.size || submitting}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "7px 16px",
                border: "none",
                borderRadius: 8,
                background:
                  selected.size && !submitting
                    ? "linear-gradient(135deg, #3B82F6, #2563EB)"
                    : "#E2E8F0",
                color: selected.size && !submitting ? "#fff" : "#94A3B8",
                fontSize: 11,
                fontWeight: 700,
                fontFamily: "inherit",
                cursor:
                  selected.size && !submitting ? "pointer" : "not-allowed",
              }}
            >
              <Ic.Send width={12} height={12} />
              {submitting ? "Đang xử lý..." : "Giao bài"}
            </button>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "22px 28px 80px",
              background: "#F7F8FC",
            }}
          >
            {selected.size === 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "60%",
                  gap: 14,
                  opacity: 0.45,
                }}
              >
                <Ic.Users width={48} height={48} style={{ color: "#94A3B8" }} />
                <p style={{ fontSize: 14, color: "#94A3B8" }}>
                  Chọn lớp ở bên trái để giao bài
                </p>
              </div>
            ) : (
              selectedArr.map((id) => {
                const cls = classes.find((c) => c.id === id);
                if (!cls) return null;

                const hasTime = Boolean(
                  settings[id]?.startTime && settings[id]?.deadline,
                );

                return (
                  <div
                    key={id}
                    style={{
                      background: "#fff",
                      border: "1.5px solid #E2E8F0",
                      borderRadius: 14,
                      marginBottom: 12,
                      overflow: "hidden",
                      boxShadow: "0 1px 3px rgba(30,41,59,.04)",
                    }}
                  >
                    <div
                      onClick={() => toggleCard(id)}
                      style={{
                        padding: "12px 16px",
                        borderBottom: openCards[id]
                          ? "1px solid #F1F5F9"
                          : "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        background: "#FAFBFD",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 9,
                            background: "#EFF6FF",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: 800,
                            color: "#2563EB",
                            flexShrink: 0,
                          }}
                        >
                          {getInitials(cls.name)}
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "#1E293B",
                            }}
                          >
                            Lớp {cls.name}
                          </div>
                          <div style={{ fontSize: 11, color: "#94A3B8" }}>
                            {cls.subject} - {cls.students} học sinh
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: 20,
                            background: hasTime ? "#ECFDF5" : "#FFFBEB",
                            color: hasTime ? "#059669" : "#D97706",
                          }}
                        >
                          {hasTime ? "Đã cài đặt" : "Chưa đặt thời gian"}
                        </span>
                        <Ic.ChevDown
                          width={14}
                          height={14}
                          style={{
                            color: "#94A3B8",
                            transform: openCards[id]
                              ? "rotate(180deg)"
                              : "rotate(0deg)",
                            transition: "transform .2s",
                          }}
                        />
                      </div>
                    </div>

                    {openCards[id] && (
                      <div style={{ padding: "14px 16px 16px" }}>
                        <div className="assign-setting-panel">
                          <div className="assign-step-head">
                            <div className="assign-step-head-left">
                              <div className="assign-step-number">2</div>
                              <div className="assign-step-label">
                                {settingPanelTitle}
                              </div>
                            </div>

                            <button
                              type="button"
                              className="assign-save-btn"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleSaveClassSetting(id);
                              }}
                              disabled={
                                submitting || Boolean(savingClassOverride[id])
                              }
                            >
                              <Ic.Check width={12} height={12} />
                              {savingClassOverride[id] ? "Đang lưu..." : "Xong"}
                            </button>
                          </div>

                          <div className="assign-setting-grid">
                            <div className="assign-form-group">
                              <label className="assign-label">Mật khẩu</label>
                              <div className="assign-input-wrap">
                                <input
                                  className="assign-input"
                                  type={
                                    visiblePasswords[id] ? "text" : "password"
                                  }
                                  value={settings[id]?.password || ""}
                                  onChange={(event) =>
                                    updateSetting(
                                      id,
                                      "password",
                                      event.target.value,
                                    )
                                  }
                                  placeholder="Để trống nếu không dùng"
                                />
                                <button
                                  type="button"
                                  className="assign-input-eye"
                                  aria-label={
                                    visiblePasswords[id]
                                      ? "Ẩn mật khẩu"
                                      : "Hiển thị mật khẩu"
                                  }
                                  onPointerDown={(event) => {
                                    event.preventDefault();
                                    setPasswordVisibility(id, true);
                                  }}
                                  onPointerUp={() =>
                                    setPasswordVisibility(id, false)
                                  }
                                  onPointerLeave={() =>
                                    setPasswordVisibility(id, false)
                                  }
                                  onPointerCancel={() =>
                                    setPasswordVisibility(id, false)
                                  }
                                  onKeyDown={(event) => {
                                    if (
                                      event.key === " " ||
                                      event.key === "Enter"
                                    ) {
                                      event.preventDefault();
                                      setPasswordVisibility(id, true);
                                    }
                                  }}
                                  onKeyUp={(event) => {
                                    if (
                                      event.key === " " ||
                                      event.key === "Enter"
                                    ) {
                                      event.preventDefault();
                                      setPasswordVisibility(id, false);
                                    }
                                  }}
                                >
                                  {visiblePasswords[id] ? (
                                    <EyeOff size={16} />
                                  ) : (
                                    <Eye size={16} />
                                  )}
                                </button>
                              </div>
                            </div>

                            <div className="assign-form-group">
                              <label className="assign-label">
                                Thời lượng (phút)
                              </label>
                              <input
                                className="assign-input"
                                type="number"
                                min={1}
                                value={settings[id]?.durationMinutes ?? ""}
                                onChange={(event) =>
                                  updateSetting(
                                    id,
                                    "durationMinutes",
                                    event.target.value,
                                  )
                                }
                              />
                            </div>

                            <div className="assign-form-group">
                              <label className="assign-label">Bắt đầu</label>
                              <input
                                className="assign-input"
                                type="datetime-local"
                                value={settings[id]?.startTime || ""}
                                onChange={(event) =>
                                  updateSetting(
                                    id,
                                    "startTime",
                                    event.target.value,
                                  )
                                }
                              />
                            </div>

                            <div className="assign-form-group">
                              <label className="assign-label">Hạn nộp</label>
                              <input
                                className="assign-input"
                                type="datetime-local"
                                value={settings[id]?.deadline || ""}
                                onChange={(event) =>
                                  updateSetting(
                                    id,
                                    "deadline",
                                    event.target.value,
                                  )
                                }
                              />
                            </div>

                            <div className="assign-form-group">
                              <label className="assign-label">
                                Hiển thị kết quả
                              </label>
                              <select
                                className="assign-select"
                                value={settings[id]?.resultVisibility || ""}
                                onChange={(event) =>
                                  updateSetting(
                                    id,
                                    "resultVisibility",
                                    event.target.value,
                                  )
                                }
                              >
                                {RESULT_VISIBILITY_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="assign-form-group">
                              <label className="assign-label">
                                Thời điểm công bố điểm
                              </label>
                              <select
                                className="assign-select"
                                value={settings[id]?.resultReleaseTime || ""}
                                onChange={(event) =>
                                  updateSetting(
                                    id,
                                    "resultReleaseTime",
                                    event.target.value,
                                  )
                                }
                              >
                                {RESULT_RELEASE_TIME_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="assign-toggle-item">
                              <label className="assign-label">
                                Cho phép nộp muộn
                              </label>
                              <div className="assign-pill-group">
                                <button
                                  type="button"
                                  className={`assign-pill${settings[id]?.allowLateSubmission ? " active" : ""}`}
                                  onClick={() =>
                                    updateSetting(
                                      id,
                                      "allowLateSubmission",
                                      true,
                                    )
                                  }
                                >
                                  Bật
                                </button>
                                <button
                                  type="button"
                                  className={`assign-pill${!settings[id]?.allowLateSubmission ? " active" : ""}`}
                                  onClick={() =>
                                    updateSetting(
                                      id,
                                      "allowLateSubmission",
                                      false,
                                    )
                                  }
                                >
                                  Tắt
                                </button>
                              </div>
                            </div>

                            <div className="assign-toggle-item">
                              <label className="assign-label">
                                Trộn câu hỏi
                              </label>
                              <div className="assign-pill-group">
                                <button
                                  type="button"
                                  className={`assign-pill${settings[id]?.shuffleQuestions ? " active" : ""}`}
                                  onClick={() =>
                                    updateSetting(
                                      id,
                                      "shuffleQuestions",
                                      true,
                                    )
                                  }
                                >
                                  Bật
                                </button>
                                <button
                                  type="button"
                                  className={`assign-pill${!settings[id]?.shuffleQuestions ? " active" : ""}`}
                                  onClick={() =>
                                    updateSetting(
                                      id,
                                      "shuffleQuestions",
                                      false,
                                    )
                                  }
                                >
                                  Tắt
                                </button>
                              </div>
                            </div>

                            {!isTestCategory && (
                              <div className="assign-toggle-item assign-full-width">
                                <label className="assign-label">
                                  Số lần làm bài tối đa
                                </label>
                                <div style={{ display: "flex", gap: 8 }}>
                                  <div
                                    className="assign-pill-group"
                                    style={{ flex: 1 }}
                                  >
                                    <button
                                      type="button"
                                      className={`assign-pill${settings[id]?.maxAttemptsType === "UNLIMITED" ? " active" : ""}`}
                                      onClick={() =>
                                        updateSetting(
                                          id,
                                          "maxAttemptsType",
                                          "UNLIMITED",
                                        )
                                      }
                                    >
                                      Vô hạn
                                    </button>
                                    <button
                                      type="button"
                                      className={`assign-pill${settings[id]?.maxAttemptsType === "LIMITED" ? " active" : ""}`}
                                      onClick={() =>
                                        updateSetting(
                                          id,
                                          "maxAttemptsType",
                                          "LIMITED",
                                        )
                                      }
                                    >
                                      Giới hạn
                                    </button>
                                  </div>
                                  {settings[id]?.maxAttemptsType ===
                                    "LIMITED" && (
                                    <div
                                      style={{
                                        position: "relative",
                                        width: 120, // Tăng width một chút cho cân đối khi ở hàng ngang dài
                                      }}
                                    >
                                      <input
                                        className="assign-input"
                                        type="number"
                                        min={1}
                                        value={settings[id]?.maxAttempts ?? ""}
                                        onChange={(event) =>
                                          updateSetting(
                                            id,
                                            "maxAttempts",
                                            event.target.value,
                                          )
                                        }
                                        style={{
                                          paddingRight: 32,
                                          textAlign: "center",
                                        }}
                                      />
                                      <span
                                        style={{
                                          position: "absolute",
                                          right: 8,
                                          top: "50%",
                                          transform: "translateY(-50%)",
                                          fontSize: 11,
                                          color: "#64748B",
                                          fontWeight: 600,
                                        }}
                                      >
                                        lần
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {isTestCategory ? (
                            <div className="assign-setting-checks">
                              <div className="assign-toggle-item">
                                <label className="assign-label">
                                  Giới hạn chuyển tab
                                </label>
                                <input
                                  className="assign-input"
                                  type="number"
                                  min={0}
                                  value={settings[id]?.limitTabs ?? ""}
                                  onChange={(event) =>
                                    updateSetting(
                                      id,
                                      "limitTabs",
                                      event.target.value,
                                    )
                                  }
                                  placeholder="Để trống nếu không giới hạn"
                                />
                              </div>

                              <div className="assign-toggle-item">
                                <label className="assign-label">
                                  Yêu cầu toàn màn hình
                                </label>
                                <div className="assign-pill-group">
                                  <button
                                    type="button"
                                    className={`assign-pill${settings[id]?.requireFullScreen ? " active" : ""}`}
                                    onClick={() =>
                                      updateSetting(
                                        id,
                                        "requireFullScreen",
                                        true,
                                      )
                                    }
                                  >
                                    Bật
                                  </button>
                                  <button
                                    type="button"
                                    className={`assign-pill${!settings[id]?.requireFullScreen ? " active" : ""}`}
                                    onClick={() =>
                                      updateSetting(
                                        id,
                                        "requireFullScreen",
                                        false,
                                      )
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
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <Toast message={toast?.msg} type={toast?.type} />
    </>
  );
};

export default AssignToClassesPage;
