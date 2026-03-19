import { apiRequest } from "@/lib/http";

/**
 * Schedule / ClassSession API
 * Maps to: ClassSessionController → /api/classrooms/{classId}/sessions
 */
const scheduleApi = {
  /**
   * Get all sessions for a classroom
   * GET /api/classrooms/{classId}/sessions
   * @param {number} classId
   * @returns {Promise<{ code: number, message: string, result: ClassSessionResponseDTO[] }>}
   */
  getSessionsByClass: (classId) =>
    apiRequest.get(`/classrooms/${classId}/sessions`),

  /**
   * Get a session by ID
   * GET /api/classrooms/{classId}/sessions/{sessionId}
   * @param {number} classId
   * @param {number} sessionId
   * @returns {Promise<{ code: number, message: string, result: ClassSessionResponseDTO }>}
   */
  getSessionById: (classId, sessionId) =>
    apiRequest.get(`/classrooms/${classId}/sessions/${sessionId}`),

  /**
   * Create a new session
   * POST /api/classrooms/{classId}/sessions
   * @param {number} classId
   * @param {CreateClassSessionRequestDTO} data
   * @returns {Promise<{ code: number, message: string, result: ClassSessionResponseDTO }>}
   */
  createSession: (classId, data) =>
    apiRequest.post(`/classrooms/${classId}/sessions`, data),

  /**
   * Update a session
   * PUT /api/classrooms/{classId}/sessions/{sessionId}
   * @param {number} classId
   * @param {number} sessionId
   * @param {CreateClassSessionRequestDTO} data
   * @returns {Promise<{ code: number, message: string, result: ClassSessionResponseDTO }>}
   */
  updateSession: (classId, sessionId, data) =>
    apiRequest.put(`/classrooms/${classId}/sessions/${sessionId}`, data),

  /**
   * Delete a session
   * DELETE /api/classrooms/{classId}/sessions/{sessionId}
   * @param {number} classId
   * @param {number} sessionId
   * @returns {Promise<{ code: number, message: string }>}
   */
  deleteSession: (classId, sessionId) =>
    apiRequest.delete(`/classrooms/${classId}/sessions/${sessionId}`),

  /**
   * Generate Jitsi meeting link and token for a room
   * POST /api/integrations/jitsi/meeting-link
   * @param {{ roomName: string, role: string }} data
   * @returns {Promise<{ code: number, message: string, result: { roomName: string, token: string | null, meetingLink: string } }>}
   */
  generateJitsiMeetingLink: (data) =>
    apiRequest.post('/integrations/jitsi/meeting-link', data),
};

export default scheduleApi;
