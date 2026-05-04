import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Download, Search, Video, X } from "lucide-react";
import { toast } from "sonner";
import ClassroomDetailLayout from "@/components/ClassroomDetailLayout";
import { useAuth } from "@/contexts/AuthContext";
import useSchedule from "@/hooks/useSchedule";
import { SESSION_TYPE } from "@/schema/scheduleSchema";
import "@/assets/css/pages/classroom/classroomRecording.css";

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatTimeRange = (session) => {
  if (!session?.startTime || !session?.endTime) return "-";
  return `${session.startTime.slice(0, 5)} - ${session.endTime.slice(0, 5)}`;
};

const getFileSize = async (url) => {
  if (!url) return null;
  try {
    const response = await fetch(url, { method: "HEAD" });
    if (!response.ok) return null;
    const size = response.headers.get("content-length");
    return size ? parseInt(size, 10) : null;
  } catch (error) {
    // If HEAD fails, try a GET with a range header to minimize data but check availability
    // Or just return null for now as HEAD is the standard way
    return null;
  }
};

const formatFileSize = (bytes) => {
  if (bytes === null || bytes === undefined || isNaN(bytes)) return "-";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};


const endsWithAny = (value, suffixes) =>
  suffixes.some((suffix) => value.endsWith(suffix));

const handleDownload = async (url, title) => {
  if (!url) return;

  const toastId = toast.loading("Đang chuẩn bị tải xuống...");

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Không thể tải file");

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;

    // Try to get file extension from the URL
    let extension = "mp4";
    try {
      const urlPath = new URL(url).pathname;
      const parts = urlPath.split(".");
      if (parts.length > 1) {
        extension = parts.pop();
      }
    } catch (e) {
      console.error("Error parsing URL extension:", e);
    }

    const fileName = `${title || "recording"}.${extension}`;

    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);

    toast.success("Bắt đầu tải xuống: " + fileName, { id: toastId });
  } catch (error) {
    console.error("Download failed:", error);
    toast.error("Không thể tải trực tiếp. Đang mở tệp trong tab mới...", {
      id: toastId,
    });
    // Fallback: Open in new tab
    window.open(url, "_blank");
  }
};

const resolveRecordingPreviewType = (url) => {
  const normalizedUrl = String(url ?? "").trim().toLowerCase();

  if (!normalizedUrl) return "other";

  if (
    endsWithAny(normalizedUrl, [
      ".png",
      ".jpg",
      ".jpeg",
      ".gif",
      ".webp",
      ".svg",
      ".bmp",
    ])
  ) {
    return "image";
  }

  if (endsWithAny(normalizedUrl, [".mp4", ".mov", ".avi", ".mkv", ".webm", ".m3u8", ".ogg"])) {
    return "video";
  }

  if (normalizedUrl.includes(".pdf")) {
    return "pdf";
  }

  if (
    endsWithAny(normalizedUrl, [
      ".txt",
      ".md",
      ".csv",
      ".json",
      ".xml",
      ".html",
      ".htm",
    ])
  ) {
    return "text";
  }

  return "iframe";
};

