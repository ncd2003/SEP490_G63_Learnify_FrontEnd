import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { userApi } from "../apis/user.api.js";
import { PATH_AUTH, PATH_COMMON } from "@/routes/paths";
import "@/assets/css/pages/userProfile.css";
import {
  ArrowLeft,
  Camera,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Shield,
  Edit3,
  Lock,
  Save,
  X,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const mapRole = (role) => {
  if (Array.isArray(role)) {
    role = role[0];
  }
  if (!role) return "Học sinh";
  const roleStr = String(role).toUpperCase();
  const roleMap = {
    ROLE_STUDENT: "Học sinh",
    ROLE_TEACHER: "Giáo viên",
    ROLE_ADMIN: "Quản trị viên",
    ROLE_GUEST: "Khách",
    STUDENT: "Học sinh",
    TEACHER: "Giáo viên",
    ADMIN: "Quản trị viên",
    GUEST: "Khách"
  };
  return roleMap[roleStr] || roleStr;
};

const MSG16 =
  "Mật khẩu đã được cập nhật. Tất cả các phiên đăng nhập đã bị xóa. Vui lòng đăng nhập lại.";
const MSG17 = "Mật khẩu hiện tại bạn nhập không chính xác.";
const MSG18 = "Mật khẩu mới không được trùng với mật khẩu hiện tại của bạn.";
const MSG129 = "Mật khẩu mới và xác nhận mật khẩu chưa khớp.";

const isPasswordCompliant = (password = "") => {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[!@#$%^&*]/.test(password)
  );
};

const normalizeText = (value = "") =>
  value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const UserProfile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, logout } = useAuth();
  const fileInputRef = useRef(null);

  // Profile state
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    birthDate: "",
    address: "",
    role: "",
  });
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null); // actual File object for upload
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  // Snapshot để restore khi Cancel
  const originalProfileData = useRef(null);

  // Change password state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Feedback state
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isGoogleUser =
    `${user?.provider || user?.authProvider || user?.loginProvider || ""}`
      .toLowerCase()
      .includes("google") || user?.isSocialLogin === true;
  const hasLocalPassword = user?.hasLocalPassword !== false;
  const canChangePassword = !isGoogleUser || hasLocalPassword;

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/");
    }
  }, [loading, isAuthenticated, navigate]);

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userId = user?.id;
        if (!userId) {
          throw new Error("Không tìm thấy userId");
        }
        const response = await userApi.getProfile(userId);
        const data = response.result;
        const mapped = {
          fullName: data.fullName || "",
          email: data.email || "",
          phoneNumber: data.phoneNumber ?? "",
          birthDate: data.birthDate ?? "",
          address: data.address ?? "",
          role: mapRole(data.roles || data.role || user?.role),
        };
        setProfileData(mapped);
        originalProfileData.current = mapped;
        setAvatarUrl(data.avatarUrl || null);
      } catch (error) {
        console.error("Failed to load profile:", error);
        // Fallback to AuthContext data
        if (user) {
          const fallback = {
            fullName: user.fullName || "",
            email: user.email || "",
            phoneNumber: user.phoneNumber || "",
            birthDate: user.birthDate || "",
            address: user.address || "",
            role: mapRole(user.role),
          };
          setProfileData(fallback);
          originalProfileData.current = fallback;
          setAvatarUrl(user.avatarUrl || null);
        }
      } finally {
        setIsLoadingProfile(false);
      }
    };

    if (isAuthenticated) {
      loadProfile();
    }
  }, [isAuthenticated, user?.id]);

  // Avatar upload handler
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage("Chỉ chấp nhận định dạng JPG hoặc PNG");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Kích thước ảnh tối đa 5MB");
      return;
    }

    // Store file for upload on save, show local preview
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // If not in edit mode, save immediately with current profile data
    if (!isEditing) {
      try {
        // Chỉ gửi các trường có giá trị
        const updateData = {
          fullName: profileData.fullName,
        };
        if (profileData.phoneNumber)
          updateData.phoneNumber = profileData.phoneNumber;
        if (profileData.birthDate) updateData.birthDate = profileData.birthDate;
        if (profileData.address) updateData.address = profileData.address;

        const response = await userApi.updateProfile(updateData, file);
        const updated = response.result;
        if (updated?.avatarUrl) setAvatarUrl(updated.avatarUrl);
        setAvatarFile(null);
        setSuccessMessage("Cập nhật ảnh đại diện thành công!");
        clearMessages();
      } catch (error) {
        console.error("Avatar upload failed:", error);
        setErrorMessage(
          error.response?.data?.message ||
            "Upload ảnh thất bại. Vui lòng thử lại.",
        );
        setAvatarPreview(null);
        setAvatarFile(null);
        clearMessages();
      }
    }
  };

  // Edit profile handler
  const handleEditProfile = () => {
    setIsEditing(true);
    setShowChangePassword(false);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setAvatarFile(null);
    setAvatarPreview(null);
    // Restore snapshot chụp lúc load — giữ nguyên phone & dateOfBirth
    if (originalProfileData.current) {
      setProfileData(originalProfileData.current);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // Chỉ gửi các trường có giá trị
      const updateData = {
        fullName: profileData.fullName,
      };
      if (profileData.phoneNumber)
        updateData.phoneNumber = profileData.phoneNumber;
      if (profileData.birthDate) updateData.birthDate = profileData.birthDate;
      if (profileData.address) updateData.address = profileData.address;

      const response = await userApi.updateProfile(
        updateData,
        avatarFile, // null nếu không chọn ảnh mới
      );
      const updated = response.result;
      // Sync tất cả fields từ response (server có thể format lại)
      if (updated) {
        const synced = {
          fullName: updated.fullName || profileData.fullName,
          email: updated.email || profileData.email,
          phoneNumber: updated.phoneNumber || profileData.phoneNumber,
          birthDate: updated.birthDate || profileData.birthDate,
          address: updated.address || profileData.address,
          role: (updated.roles || updated.role) ? mapRole(updated.roles || updated.role) : profileData.role,
        };
        setProfileData(synced);
        originalProfileData.current = synced;
        if (updated.avatarUrl) setAvatarUrl(updated.avatarUrl);
      }
      setAvatarFile(null);
      setAvatarPreview(null);
      setSuccessMessage("Cập nhật thông tin thành công!");
      setIsEditing(false);
      clearMessages();
    } catch (error) {
      console.error("Update profile failed:", error);
      setErrorMessage(
        error.response?.data?.message || "Cập nhật thất bại. Vui lòng thử lại.",
      );
      clearMessages();
    } finally {
      setIsSaving(false);
    }
  };

  // Change password handler
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!canChangePassword) {
      toast.error(
        "Tài khoản Google chưa thiết lập mật khẩu cục bộ nên không thể đổi mật khẩu.",
        { id: "change-password-disabled" },
      );
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(MSG129, { id: "change-password-msg129" });
      return;
    }

    if (passwordData.oldPassword === passwordData.newPassword) {
      toast.error(MSG18, { id: "change-password-msg18" });
      return;
    }

    if (!isPasswordCompliant(passwordData.newPassword)) {
      toast.error(
        "Mật khẩu mới phải có tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt (!@#$%^&*).",
        { id: "change-password-br17" },
      );
      return;
    }

    setIsSaving(true);

    try {
      await userApi.changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });
      toast.success(MSG16, { id: "change-password-msg16" });
      setShowChangePassword(false);
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      await logout();
      navigate(PATH_AUTH.login, { replace: true });
    } catch (error) {
      console.error("Change password failed:", error);
      const backendMessage = normalizeText(
        error?.response?.data?.message || "",
      );
      const backendCode = normalizeText(error?.response?.data?.code || "");
      const status = error?.response?.status;

      if (
        backendMessage.includes("current password") ||
        backendMessage.includes("old password") ||
        backendMessage.includes("mat khau hien tai") ||
        backendMessage.includes("mat khau cu") ||
        backendCode.includes("current_password") ||
        backendCode.includes("old_password") ||
        backendCode.includes("wrong_password") ||
        status === 401
      ) {
        toast.error(MSG17, { id: "change-password-msg17" });
      } else if (
        backendMessage.includes("same") ||
        backendMessage.includes("giong") ||
        backendMessage.includes("trùng") ||
        backendMessage.includes("must be different") ||
        backendCode.includes("same") ||
        backendCode.includes("different")
      ) {
        toast.error(MSG18, { id: "change-password-msg18" });
      } else if (
        backendMessage.includes("confirm") ||
        backendMessage.includes("khớp") ||
        backendMessage.includes("mismatch") ||
        backendMessage.includes("xac nhan") ||
        backendCode.includes("confirm") ||
        backendCode.includes("mismatch")
      ) {
        toast.error(MSG129, { id: "change-password-msg129" });
      } else if (status && status < 500) {
        toast.error(MSG17, { id: "change-password-msg17" });
      } else {
        toast.error("Đổi mật khẩu thất bại. Vui lòng thử lại.", {
          id: "change-password-generic",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const clearMessages = () => {
    setTimeout(() => {
      setSuccessMessage("");
      setErrorMessage("");
    }, 4000);
  };

  const handleProfileChange = (field, value) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading || isLoadingProfile) {
    return (
      <div className="profile-loading">
        <div className="spinner-large"></div>
        <p>Đang tải thông tin...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          <span>Quay lại</span>
        </button>
        <h1 className="page-title">Hồ Sơ Cá Nhân</h1>
        <div className="header-spacer"></div>
      </div>

      {/* Feedback messages */}
      {successMessage && (
        <div className="message success-message">
          <CheckCircle size={18} />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="message error-message">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Avatar Section */}
      <div className="profile-card">
        <div className="avatar-section">
          <div
            className="avatar-container"
            onClick={() => fileInputRef.current?.click()}
          >
            {avatarPreview || avatarUrl ? (
              <img
                src={avatarPreview || avatarUrl}
                alt="Avatar"
                className="avatar-image"
              />
            ) : (
              <div className="avatar-placeholder">
                <User size={48} strokeWidth={1.5} />
              </div>
            )}
            <div className="avatar-overlay">
              <Camera size={20} />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleAvatarChange}
              style={{ display: "none" }}
            />
          </div>
          <div className="avatar-info">
            <div className="avatar-name-wrapper">
              <h3 className="avatar-name">
                {profileData.fullName || "Người dùng"}
              </h3>
              <span className="role-badge">🏷️ {profileData.role || "—"}</span>
            </div>
            <p className="avatar-email">{profileData.email || "—"}</p>
            <p className="avatar-hint" style={{ marginTop: '8px' }}>Nhấn vào ảnh để thay đổi (Tối đa 5MB, JPG/PNG)</p>
          </div>
        </div>
      </div>

      {/* Personal Info Section */}
      <div className="profile-card">
        <h2 className="card-title">Thông tin cá nhân</h2>

        <div className="info-grid">
          <div className="info-item">
            <div className="info-label-compact">
              <span>👤 Họ và tên</span>
            </div>
            {isEditing ? (
              <input
                type="text"
                className="info-input"
                value={profileData.fullName}
                onChange={(e) =>
                  handleProfileChange("fullName", e.target.value)
                }
                placeholder="Nhập họ và tên"
              />
            ) : (
              <div className="info-value">{profileData.fullName || "—"}</div>
            )}
          </div>

          <div className="info-item">
            <div className="info-label-compact">
              <span>📞 Số điện thoại</span>
            </div>
            {isEditing ? (
              <input
                type="tel"
                className="info-input"
                value={profileData.phoneNumber}
                onChange={(e) =>
                  handleProfileChange("phoneNumber", e.target.value)
                }
                placeholder="Nhập số điện thoại"
              />
            ) : (
              <div className="info-value">{profileData.phoneNumber || "Chưa cập nhật"}</div>
            )}
          </div>

          <div className="info-item">
            <div className="info-label-compact">
              <span>✉️ Email</span>
            </div>
            <div className="info-value">{profileData.email || "Chưa cập nhật"}</div>
          </div>

          <div className="info-item">
            <div className="info-label-compact">
              <span>📅 Ngày sinh</span>
            </div>
            {isEditing ? (
              <input
                type="date"
                className="info-input"
                value={profileData.birthDate}
                onChange={(e) =>
                  handleProfileChange("birthDate", e.target.value)
                }
              />
            ) : (
              <div className="info-value">
                {profileData.birthDate
                  ? new Date(profileData.birthDate).toLocaleDateString("vi-VN")
                  : "Chưa cập nhật"}
              </div>
            )}
          </div>

          <div className="info-item" style={{ gridColumn: '1 / -1' }}>
            <div className="info-label-compact">
              <span>📍 Địa chỉ</span>
            </div>
            {isEditing ? (
              <input
                type="text"
                className="info-input"
                value={profileData.address}
                onChange={(e) => handleProfileChange("address", e.target.value)}
                placeholder="Nhập địa chỉ"
              />
            ) : (
              <div className="info-value">{profileData.address || "Chưa cập nhật"}</div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="action-buttons">
          {isEditing ? (
            <>
              <button
                className="btn btn-primary"
                onClick={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving ? (
                  <div className="spinner"></div>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Lưu thay đổi</span>
                  </>
                )}
              </button>
              <button className="btn btn-secondary" onClick={handleCancelEdit}>
                <X size={16} />
                <span>Hủy</span>
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-primary" onClick={handleEditProfile}>
                <Edit3 size={16} />
                <span>Chỉnh sửa thông tin</span>
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => navigate(PATH_COMMON.changePassword)}
              >
                <Lock size={16} />
                <span>Đổi mật khẩu</span>
              </button>
            </>
          )}
        </div>

        {!canChangePassword && (
          <p className="avatar-hint" style={{ marginTop: 10 }}>
            Tài khoản đăng nhập bằng Google chưa thiết lập mật khẩu cục bộ nên
            không thể đổi mật khẩu.
          </p>
        )}
      </div>

      {/* Change Password Section */}
      {showChangePassword && (
        <div className="profile-card password-card">
          <h2 className="card-title">Đổi mật khẩu</h2>
          <form onSubmit={handleChangePassword}>
            <div className="password-field">
              <label>Mật khẩu hiện tại</label>
              <div className="password-input-wrapper">
                <input
                  type={showOldPassword ? "text" : "password"}
                  value={passwordData.oldPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      oldPassword: e.target.value,
                    }))
                  }
                  placeholder="Nhập mật khẩu hiện tại"
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                >
                  {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="password-field">
              <label>Mật khẩu mới</label>
              <div className="password-input-wrapper">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="password-field">
              <label>Xác nhận mật khẩu mới</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  placeholder="Nhập lại mật khẩu mới"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <div className="password-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSaving}
              >
                {isSaving ? (
                  <div className="spinner"></div>
                ) : (
                  <>
                    <Lock size={16} />
                    <span>Xác nhận đổi mật khẩu</span>
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowChangePassword(false);
                  setPasswordData({
                    oldPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                }}
              >
                <X size={16} />
                <span>Hủy</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
