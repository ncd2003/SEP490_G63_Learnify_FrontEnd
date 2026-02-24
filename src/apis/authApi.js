import axiosInstance from "./axiosConfig";

const authApi = {
  /**
   * Login user
   * @param {Object} credentials - { email, password }
   * @returns {Promise} - User data and tokens
   */
  login: async (credentials) => {
    const response = await axiosInstance.post("/auth/login", credentials);
    return response.data;
  },

  /**
   * Register new user
   * @param {Object} userData - Registration data
   * @returns {Promise} - Registration result
   */
  register: async (userData) => {
    const response = await axiosInstance.post("/auth/register", userData);
    return response.data;
  },

  /**
   * Logout user
   * @returns {Promise}
   */
  logout: async () => {
    const response = await axiosInstance.post("/auth/logout");
    return response.data;
  },

  /**
   * Verify OTP
   * @param {Object} otpData - { email, otp }
   * @returns {Promise}
   */
  verifyOtp: async (otpData) => {
    const response = await axiosInstance.post("/auth/verify-otp", otpData);
    return response.data;
  },

  /**
   * Resend OTP
   * @param {Object} data - { email, userId }
   * @returns {Promise}
   */
  resendOtp: async (data) => {
    const response = await axiosInstance.post("/auth/resend-otp", data);
    return response.data;
  },

  /**
   * Get current user info
   * @returns {Promise} - Current user data
   */
  getCurrentUser: async () => {
    const response = await axiosInstance.get("/users/me");
    return response.data;
  },
};

export default authApi;
