import axiosInstance from "./axiosConfig";

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
  getSessionsByClass: async (classId) => {
    const response = await axiosInstance.get(`/classrooms/${classId}/sessions`);
    return response.data;
  },

  /**
   * Get a session by ID
   * GET /api/classrooms/{classId}/sessions/{sessionId}
   * @param {number} classId
   * @param {number} sessionId
   * @returns {Promise<{ code: number, message: string, result: ClassSessionResponseDTO }>}
   */
  getSessionById: async (classId, sessionId) => {
    const response = await axiosInstance.get(`/classrooms/${classId}/sessions/${sessionId}`);
    return response.data;
  },

  /**
   * Create a new session
   * POST /api/classrooms/{classId}/sessions
   * @param {number} classId
   * @param {CreateClassSessionRequestDTO} data
   * @returns {Promise<{ code: number, message: string, result: ClassSessionResponseDTO }>}
   */
  createSession: async (classId, data) => {
    const response = await axiosInstance.post(`/classrooms/${classId}/sessions`, data);
    return response.data;
  },

  /**
   * Update a session
   * PUT /api/classrooms/{classId}/sessions/{sessionId}
   * @param {number} classId
   * @param {number} sessionId
   * @param {CreateClassSessionRequestDTO} data
   * @returns {Promise<{ code: number, message: string, result: ClassSessionResponseDTO }>}
   */
  updateSession: async (classId, sessionId, data) => {
    const response = await axiosInstance.put(`/classrooms/${classId}/sessions/${sessionId}`, data);
    return response.data;
  },

  /**
   * Delete a session
   * DELETE /api/classrooms/{classId}/sessions/{sessionId}
   * @param {number} classId
   * @param {number} sessionId
   * @returns {Promise<{ code: number, message: string }>}
   */
  deleteSession: async (classId, sessionId) => {
    const response = await axiosInstance.delete(`/classrooms/${classId}/sessions/${sessionId}`);
    return response.data;
  },
};

export default scheduleApi;