const ClassroomRecordingPage = () => {
  const { id: classroomId } = useParams();
  const { user } = useAuth();
  const { sessions, loading, error } = useSchedule(Number(classroomId));

  const [titleKeyword, setTitleKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedRecordingId, setSelectedRecordingId] = useState(null);
  const [fileSizes, setFileSizes] = useState({});

  const recordingSessions = useMemo(() => {
    return sessions.filter((session) => Boolean(session.recordingLink));
  }, [sessions]);

  useEffect(() => {
    const fetchAllSizes = async () => {
      const sessionsToFetch = recordingSessions.filter(
        (s) => s.recordingLink && fileSizes[s.id] === undefined
      );

      if (sessionsToFetch.length === 0) return;

      // Mark as being fetched (null) to avoid duplicate requests
      setFileSizes((prev) => {
        const initial = { ...prev };
        sessionsToFetch.forEach((s) => {
          if (initial[s.id] === undefined) initial[s.id] = null;
        });
        return initial;
      });

      const results = await Promise.all(
        sessionsToFetch.map(async (session) => {
          const size = await getFileSize(session.recordingLink);
          return { id: session.id, size };
        }),
      );

      setFileSizes((prev) => {
        const updated = { ...prev };
        results.forEach((res) => {
          updated[res.id] = res.size;
        });
        return updated;
      });
    };

    if (recordingSessions.length > 0) {
      fetchAllSizes();
    }
  }, [recordingSessions, fileSizes]);

  const filteredSessions = useMemo(() => {
    const keyword = titleKeyword.trim().toLowerCase();

    return recordingSessions.filter((session) => {
      const title = (session.title || "").toLowerCase();
      const matchTitle = !keyword || title.includes(keyword);

      const matchType =
        typeFilter === "ALL" || session.type === typeFilter;

      const matchStartDate =
        !startDate || (session.sessionDate && session.sessionDate >= startDate);
      const matchEndDate =
        !endDate || (session.sessionDate && session.sessionDate <= endDate);

      return matchTitle && matchType && matchStartDate && matchEndDate;
    });
  }, [recordingSessions, titleKeyword, typeFilter, startDate, endDate]);

  useEffect(() => {
    if (!filteredSessions.length) {
      setSelectedRecordingId(null);
      return;
    }

    const selectedStillExists = filteredSessions.some(
      (session) => session.id === selectedRecordingId,
    );

    if (!selectedStillExists) {
      setSelectedRecordingId(null);
    }
  }, [filteredSessions, selectedRecordingId]);

  const selectedRecording = useMemo(() => {
    if (!filteredSessions.length || !selectedRecordingId) return null;
    return (
      filteredSessions.find((session) => session.id === selectedRecordingId) ||
      null
    );
  }, [filteredSessions, selectedRecordingId]);

  const selectedPreviewType = useMemo(
    () => resolveRecordingPreviewType(selectedRecording?.recordingLink),
    [selectedRecording],
  );

  const handleReset = () => {
    setTitleKeyword("");
    setTypeFilter("ALL");
    setStartDate("");
    setEndDate("");
  };

  return (
    <ClassroomDetailLayout>
      <div className="classroom-recording-page">
        <div className="recording-header">
          <div>
            <h1>Quản lý Recording</h1>
            <p>Danh sách tất cả bản ghi của lớp học hiện tại.</p>
          </div>
        </div>

        <section className="recording-filters">
          <div className="recording-filter-row">
            <div className="recording-filter-field">
              <label htmlFor="recording-title">Tên recording</label>
              <div className="recording-input-wrap">
                <Search size={16} />
                <input
                  id="recording-title"
                  value={titleKeyword}
                  onChange={(event) => setTitleKeyword(event.target.value)}
                  placeholder="Tìm theo tiêu đề recording"
                />
                {titleKeyword && (
                  <button
                    type="button"
                    className="recording-clear"
                    onClick={() => setTitleKeyword("")}
                    aria-label="Xóa tìm kiếm"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="recording-filter-field">
              <label htmlFor="recording-type">Loại buổi học</label>
              <select
                id="recording-type"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
              >
                <option value="ALL">Tất cả</option>
                <option value={SESSION_TYPE.ONLINE}>Trực tuyến</option>
                <option value={SESSION_TYPE.OFFLINE}>Trực tiếp</option>
              </select>
            </div>

            <div className="recording-filter-field">
              <label htmlFor="recording-start">Từ ngày ghi</label>
              <input
                id="recording-start"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>

            <div className="recording-filter-field">
              <label htmlFor="recording-end">Đến ngày ghi</label>
              <input
                id="recording-end"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          </div>

          <div className="recording-filter-actions">
            <button type="button" className="recording-btn" onClick={handleReset}>
              Đặt lại
            </button>
          </div>
        </section>

        {loading && (
          <div className="recording-state">Đang tải danh sách recording...</div>
        )}

        {!loading && error && (
          <div className="recording-error">{error}</div>
        )}

        {!loading && !error && recordingSessions.length === 0 && (
          <div className="recording-empty">Chưa có bản ghi nào cho lớp học này.</div>
        )}

        {!loading && !error && recordingSessions.length > 0 && (
          <div className="recording-table-wrapper">
            <div className="recording-table-header">
              <h2>Danh sách recording</h2>
              <span>{filteredSessions.length} bản ghi</span>
            </div>

            {selectedRecording ? (
              <div className="recording-preview-panel">
                <div className="recording-preview-head">
                  <h3>{selectedRecording.title || "Buổi học"}</h3>
                  <span>{formatDate(selectedRecording.sessionDate)} - {formatTimeRange(selectedRecording)}</span>
                </div>
                <div className="recording-preview-body">
                  {selectedPreviewType === "image" ? (
                    <img
                      key={selectedRecording.id}
                      src={selectedRecording.recordingLink}
                      alt={selectedRecording.title || "Recording"}
                      className="recording-preview-image"
                    />
                  ) : selectedPreviewType === "video" ? (
                    <video
                      key={selectedRecording.id}
                      controls
                      preload="metadata"
                      className="recording-preview-video"
                      src={selectedRecording.recordingLink}
                    />
                  ) : selectedPreviewType === "pdf" || selectedPreviewType === "text" || selectedPreviewType === "iframe" ? (
                    <iframe
                      key={selectedRecording.id}
                      src={selectedRecording.recordingLink}
                      title={`Recording ${selectedRecording.title || selectedRecording.id}`}
                      className="recording-preview-iframe"
                      allow="autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="recording-preview-unsupported">
                      Định dạng này chưa hỗ trợ xem trực tiếp. Vui lòng tải xuống để xem.
                    </div>
                  )}
                </div>
                <div className="recording-preview-actions">
                  <button
                    type="button"
                    className="recording-action-btn recording-action-btn--ghost"
                    onClick={() => handleDownload(selectedRecording.recordingLink, selectedRecording.title)}
                  >
                    <Download size={14} />
                    Tải xuống
                  </button>
                </div>
              </div>
            ) : (
              <div className="recording-preview-placeholder">
                Chọn một bản ghi trong danh sách và bấm <strong>Bật xem</strong> để phát video trực tiếp.
              </div>
            )}

            {filteredSessions.length === 0 ? (
              <div className="recording-empty">Không tìm thấy bản ghi phù hợp với bộ lọc.</div>
            ) : (
              <table className="recording-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Tên recording</th>
                    <th>Buổi học</th>
                    <th>Dung lượng</th>
                    <th>Ngày ghi</th>
                    <th>Người tải lên</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map((session, index) => (
                    <tr key={session.id}>
                      <td>{index + 1}</td>
                      <td>
                        <div className="recording-title">
                          <Video size={16} />
                          <span>{session.title || "Buổi học"}</span>
                        </div>
                      </td>
                      <td>
                        <div className="recording-session-meta">
                          <span className="recording-session-type">
                            {session.type === SESSION_TYPE.ONLINE ? "Trực tuyến" : "Trực tiếp"}
                          </span>
                          <span>{formatTimeRange(session)}</span>
                        </div>
                      </td>
                      <td>{formatFileSize(fileSizes[session.id])}</td>
                      <td>{formatDate(session.sessionDate)}</td>
                      <td>{user?.fullName || user?.username || "Giáo viên"}</td>
                      <td>
                        <div className="recording-actions">
                          <a
                            className={`recording-action-btn ${selectedRecordingId === session.id ? "recording-action-btn--active" : ""}`}
                            href="#"
                            onClick={(event) => {
                              event.preventDefault();
                              setSelectedRecordingId(session.id);
                            }}
                          >
                            Bật xem
                          </a>
                          <button
                            type="button"
                            className="recording-action-btn recording-action-btn--ghost"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDownload(session.recordingLink, session.title);
                            }}
                          >
                            <Download size={14} />
                            Tải xuống
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </ClassroomDetailLayout>
  );
};

export default ClassroomRecordingPage;
