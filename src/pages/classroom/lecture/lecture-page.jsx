import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Loader2, Users, Video } from "lucide-react";
import ClassroomDetailLayout from "@/components/ClassroomDetailLayout";
import { useAuth } from "@/contexts/AuthContext";
import { attendanceApi } from "@/apis/attendance.api";
import useSchedule from "@/hooks/useSchedule";
import scheduleApi from "@/apis/schedule.api";
import { PATH_STUDENT, PATH_TEACHER } from "@/routes/paths";
import envConfig from "@/schema/config.schema";
import { SESSION_TYPE } from "@/schema/scheduleSchema";
import "@/assets/css/pages/classroom/classroomLecture.css";

const DEFAULT_JITSI_DOMAIN = "meet.jit.si";

const parseSessionDate = (dateStr) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const toSessionDateTime = (sessionDate, timeStr) => {
  if (!sessionDate || !timeStr) return null;
  const date = parseSessionDate(sessionDate);
  if (!date) return null;

  const [hours = 0, minutes = 0, seconds = 0] = timeStr.split(":").map(Number);
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    Number.isNaN(hours) ? 0 : hours,
    Number.isNaN(minutes) ? 0 : minutes,
    Number.isNaN(seconds) ? 0 : seconds,
    0,
  );
};

const parseJitsiMeetingMeta = (meetingLink) => {
  if (!meetingLink) return null;

  try {
    const url = new URL(meetingLink);
    const segments = url.pathname.split("/").filter(Boolean);
    const jwt = url.searchParams.get("jwt") || null;

    if (!segments.length) return null;

    if (url.hostname === "8x8.vc" && segments.length >= 2) {
      const appId = segments[0];
      const roomOnly = segments.slice(1).join("/");
      return {
        domain: "8x8.vc",
        appId,
        roomName: `${appId}/${roomOnly}`,
        jwt,
      };
    }

    const roomOnly = decodeURIComponent(segments[segments.length - 1]);
    return {
      domain: url.hostname || DEFAULT_JITSI_DOMAIN,
      appId: null,
      roomName: roomOnly,
      jwt,
    };
  } catch {
    return null;
  }
};

const getCurrentUserRole = (role) => role || "ROLE_STUDENT";

const normalizeRoleForToken = (role) => {
  if (!role) return "STUDENT";
  return role.startsWith("ROLE_") ? role.replace("ROLE_", "") : role;
};

const getDisplayDateTime = (session) => {
  const sessionDate = parseSessionDate(session?.sessionDate);
  if (!sessionDate) return "N/A";

  const dateText = sessionDate.toLocaleDateString("vi-VN");
  const timeText = session?.startTime ? session.startTime.slice(0, 5) : "--:--";
  return `${timeText} - ${dateText}`;
};

const getJitsiScriptUrl = ({ domain, appId }) => {
  if (domain === "8x8.vc" && appId) {
    return `https://8x8.vc/${appId}/external_api.js`;
  }
  return `https://${domain}/external_api.js`;
};

const isTeacherRole = (role) => normalizeRoleForToken(role) === "TEACHER";

const loadJitsiApiScript = (src) => {
  const loadedSrc = window.__learnifyJitsiApiSrc;
  if (window.JitsiMeetExternalAPI && loadedSrc === src) {
    return Promise.resolve();
  }

  // If a different provider script was loaded before, reset and load the correct one.
  if (window.JitsiMeetExternalAPI && loadedSrc && loadedSrc !== src) {
    try {
      delete window.JitsiMeetExternalAPI;
    } catch {
      window.JitsiMeetExternalAPI = undefined;
    }

    document
      .querySelectorAll("script[data-jitsi-src]")
      .forEach((el) => el.parentNode?.removeChild(el));
  }

  const existingScript = document.querySelector(`script[data-jitsi-src=\"${src}\"]`);
  if (existingScript?.dataset.loaded === "true") {
    window.__learnifyJitsiApiSrc = src;
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = existingScript || document.createElement("script");

    if (!existingScript) {
      script.src = src;
      script.async = true;
      script.dataset.jitsiSrc = src;
      document.body.appendChild(script);
    }

    script.onload = () => {
      script.dataset.loaded = "true";
      window.__learnifyJitsiApiSrc = src;
      resolve();
    };
    script.onerror = () => reject(new Error("Không thể tải Jitsi External API."));
  });
};

