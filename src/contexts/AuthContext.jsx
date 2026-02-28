import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import authApi from "../apis/authApi";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check for existing auth on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");

    console.log("[AuthContext] Initial mount - checking localStorage:", {
      hasUser: !!storedUser,
      hasToken: !!token,
    });

    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  // Debug: Log authentication state changes
  useEffect(() => {
    console.log("[AuthContext] State changed:", {
      isAuthenticated,
      hasUser: !!user,
      userId: user?.id,
      userName: user?.fullName,
    });
  }, [isAuthenticated, user]);

  const login = async (credentials) => {
    const response = await authApi.login(credentials);

    // Backend returns: { code, message, result: { accessToken, id, email, fullName } }
    const { accessToken } = response.result;

    // Lưu token
    localStorage.setItem("accessToken", accessToken);
    setIsAuthenticated(true);

    // Lấy thông tin user chi tiết từ API /users/me
    try {
      const userResponse = await authApi.getCurrentUser();
      const userData = userResponse.result; // { id, fullName, email, avatarUrl }

      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      console.log("Login successful, user data loaded:", userData);
    } catch (error) {
      console.error("Could not fetch user info after login:", error);
      // Fallback: dùng thông tin từ login response
      const fallbackData = {
        id: response.result.id,
        email: response.result.email,
        fullName: response.result.fullName,
        avatarUrl: null,
      };
      setUser(fallbackData);
      localStorage.setItem("user", JSON.stringify(fallbackData));
    }

    return response;
  };

  const register = async (userData) => {
    const response = await authApi.register(userData);
    // Backend may return: { code, message, result: {...} }
    // Return full response so component can handle success message
    return response;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const verifyOtp = async (otpData) => {
    const response = await authApi.verifyOtp(otpData);
    return response;
  };

  const resendOtp = async (email, userId) => {
    const response = await authApi.resendOtp({ email, userId });
    return response;
  };

  const handleOAuth2Login = useCallback(async (token) => {
    try {
      console.log("[OAuth2] Starting login with token");

      // Xóa dữ liệu user cũ trước khi xử lý token mới
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      setUser(null);
      setIsAuthenticated(false);

      // Lưu token mới vào localStorage
      localStorage.setItem("accessToken", token);

      // Lấy thông tin user từ backend API /users/me
      console.log("[OAuth2] Fetching user data from /users/me");
      const response = await authApi.getCurrentUser();
      const userData = response.result; // { id, fullName, email, avatarUrl }

      console.log("[OAuth2] User data received:", userData);

      // CHỈ set authenticated = true SAU KHI có user data
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      setIsAuthenticated(true);

      console.log("[OAuth2] Login completed successfully");

      return { success: true, user: userData };
    } catch (error) {
      console.error("[OAuth2] Login error:", error);
      // Nếu lỗi, xóa token và reset state
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      setIsAuthenticated(false);
      setUser(null);
      throw error;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        logout,
        register,
        verifyOtp,
        resendOtp,
        handleOAuth2Login,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
