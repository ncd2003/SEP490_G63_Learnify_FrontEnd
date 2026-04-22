import { apiRequest } from "@/lib/http";

export const attendanceApi = {
  /**
   * @param {number} sessionId
   * @param {{ studentId: number, status: 'PRESENT'|'ABSENT'|'LATE'|'EXCUSED' }} data
   */
  markAttendance: (sessionId, data) =>
    apiRequest.post(`/sessions/${sessionId}/attendance`, data),

  /**
   * @param {number} sessionId
   */
  getAttendanceBySession: (sessionId) =>
    apiRequest.get(`/sessions/${sessionId}/attendance`),

  /**
   * @param {number} classId
   * @param {number} page
   * @param {number} size
   */
  getAttendanceByClass: (classId, page = 1, size = 100) =>
    apiRequest.get(`/classrooms/${classId}/attendance`, {
      params: { page, size },
    }),

  /**
   * @param {number} classId
   */
  getAttendanceSessionsByClass: (classId) =>
    apiRequest.get(`/classrooms/${classId}/attendance/sessions`),

  /**
   * Auto mark the authenticated student as PRESENT when joining a lesson.
   * @param {number} sessionId
   */
  autoMarkAttendance: (sessionId) =>
    apiRequest.post(`/sessions/${sessionId}/attendance/auto-mark`),

  /**
   * @param {number} sessionId
   * @param {number} attendanceId
   * @param {{ studentId: number, status: 'PRESENT'|'ABSENT'|'LATE'|'EXCUSED' }} data
   */
  updateAttendance: (sessionId, attendanceId, data) =>
    apiRequest.put(`/sessions/${sessionId}/attendance/${attendanceId}`, data),

  /**
   * @param {number} sessionId
   * @param {number} attendanceId
   */
  deleteAttendance: (sessionId, attendanceId) =>
    apiRequest.delete(`/sessions/${sessionId}/attendance/${attendanceId}`),
};
