import { useState, useEffect, useCallback } from "react";
import { classroomApi } from "@/apis/classroom.api";

const useClassrooms = () => {
  const [paging, setPaging] = useState({
    content: [],
    pageNumber: 1,
    pageSize: 10,
    totalElements: 0,
    totalPages: 1,
    last: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchClassrooms = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await classroomApi.getClassroomsByUser(params);
      setPaging(response.result ?? {
        content: [],
        pageNumber: 1,
        pageSize: 10,
        totalElements: 0,
        totalPages: 1,
        last: true,
      });
    } catch (err) {
      setError(err.response?.data?.message ?? "Không thể tải danh sách lớp học.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClassrooms();
  }, [fetchClassrooms]);

  return { paging, loading, error, refetch: fetchClassrooms };
};

export default useClassrooms;
