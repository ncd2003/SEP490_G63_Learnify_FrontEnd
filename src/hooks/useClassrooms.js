import { useState, useEffect, useCallback } from "react";
import classroomApi from "@/apis/classroomApi";

const useClassrooms = (teacherId) => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchClassrooms = useCallback(async () => {
    if (!teacherId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await classroomApi.findClassroomsByTeacherId(teacherId);
      setClassrooms(response.result ?? []);
    } catch (err) {
      setError(err.response?.data?.message ?? "Không thể tải danh sách lớp học.");
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    fetchClassrooms();
  }, [fetchClassrooms]);

  return { classrooms, loading, error, refetch: fetchClassrooms };
};

export default useClassrooms;
