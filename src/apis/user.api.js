import { apiRequest } from "@/lib/http";

const BASE = "/users";

export const userApi = {
  /**
   * @param {number|string} userId
   */
  getProfile: (userId) => apiRequest.get(`${BASE}/profile/${userId}`),

  /**
   * @param {Object} profileData - { fullName, phoneNumber, birthDate, address }
   * @param {File|null} avatarFile
   */
  updateProfile: (profileData, avatarFile = null) => {
    const formData = new FormData();
    formData.append(
      "profile",
      new Blob([JSON.stringify(profileData)], { type: "application/json" }),
    );
    if (avatarFile) formData.append("avatar", avatarFile);
    return apiRequest.put(`${BASE}/profile`, formData);
  },

  /**
   * @param {{ oldPassword: string, newPassword: string }} passwordData
   */
  changePassword: (passwordData) =>
    apiRequest.patch(`${BASE}/change-password`, passwordData),

  /**
   * @param {FormData} formData
   */
  uploadAvatar: (formData) =>
    apiRequest.post(`${BASE}/upload-avatar`, formData),

  /**
   * @param {string} roleName - "ROLE_STUDENT" | "ROLE_TEACHER"
   */
  chooseRole: (roleName) =>
    apiRequest.patch(`${BASE}/choose-role`, { roleName }),

  /**
   * @param {string} email
   */
  searchStudentsByEmail: (email) =>
    apiRequest.get(`${BASE}/search-students`, { params: { email } }),
};
