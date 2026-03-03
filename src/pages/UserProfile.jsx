import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import userApi from "../apis/userApi";
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
  const roleMap = {
    STUDENT: "Học sinh",
    TEACHER: "Giáo viên",
    ADMIN: "Quản trị viên",
  };
  return roleMap[role] || role || "Học sinh";
};

const UserProfile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();
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

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
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
          phoneNumber: data.phoneNumber || "",
          birthDate: data.birthDate || "",
          address: data.address || "",
          role: mapRole(data.role),
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
        const response = await userApi.updateProfile(
          {
            fullName: profileData.fullName,
            phoneNumber: profileData.phoneNumber,
            birthDate: profileData.birthDate,
            address: profileData.address,
          },
          file,
        );
        const updated = response.result;
        if (updated?.avatarUrl) setAvatarUrl(updated.avatarUrl);
        setAvatarFile(null);
        setSuccessMessage("Cập nhật ảnh đại diện thành công!");
        clearMessages();
      } catch (error) {
        console.error("Avatar upload failed:", error);
        setErrorMessage(
          error.response?.data?.message || "Upload ảnh thất bại. Vui lòng thử lại.",
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
      const response = await userApi.updateProfile(
        {
          fullName: profileData.fullName,
          phoneNumber: profileData.phoneNumber,
          birthDate: profileData.birthDate,
          address: profileData.address,
        },
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
          role: mapRole(updated.role) || profileData.role,
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
        error.response?.data?.message || "Cập nhật thất bại. Vui lòng thử lại."
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

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setErrorMessage("Mật khẩu mới phải có ít nhất 8 ký tự");
      return;
    }

    setIsSaving(true);

    try {
      await userApi.changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });
      setSuccessMessage("Đổi mật khẩu thành công!");
      setShowChangePassword(false);
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      clearMessages();
    } catch (error) {
      console.error("Change password failed:", error);
      setErrorMessage(
        error.response?.data?.message || "Đổi mật khẩu thất bại. Vui lòng thử lại."
      );
      clearMessages();
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
        <style>{profileStyles}</style>
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
          <div className="avatar-container" onClick={() => fileInputRef.current?.click()}>
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
            <h3 className="avatar-name">{profileData.fullName || "Người dùng"}</h3>
            <p className="avatar-hint">Ảnh đại diện</p>
            <p className="avatar-hint">Kích thước tối đa: 5MB</p>
            <p className="avatar-hint">Định dạng: JPG, PNG</p>
          </div>
        </div>
      </div>

      {/* Personal Info Section */}
      <div className="profile-card">
        <h2 className="card-title">Thông tin cá nhân</h2>

        <div className="info-grid">
          {/* Họ và tên */}
          <div className="info-row">
            <div className="info-label">
              <User size={16} />
              <span>Họ và tên:</span>
            </div>
            {isEditing ? (
              <input
                type="text"
                className="info-input"
                value={profileData.fullName}
                onChange={(e) => handleProfileChange("fullName", e.target.value)}
                placeholder="Nhập họ và tên"
              />
            ) : (
              <div className="info-value">{profileData.fullName || "—"}</div>
            )}
          </div>

          {/* Email (read-only) */}
          <div className="info-row">
            <div className="info-label">
              <Mail size={16} />
              <span>Email:</span>
            </div>
            <div className="info-value">{profileData.email || "—"}</div>
          </div>

          {/* Số điện thoại */}
          <div className="info-row">
            <div className="info-label">
              <Phone size={16} />
              <span>Số điện thoại:</span>
            </div>
            {isEditing ? (
              <input
                type="tel"
                className="info-input"
                value={profileData.phoneNumber}
                onChange={(e) => handleProfileChange("phoneNumber", e.target.value)}
                placeholder="Nhập số điện thoại"
              />
            ) : (
              <div className="info-value">{profileData.phoneNumber || "—"}</div>
            )}
          </div>

          {/* Ngày sinh */}
          <div className="info-row">
            <div className="info-label">
              <Calendar size={16} />
              <span>Ngày sinh:</span>
            </div>
            {isEditing ? (
              <input
                type="date"
                className="info-input"
                value={profileData.birthDate}
                onChange={(e) => handleProfileChange("birthDate", e.target.value)}
              />
            ) : (
              <div className="info-value">
                {profileData.birthDate
                  ? new Date(profileData.birthDate).toLocaleDateString("vi-VN")
                  : "—"}
              </div>
            )}
          </div>

          {/* Địa chỉ */}
          <div className="info-row">
            <div className="info-label">
              <MapPin size={16} />
              <span>Địa chỉ:</span>
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
              <div className="info-value">{profileData.address || "—"}</div>
            )}
          </div>

          {/* Vai trò (read-only) */}
          <div className="info-row">
            <div className="info-label">
              <Shield size={16} />
              <span>Vai trò:</span>
            </div>
            <div className="info-value role-badge">{profileData.role || "—"}</div>
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
                onClick={() => {
                  setShowChangePassword(!showChangePassword);
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
              >
                <Lock size={16} />
                <span>Đổi mật khẩu</span>
              </button>
            </>
          )}
        </div>
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
                    setPasswordData((prev) => ({ ...prev, oldPassword: e.target.value }))
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
                    setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
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
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="password-actions">
              <button type="submit" className="btn btn-primary" disabled={isSaving}>
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
                  setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
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
