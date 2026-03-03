import axiosInstance from "./axiosConfig";

const classroomApi = {
  /**
   * Get all classrooms by teacher ID
   * @param {number} teacherId
   * @returns {Promise<{ code: number, result: ClassroomResponseDTO[] }>}
   */
  findClassroomsByTeacherId: async (teacherId) => {
    const response = await axiosInstance.get("/classrooms", {
      params: { teacherId },
    });
    return response.data;
  },

  /**
   * Create a classroom (multipart/form-data via @ModelAttribute)
   * @param {{ name: string, subject: string, description?: string }} data
   * @param {File|null} file - optional cover image
   * @returns {Promise<{ code: number, result: ClassroomResponseDTO }>}
   */
  createClassroom: async (data, file) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("subject", data.subject);
    if (data.description) formData.append("description", data.description);
    if (file) formData.append("file", file);
    const response = await axiosInstance.post("/classrooms", formData, {
      headers: { "Content-Type": undefined },
    });
    return response.data;
  },

  /**
   * Update a classroom (multipart/form-data)
   * @param {number} id
   * @param {{ name: string, subject: string, description: string }} data
   * @param {File} file
   * @returns {Promise<{ code: number, result: ClassroomResponseDTO }>}
   */
  updateClassroom: async (id, data, file) => {
    const formData = new FormData();
    formData.append(
      "data",
      new Blob([JSON.stringify(data)], { type: "application/json" })
    );
    if (file) formData.append("file", file);
    const response = await axiosInstance.put(`/classrooms/${id}`, formData, {
      headers: { "Content-Type": undefined },
    });
    return response.data;
  },
  /**
   * Delete a classroom by ID
   * @param {number} id
   * @returns {Promise<{ code: number, message: string }>}
   */
  deleteClassroom: async (id) => {
    const response = await axiosInstance.delete(`/classrooms/${id}`);
    return response.data;
  },
};

export default classroomApi;
