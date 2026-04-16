import { useState, useEffect, useCallback } from "react";
import scheduleApi from "@/apis/schedule.api";

/**
 * Fetch and manage sessions for a classroom.
 * Provides CRUD operations for schedule/sessions.
 *
 * @param {number} classroomId
 */
const useSchedule = (classroomId) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSessions = useCallback(async () => {
    if (!classroomId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await scheduleApi.getSessionsByClass(classroomId);
      setSessions(response.result ?? []);
    } catch (err) {
      setError(err.response?.data?.message ?? "Không thể tải lịch học.");
    } finally {
      setLoading(false);
    }
  }, [classroomId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  /**
   * Create a new session
   * @param {CreateClassSessionRequestDTO} data
   */
  const createSession = async (data) => {
    const response = await scheduleApi.createSession(classroomId, data);
    await fetchSessions();
    return response;
  };

  /**
   * Update an existing session
   * @param {number} sessionId
   * @param {CreateClassSessionRequestDTO} data
   */
  const updateSession = async (sessionId, data) => {
    const response = await scheduleApi.updateSession(classroomId, sessionId, data);
    await fetchSessions();
    return response;
  };

  /**
   * Delete a session
   * @param {number} sessionId
   */
  const deleteSession = async (sessionId) => {
    await scheduleApi.deleteSession(classroomId, sessionId);
    await fetchSessions();
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
