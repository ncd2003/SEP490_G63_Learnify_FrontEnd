import { useState, useEffect, useCallback } from "react";
import { classroomApi } from "@/apis/classroom.api";

const useClassrooms = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchClassrooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await classroomApi.getClassroomsByTeacher();
      setClassrooms(response.result ?? []);
    } catch (err) {
      setError(err.response?.data?.message ?? "Không thể tải danh sách lớp học.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClassrooms();
  }, [fetchClassrooms]);

  return { classrooms, loading, error, refetch: fetchClassrooms };
};

export default useClassrooms;
