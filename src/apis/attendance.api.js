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
