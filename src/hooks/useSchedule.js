import { useState, useEffect, useCallback } from "react";
import scheduleApi from "@/apis/scheduleApi";

/**
 * Hook to manage class sessions for a classroom.
 * Maps to ClassSessionController endpoints.
 *
 * @param {number} classId - Classroom ID
 * @returns {{ sessions, loading, error, refetch, createSession, updateSession, deleteSession }}
 */
const useSchedule = (classId) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSessions = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await scheduleApi.getSessionsByClass(classId);
      if (response.code === 1000) {
        setSessions(response.result ?? []);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ?? "Không thể tải danh sách buổi học."
      );
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  /**
   * Create a new session
   * @param {CreateClassSessionRequestDTO} data
   * @returns {Promise<ClassSessionResponseDTO>}
   */
  const createSession = async (data) => {
    const response = await scheduleApi.createSession(classId, data);
    if (response.code === 1000) {
      setSessions((prev) => [...prev, response.result]);
    }
    return response;
  };

  /**
   * Update a session
   * @param {number} sessionId
   * @param {CreateClassSessionRequestDTO} data
   * @returns {Promise<ClassSessionResponseDTO>}
   */
  const updateSession = async (sessionId, data) => {
    const response = await scheduleApi.updateSession(classId, sessionId, data);
    if (response.code === 1000) {
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? response.result : s))
      );
    }
    return response;
  };

  /**
   * Delete a session
   * @param {number} sessionId
   * @returns {Promise<void>}
   */
  const deleteSession = async (sessionId) => {
    const response = await scheduleApi.deleteSession(classId, sessionId);
    if (response.code === 1000) {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    }
    return response;
  };

  return {
    sessions,
    loading,
    error,
    refetch: fetchSessions,
    createSession,
    updateSession,
    deleteSession,
  };
};

export default useSchedule;
