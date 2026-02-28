import axiosInstance from "./axiosConfig";

const userApi = {
  /**
   * Get user profile by userId
   * @param {number|string} userId - User ID
   * @returns {Promise} - User profile data
   */
  getProfile: async (userId) => {
    const response = await axiosInstance.get(`/users/profile/${userId}`);
    return response.data;
  },

  /**
   * Update user profile (profile JSON + optional avatar file)
   * PUT /users/profile
   * @param {Object} profileData - { fullName, phone, dateOfBirth, address }
   * @param {File|null} avatarFile - optional avatar image file
   * @returns {Promise}
   */
  updateProfile: async (profileData, avatarFile = null) => {
    const formData = new FormData();
    // Backend expects part name "profile" as JSON blob
    formData.append(
      "profile",
      new Blob([JSON.stringify(profileData)], { type: "application/json" }),
    );
    // Attach avatar only if provided
    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }
    const response = await axiosInstance.put("/users/profile", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  /**
   * Change user password
   * @param {Object} passwordData - { oldPassword, newPassword }
   * @returns {Promise}
   */
  changePassword: async (passwordData) => {
    const response = await axiosInstance.patch(
      "/users/change-password",
      passwordData,
    );
    return response.data;
  },

  /**
   * Upload user avatar
   * @param {FormData} formData - Form data with avatar file
   * @returns {Promise}
   */
  uploadAvatar: async (formData) => {
    const response = await axiosInstance.post(
      "/users/upload-avatar",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },
};

export default userApi;