const ClassroomLecturePage = () => {
  const { id: classroomId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { sessions, loading, error } = useSchedule(classroomId);

  const containerRef = useRef(null);
  const jitsiApiRef = useRef(null);
  const autoStopRecordingTimerRef = useRef(null);
  const autoRecordingStartedRef = useRef(false);
  const autoAttendanceMarkedRef = useRef(false);

  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [joinConfig, setJoinConfig] = useState(null);
  const [embedLoading, setEmbedLoading] = useState(false);
  const [embedError, setEmbedError] = useState("");
  const [participantCount, setParticipantCount] = useState(0);

  const sessionIdFromQuery = Number(searchParams.get("sessionId"));

  const onlineSessions = useMemo(
    () =>
      sessions
        .filter((s) => s.type === SESSION_TYPE.ONLINE && s.meetingLink)
        .sort((a, b) => {
          const aDate = toSessionDateTime(a.sessionDate, a.startTime)?.getTime() || 0;
          const bDate = toSessionDateTime(b.sessionDate, b.startTime)?.getTime() || 0;
          return aDate - bDate;
        }),
    [sessions],
  );

  useEffect(() => {
    if (!onlineSessions.length) {
      setSelectedSessionId(null);
      return;
    }

    if (sessionIdFromQuery && onlineSessions.some((s) => s.id === sessionIdFromQuery)) {
      setSelectedSessionId(sessionIdFromQuery);
      return;
    }

    if (selectedSessionId && onlineSessions.some((s) => s.id === selectedSessionId)) {
      return;
    }

    const now = Date.now();
    const currentSession = onlineSessions.find((s) => {
      const start = toSessionDateTime(s.sessionDate, s.startTime)?.getTime();
      const end = toSessionDateTime(s.sessionDate, s.endTime)?.getTime();
      return start && end && now >= start && now <= end;
    });

    const nextSession = onlineSessions.find((s) => {
      const start = toSessionDateTime(s.sessionDate, s.startTime)?.getTime();
      return start && start > now;
    });

    setSelectedSessionId(currentSession?.id || nextSession?.id || onlineSessions[0].id);
  }, [onlineSessions, selectedSessionId, sessionIdFromQuery]);

  const selectedSession = useMemo(
    () => onlineSessions.find((s) => s.id === selectedSessionId) || null,
    [onlineSessions, selectedSessionId],
  );

  const schedulePath = useMemo(() => {
    if (isTeacherRole(user?.role)) {
      return PATH_TEACHER.classroom.schedule(classroomId);
    }
    return PATH_STUDENT.schedule;
  }, [classroomId, user?.role]);

  const selectedSessionEndTimeMs = useMemo(() => {
    if (!selectedSession) return null;
    return toSessionDateTime(selectedSession.sessionDate, selectedSession.endTime)?.getTime() || null;
  }, [selectedSession]);

  useEffect(() => {
    setParticipantCount(0);
    autoRecordingStartedRef.current = false;
    autoAttendanceMarkedRef.current = false;
    if (autoStopRecordingTimerRef.current) {
      clearTimeout(autoStopRecordingTimerRef.current);
      autoStopRecordingTimerRef.current = null;
    }
  }, [selectedSession?.id]);

  useEffect(() => {
    let ignore = false;

    const buildJoinConfig = async () => {
      if (!selectedSession?.meetingLink) {
        setJoinConfig(null);
        return;
      }

      setEmbedLoading(true);
      setEmbedError("");

      try {
        const initialMeta = parseJitsiMeetingMeta(selectedSession.meetingLink);
        if (!initialMeta?.roomName) {
          throw new Error("Không thể đọc thông tin phòng họp từ meetingLink.");
        }

        const response = await scheduleApi.generateJitsiMeetingLink({
          roomName: initialMeta.roomName,
          role: normalizeRoleForToken(getCurrentUserRole(user?.role)),
        });

        const generatedLink = response?.result?.meetingLink || selectedSession.meetingLink;
        const generatedMeta = parseJitsiMeetingMeta(generatedLink) || initialMeta;
        // Keep roomName exactly in sync with generated meetingLink to avoid JWT/room mismatch.
        const finalRoomName = generatedMeta.roomName || initialMeta.roomName;
        const tokenFromLink = (() => {
          try {
            const url = new URL(generatedLink);
            return url.searchParams.get("jwt") || null;
          } catch {
            return null;
          }
        })();

        const appId = generatedMeta.appId || envConfig.VITE_JITSI_APP_ID || initialMeta.appId || null;
        const domain = generatedMeta.domain || envConfig.VITE_JITSI_DOMAIN || DEFAULT_JITSI_DOMAIN;

        if (!ignore) {
          setJoinConfig({
            domain,
            appId,
            roomName: finalRoomName,
            jwt: response?.result?.token || tokenFromLink || generatedMeta.jwt || initialMeta.jwt || null,
          });
        }
      } catch (err) {
        if (!ignore) {
          const message = err.response?.data?.message || err.message || "Không thể khởi tạo phòng học trực tuyến.";
          setEmbedError(message);
          setJoinConfig(null);
        }
      } finally {
        if (!ignore) {
          setEmbedLoading(false);
        }
      }
    };

    buildJoinConfig();

    return () => {
      ignore = true;
    };
  }, [selectedSession, user?.role]);

  useEffect(() => {
    if (!joinConfig || !containerRef.current) return undefined;

    let disposed = false;
    let cleanupListeners = () => { };

    const clearAutoStopTimer = () => {
      if (autoStopRecordingTimerRef.current) {
        clearTimeout(autoStopRecordingTimerRef.current);
        autoStopRecordingTimerRef.current = null;
      }
    };

    const stopRecordingIfNeeded = (jitsiApi) => {
      if (!isTeacherRole(user?.role) || !autoRecordingStartedRef.current) return;
      try {
        jitsiApi.executeCommand("stopRecording", "file");
      } catch {
        // Ignore provider-specific recording stop errors.
      }

      autoRecordingStartedRef.current = false;
    };

    const scheduleAutoStopRecording = (jitsiApi) => {
      if (!isTeacherRole(user?.role) || !selectedSessionEndTimeMs || !selectedSession?.allowRecording) return;

      clearAutoStopTimer();

      const delay = selectedSessionEndTimeMs - Date.now();
      if (delay <= 0) {
        stopRecordingIfNeeded(jitsiApi);
        return;
      }

      autoStopRecordingTimerRef.current = setTimeout(() => {
        if (jitsiApiRef.current !== jitsiApi) return;
        stopRecordingIfNeeded(jitsiApi);
      }, delay);
    };

    const startRecordingIfTeacher = (jitsiApi) => {
      if (!isTeacherRole(user?.role) || autoRecordingStartedRef.current) return;
      if (!selectedSession?.allowRecording) return;

      try {
        jitsiApi.executeCommand("startRecording", {
          mode: "file",
          shouldShare: false,
        });

        autoRecordingStartedRef.current = true;
      } catch {
        // Ignore provider-specific recording start errors.
      }
    };

    const mountJitsi = async () => {
      try {
        setEmbedError("");
        const scriptUrl = getJitsiScriptUrl(joinConfig);
        await loadJitsiApiScript(scriptUrl);

        if (disposed || !containerRef.current || !window.JitsiMeetExternalAPI) return;

        containerRef.current.innerHTML = "";
        if (jitsiApiRef.current) {
          jitsiApiRef.current.dispose();
          jitsiApiRef.current = null;
        }

        const options = {
          roomName: joinConfig.roomName,
          parentNode: containerRef.current,
          userInfo: {
            displayName: user?.fullName || user?.username || "Người dùng",
            email: user?.email || "",
          },
          configOverwrite: {
            prejoinPageEnabled: false,
            startWithAudioMuted: true,
          },
        };

        if (joinConfig.jwt) {
          options.jwt = joinConfig.jwt;
        }

        const jitsiApi = new window.JitsiMeetExternalAPI(joinConfig.domain, options);
        jitsiApiRef.current = jitsiApi;

        const syncParticipantCount = () => {
          try {
            if (typeof jitsiApi.getNumberOfParticipants !== "function") return;
            const count = jitsiApi.getNumberOfParticipants();
            if (typeof count === "number" && Number.isFinite(count)) {
              setParticipantCount(Math.max(0, count));
            }
          } catch {
            // Ignore participant count sync errors from provider.
          }
        };

        const handleConferenceJoined = () => {
          setParticipantCount((prev) => (prev > 0 ? prev : 1));
          syncParticipantCount();
          startRecordingIfTeacher(jitsiApi);
          scheduleAutoStopRecording(jitsiApi);

          if (!isTeacherRole(user?.role) && selectedSession?.id && !autoAttendanceMarkedRef.current) {
            autoAttendanceMarkedRef.current = true;

            attendanceApi.autoMarkAttendance(selectedSession.id).catch((err) => {
              autoAttendanceMarkedRef.current = false;
              console.warn("Không thể auto mark attendance.", err?.response?.data?.message || err);
            });
          }
        };
        const handleParticipantJoined = () => {
          setParticipantCount((prev) => prev + 1);
          syncParticipantCount();
        };
        const handleParticipantLeft = () => {
          setParticipantCount((prev) => Math.max(0, prev - 1));
          syncParticipantCount();
        };
        const handleConferenceLeft = () => {
          clearAutoStopTimer();
          autoRecordingStartedRef.current = false;
          navigate(schedulePath, { replace: true });
        };
        const handleReadyToClose = () => {
          clearAutoStopTimer();
          autoRecordingStartedRef.current = false;
          navigate(schedulePath, { replace: true });
        };

        jitsiApi.addListener("videoConferenceJoined", handleConferenceJoined);
        jitsiApi.addListener("participantJoined", handleParticipantJoined);
        jitsiApi.addListener("participantLeft", handleParticipantLeft);
        jitsiApi.addListener("videoConferenceLeft", handleConferenceLeft);
        jitsiApi.addListener("readyToClose", handleReadyToClose);

        cleanupListeners = () => {
          jitsiApi.removeListener("videoConferenceJoined", handleConferenceJoined);
          jitsiApi.removeListener("participantJoined", handleParticipantJoined);
          jitsiApi.removeListener("participantLeft", handleParticipantLeft);
          jitsiApi.removeListener("videoConferenceLeft", handleConferenceLeft);
          jitsiApi.removeListener("readyToClose", handleReadyToClose);
        };
      } catch (err) {
        setEmbedError(err.message || "Không thể nhúng Jitsi vào hệ thống.");
      }
    };

    mountJitsi();

    return () => {
      disposed = true;
      cleanupListeners();
      if (autoStopRecordingTimerRef.current) {
        clearTimeout(autoStopRecordingTimerRef.current);
        autoStopRecordingTimerRef.current = null;
      }
      autoRecordingStartedRef.current = false;
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
    };
  }, [joinConfig, navigate, schedulePath, selectedSessionEndTimeMs, user?.email, user?.fullName, user?.role, user?.username]);

  return (
    <ClassroomDetailLayout>
      <div className="classroom-lecture-page">
        <div className="lecture-header">
          <h1>Phòng học trực tuyến</h1>
        </div>

        {loading && (
          <div className="lecture-state">
            <Loader2 className="spin" size={20} /> Đang tải thông tin buổi học...
          </div>
        )}

        {!loading && error && <div className="lecture-state lecture-state-error">{error}</div>}

        {!loading && !error && onlineSessions.length === 0 && (
          <div className="lecture-state">
            <Video size={18} /> Chưa có buổi học trực tuyến nào có link họp.
          </div>
        )}

        {!loading && !error && onlineSessions.length > 0 && selectedSession && (
          <>
            <div className="lecture-session-summary">
              <div className="lecture-session-title">
                <span>Buổi học:</span>
                <strong>{selectedSession.title}</strong>
              </div>
              <p className="lecture-session-description">
                {selectedSession.description?.trim() || "Chưa có mô tả cho buổi học này."}
              </p>
            </div>

            <div className="lecture-meta-grid">
              <div className="lecture-meta-item">
                <span className="meta-label">Số người tham gia</span>
                <span className="meta-value meta-value-with-icon"><Users size={18} /> {participantCount}</span>
              </div>
              <div className="lecture-meta-item">
                <span className="meta-label">Người chủ trì</span>
                <span className="meta-value">{user?.fullName || user?.username || "N/A"}</span>
              </div>
              <div className="lecture-meta-item">
                <span className="meta-label">Thời gian bắt đầu</span>
                <span className="meta-value">{getDisplayDateTime(selectedSession)}</span>
              </div>
            </div>

            {embedLoading && (
              <div className="lecture-state">
                <Loader2 className="spin" size={20} /> Đang khởi tạo Jitsi...
              </div>
            )}

            {embedError && <div className="lecture-state lecture-state-error">{embedError}</div>}

            <div className="jitsi-frame-wrap">
              <div ref={containerRef} className="jitsi-frame" />
            </div>
          </>
        )}
      </div>
    </ClassroomDetailLayout>
  );
};

export default ClassroomLecturePage;
