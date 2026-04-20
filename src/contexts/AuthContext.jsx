import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authApi } from "@/apis/auth.api";
import { userApi } from "@/apis/user.api";

const AuthContext = createContext(null);

const clearBrowserAuthData = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");

  // Clear temporary/session auth data.
  sessionStorage.clear();

  // Attempt to clear client-accessible cookies related to auth/session.
  document.cookie.split(";").forEach((cookie) => {
    const [rawName] = cookie.split("=");
    const name = rawName?.trim();
    if (!name) return;

    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  });
};

const normalizeBenefitUsageList = (value) =>
  Array.isArray(value) ? value : [];

const enrichUserWithPlanAndBenefits = (userPayload, authResult) => {
  const profile = userPayload || {};
  const loginResult = authResult || {};
  const profileBenefitUsage = normalizeBenefitUsageList(
    profile.userBenefitUsageDTO,
  );
  const loginBenefitUsage = normalizeBenefitUsageList(
    loginResult.userBenefitUsageDTO,
  );

  return {
    ...profile,
    plan: profile.plan ?? loginResult.plan ?? null,
    userBenefitUsageDTO:
      profileBenefitUsage.length > 0 ? profileBenefitUsage : loginBenefitUsage,
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check for existing auth on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");

    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const response = await authApi.login(credentials);
    const loginResult = response?.result || {};

    // Backend returns: { code, message, result: { accessToken, id, email, fullName } }
    const { accessToken } = loginResult;

    // Lưu token
    localStorage.setItem("accessToken", accessToken);
    setIsAuthenticated(true);

    // Lấy thông tin user chi tiết từ API /users/me
    let userData;
    try {
      const userResponse = await authApi.getCurrentUser();
      userData = enrichUserWithPlanAndBenefits(
        userResponse.result,
        loginResult,
      );

      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (error) {
      console.error("Could not fetch user info after login:", error);
      // Fallback: dùng thông tin từ login response
      userData = enrichUserWithPlanAndBenefits(
        {
          id: loginResult.id,
          email: loginResult.email,
          fullName: loginResult.fullName,
          avatarUrl: null,
          role: loginResult.role,
        },
        loginResult,
      );
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
    }

    return userData;
  };

  const adminLogin = async (credentials) => {
    const response = await authApi.adminLogin(credentials);
    const loginResult = response?.result || {};

    const { accessToken } = loginResult;
    localStorage.setItem("accessToken", accessToken);
    setIsAuthenticated(true);

    let userData;
    try {
      const userResponse = await authApi.getCurrentUser();
      userData = enrichUserWithPlanAndBenefits(
        userResponse.result,
        loginResult,
      );

      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (error) {
      console.error("Could not fetch admin info after login:", error);
      userData = enrichUserWithPlanAndBenefits(
        {
          id: loginResult.id,
          email: loginResult.email,
          fullName: loginResult.fullName,
          avatarUrl: null,
          role: "ROLE_ADMIN",
        },
        loginResult,
      );
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
    }

    return userData;
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
      clearBrowserAuthData();
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

  const updateUserRole = async (role) => {
    //console.log('[AuthContext] updateUserRole called with:', role);
    //console.log('[AuthContext] Current token:', localStorage.getItem('accessToken')?.substring(0, 30) + '...');

    const res = await userApi.chooseRole(role);
    //console.log('[AuthContext] chooseRole response:', res);

    // Backend trả về JWT mới trong result — lưu lại để các request sau dùng token có role
    const newToken = res.result;
    if (newToken) {
      localStorage.setItem("accessToken", newToken);
      //console.log('[AuthContext] New token saved:', newToken.substring(0, 30) + '...');
    }
    // Refresh user data từ server để lấy role mới
    const response = await authApi.getCurrentUser();
    const updatedUser = enrichUserWithPlanAndBenefits(response.result, user);
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    //console.log('[AuthContext] User updated with role:', updatedUser.role);
    return updatedUser;
  };

  const handleOAuth2Login = useCallback(async (token) => {
    try {
      // Xóa dữ liệu user cũ trước khi xử lý token mới
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      setUser(null);
      setIsAuthenticated(false);

      // Lưu token mới vào localStorage
      localStorage.setItem("accessToken", token);

      // Lấy thông tin user từ backend API /users/me
      const response = await authApi.getCurrentUser();
      const userData = enrichUserWithPlanAndBenefits(response.result, null);

      // CHỈ set authenticated = true SAU KHI có user data
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      setIsAuthenticated(true);

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

  const adjustStorageUsage = useCallback((deltaBytes) => {
    const delta = Number(deltaBytes);
    if (!Number.isFinite(delta) || delta === 0) {
      return;
    }

    setUser((prevUser) => {
      if (!prevUser) {
        return prevUser;
      }

      const usageList = Array.isArray(prevUser.userBenefitUsageDTO)
        ? prevUser.userBenefitUsageDTO
        : [];
      const storageIndex = usageList.findIndex(
        (item) => item?.benefitCode === "STORAGE",
      );

      if (storageIndex < 0) {
        return prevUser;
      }

      const nextUsageList = [...usageList];
      const currentUsed = Number(nextUsageList[storageIndex]?.used);
      const safeCurrentUsed = Number.isFinite(currentUsed) ? currentUsed : 0;

      nextUsageList[storageIndex] = {
        ...nextUsageList[storageIndex],
        used: Math.max(0, safeCurrentUsed + delta),
      };

      const nextUser = {
        ...prevUser,
        userBenefitUsageDTO: nextUsageList,
      };

      localStorage.setItem("user", JSON.stringify(nextUser));
      return nextUser;
    });
  }, []);

  const adjustAiRequestUsage = useCallback((deltaCount) => {
    const delta = Number(deltaCount);
    if (!Number.isFinite(delta) || delta === 0) {
      return;
    }

    setUser((prevUser) => {
      if (!prevUser) {
        return prevUser;
      }

      const usageList = Array.isArray(prevUser.userBenefitUsageDTO)
        ? prevUser.userBenefitUsageDTO
        : [];
      const aiRequestIndex = usageList.findIndex(
        (item) => item?.benefitCode === "AI_REQUEST",
      );

      if (aiRequestIndex < 0) {
        return prevUser;
      }

      const nextUsageList = [...usageList];
      const currentUsed = Number(nextUsageList[aiRequestIndex]?.used);
      const safeCurrentUsed = Number.isFinite(currentUsed) ? currentUsed : 0;

      nextUsageList[aiRequestIndex] = {
        ...nextUsageList[aiRequestIndex],
        used: Math.max(0, safeCurrentUsed + delta),
      };

      const nextUser = {
        ...prevUser,
        userBenefitUsageDTO: nextUsageList,
      };

      localStorage.setItem("user", JSON.stringify(nextUser));
      return nextUser;
    });
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    const response = await authApi.getCurrentUser();

    let storedUser = null;
    try {
      const rawStoredUser = localStorage.getItem("user");
      storedUser = rawStoredUser ? JSON.parse(rawStoredUser) : null;
    } catch {
      storedUser = null;
    }

    const nextUser = enrichUserWithPlanAndBenefits(
      response?.result,
      storedUser || user,
    );

    setUser(nextUser);
    localStorage.setItem("user", JSON.stringify(nextUser));

    return nextUser;
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        adminLogin,
        logout,
        register,
        verifyOtp,
        resendOtp,
        handleOAuth2Login,
        updateUserRole,
        adjustStorageUsage,
        adjustAiRequestUsage,
        refreshCurrentUser,
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
