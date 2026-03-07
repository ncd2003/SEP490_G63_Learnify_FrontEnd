import axiosInstance from "./axiosConfig";

/**
 * Attendance API
 * Maps to: AttendanceController → /api/sessions/{sessionId}/attendance
 */
const attendanceApi = {
  /**
   * Mark attendance for a student
   * POST /api/sessions/{sessionId}/attendance
   * @param {number} sessionId
   * @param {{ studentId: number, status: 'PRESENT'|'ABSENT'|'LATE'|'EXCUSED' }} data
   * @returns {Promise<{ code: number, message: string, result: AttendanceRecordResponseDTO }>}
   */
  markAttendance: async (sessionId, data) => {
    const response = await axiosInstance.post(`/sessions/${sessionId}/attendance`, data);
    return response.data;
  },

  /**
   * Get all attendance records for a session
   * GET /api/sessions/{sessionId}/attendance
   * @param {number} sessionId
   * @returns {Promise<{ code: number, message: string, result: AttendanceRecordResponseDTO[] }>}
   */
  getAttendanceBySession: async (sessionId) => {
    const response = await axiosInstance.get(`/sessions/${sessionId}/attendance`);
    return response.data;
  },

  /**
   * Update attendance status
   * PUT /api/sessions/{sessionId}/attendance/{attendanceId}
   * @param {number} sessionId
   * @param {number} attendanceId
   * @param {{ studentId: number, status: 'PRESENT'|'ABSENT'|'LATE'|'EXCUSED' }} data
   * @returns {Promise<{ code: number, message: string, result: AttendanceRecordResponseDTO }>}
   */
  updateAttendance: async (sessionId, attendanceId, data) => {
    const response = await axiosInstance.put(`/sessions/${sessionId}/attendance/${attendanceId}`, data);
    return response.data;
  },

  /**
   * Delete an attendance record
   * DELETE /api/sessions/{sessionId}/attendance/{attendanceId}
   * @param {number} sessionId
   * @param {number} attendanceId
   * @returns {Promise<{ code: number, message: string }>}
   */
  deleteAttendance: async (sessionId, attendanceId) => {
    const response = await axiosInstance.delete(`/sessions/${sessionId}/attendance/${attendanceId}`);
    return response.data;
  },
};

export default attendanceApi;
