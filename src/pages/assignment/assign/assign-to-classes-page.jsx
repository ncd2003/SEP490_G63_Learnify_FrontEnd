import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { assignmentApi } from "@/apis/assignment.api";
import { classroomApi } from "@/apis/classroom.api";
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
});

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
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2400);
  };

  useEffect(() => {
    let alive = true;

    const loadClasses = async () => {
      setLoadingClasses(true);
      try {
        const resp = await classroomApi.getClassroomsByTeacher();
        const source = Array.isArray(resp?.data?.result)
          ? resp.data.result
          : Array.isArray(resp?.result)
            ? resp.result
            : [];

        const normalized = source.map(normalizeClassroom).filter(Boolean);

        if (alive) {
          setClasses(normalized);
        }
      } catch (error) {
        if (alive) {
          setClasses([]);
          showToast(
            error?.response?.data?.message ||
              "Không thể tải danh sách lớp học.",
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
  }, []);

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
      } else {
        next.add(id);
        setSettings((s) => ({ ...s, [id]: defaultSettings() }));
        setOpenCards((o) => ({ ...o, [id]: true }));
      }
      return next;
    });
  };

  const toggleCard = (id) => {
    setOpenCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedArr = useMemo(() => Array.from(selected), [selected]);

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
      await assignmentApi.publishAssignment(assignmentId, selectedArr);
      showToast("Giao bài thành công!");
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

  return (
    <>
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
                      <div
                        style={{
                          padding: "12px 16px",
                          color: "#64748B",
                          fontSize: 12,
                        }}
                      >
                        Cài đặt chi tiết cho từng lớp sẽ được kết nối API ở bước
                        tiếp theo.
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
