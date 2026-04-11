import { useState, useEffect } from "react";
import { assignmentApi } from "@/apis/assignment.api";

/**
 * Hook to fetch and manage pending draft sessions
 * @param {string} targetType - "ASSIGNMENT", "BANK", or null for all
 * @returns {{ pendingSessions: Map, isLoading: boolean, error: string | null }}
 *   - pendingSessions: Map<targetId, PendingSessionResponse>
 *   - isLoading: Whether data is being fetched
 *   - error: Error message if fetch failed
 */
export const usePendingSessions = (targetType = null) => {
  const [pendingSessions, setPendingSessions] = useState(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPendingSessions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const resp = await assignmentApi.getPendingSessionsSummary(targetType);

        if (Array.isArray(resp?.result)) {
          // Convert array to Map for easy lookup by targetId
          const sessionsMap = new Map(
            resp.result.map((session) => [session.targetId, session]),
          );
          setPendingSessions(sessionsMap);
        } else {
          setPendingSessions(new Map());
        }
      } catch (err) {
        console.error("Failed to fetch pending sessions:", err);
        setError(
          err?.response?.data?.message || "Failed to load pending sessions",
        );
        setPendingSessions(new Map());
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingSessions();
  }, [targetType]);

  return { pendingSessions, isLoading, error };
};
