import axiosInstance from "./axiosConfig";

const userApi = {
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
