import { useCallback, useEffect, useMemo, useState } from "react";
import { attendanceApi } from "@/apis/attendance.api";

const STATUS = {
  PRESENT: "PRESENT",
  ABSENT: "ABSENT",
};

const getStudentId = (record) =>
  record?.studentId ?? record?.student?.id ?? null;

const getAttendanceId = (record) =>
  record?.id ?? record?.attendanceId ?? null;

const getStudentName = (record) =>
  record?.studentName ??
  record?.student?.fullName ??
  record?.student?.name ??
  "Chưa xác định";

const getStudentEmail = (record) =>
  record?.studentEmail ?? record?.student?.email ?? "";

const getStudentPhone = (record) =>
  record?.studentPhone ??
  record?.student?.phoneNumber ??
  record?.student?.phone ??
  "";

const getStudentAvatar = (record) =>
  record?.studentAvatar ?? record?.student?.avatarUrl ?? null;

const normalizeStatus = (status) => {
  if (status === "ABSENT") return STATUS.ABSENT;
  return STATUS.PRESENT;
};

const cloneRows = (rows) => rows.map((row) => ({ ...row }));

const useAttendance = (sessionId, roster) => {
  const [rows, setRows] = useState([]);
  const [initialRows, setInitialRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [locked, setLocked] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const fetchAttendance = useCallback(async () => {
    if (!sessionId) {
      setRows([]);
      setInitialRows([]);
      setLocked(false);
      setHasSubmitted(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await attendanceApi.getAttendanceBySession(sessionId);
      const records = response?.result ?? [];
      const attendanceByStudentId = new Map();

      records.forEach((record) => {
        const studentId = getStudentId(record);
        if (!studentId) return;
        attendanceByStudentId.set(studentId, {
          attendanceId: getAttendanceId(record),
          status: normalizeStatus(record?.status),
          sourceRecord: record,
        });
      });

      let nextRows = [];

      if ((roster?.length ?? 0) > 0) {
        nextRows = roster.map((student) => {
          const attendance = attendanceByStudentId.get(student.id);
          return {
            studentId: student.id,
            attendanceId: attendance?.attendanceId ?? null,
            fullName: student.fullName,
            email: student.email,
            phoneNumber: student.phoneNumber,
            avatarUrl: student.avatarUrl,
            status: attendance?.status ?? STATUS.PRESENT,
          };
        });
      } else {
        nextRows = records
          .map((record) => {
            const studentId = getStudentId(record);
            if (!studentId) return null;
            return {
              studentId,
              attendanceId: getAttendanceId(record),
              fullName: getStudentName(record),
              email: getStudentEmail(record),
              phoneNumber: getStudentPhone(record),
              avatarUrl: getStudentAvatar(record),
              status: normalizeStatus(record?.status),
            };
          })
          .filter(Boolean);
      }

      setRows(nextRows);
      setInitialRows(cloneRows(nextRows));
      setHasSubmitted(records.length > 0);
      setLocked(records.length > 0);
    } catch (err) {
      setError(err?.response?.data?.message ?? "Không thể tải dữ liệu điểm danh.");
    } finally {
      setLoading(false);
    }
  }, [roster, sessionId]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const setRowStatus = (studentId, status) => {
    setRows((prev) =>
      prev.map((row) =>
        row.studentId === studentId ? { ...row, status: normalizeStatus(status) } : row,
      ),
    );
  };

  const markAllPresent = () => {
    setRows((prev) => prev.map((row) => ({ ...row, status: STATUS.PRESENT })));
  };

  const markAllAbsent = () => {
    setRows((prev) => prev.map((row) => ({ ...row, status: STATUS.ABSENT })));
  };

  const resetChanges = () => {
    setRows(cloneRows(initialRows));
    setError("");
    setSuccess("");
    setLocked(hasSubmitted);
  };

  const enableEdit = () => {
    setSuccess("");
    setError("");
    setLocked(false);
  };

  const save = async () => {
    if (!sessionId) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      if (!hasSubmitted) {
        await Promise.all(
          rows.map((row) =>
            attendanceApi.markAttendance(sessionId, {
              studentId: row.studentId,
              status: row.status,
            }),
          ),
        );
      } else {
        const initialMap = new Map(initialRows.map((row) => [row.studentId, row]));

        const updateTasks = rows
          .filter((row) => {
            const initial = initialMap.get(row.studentId);
            if (!initial) return true;
            return initial.status !== row.status;
          })
          .map((row) => {
            if (row.attendanceId) {
              return attendanceApi.updateAttendance(sessionId, row.attendanceId, {
                studentId: row.studentId,
                status: row.status,
              });
            }

            return attendanceApi.markAttendance(sessionId, {
              studentId: row.studentId,
              status: row.status,
            });
          });

        if (updateTasks.length > 0) {
          await Promise.all(updateTasks);
        }
      }

      await fetchAttendance();
      setSuccess("MSG96: Điểm danh thành công.");
      setLocked(true);
      setHasSubmitted(true);
    } catch (err) {
      setError(err?.response?.data?.message ?? "Không thể lưu điểm danh.");
    } finally {
      setSubmitting(false);
    }
  };

  const summary = useMemo(() => {
    const presentCount = rows.filter((row) => row.status === STATUS.PRESENT).length;
    const absentCount = rows.filter((row) => row.status === STATUS.ABSENT).length;
    return {
      presentCount,
      absentCount,
      total: rows.length,
    };
  }, [rows]);

  return {
    rows,
    loading,
    submitting,
    error,
    success,
    locked,
    hasSubmitted,
    summary,
    setRowStatus,
    markAllPresent,
    markAllAbsent,
    resetChanges,
    enableEdit,
    save,
    refetch: fetchAttendance,
  };
};

export { STATUS };
export default useAttendance;
