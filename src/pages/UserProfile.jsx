import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import userApi from "../apis/userApi";
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
    phone: "",
    dateOfBirth: "",
    address: "",
    role: "",
  });
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null); // actual File object for upload
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

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
        setProfileData({
          fullName: data.fullName || "",
          email: data.email || "",
          phone: data.phone || "",
          dateOfBirth: data.dateOfBirth || "",
          address: data.address || "",
          role: mapRole(data.role),
        });
        setAvatarUrl(data.avatarUrl || null);
      } catch (error) {
        console.error("Failed to load profile:", error);
        // Fallback to AuthContext data
        if (user) {
          setProfileData({
            fullName: user.fullName || "",
            email: user.email || "",
            phone: user.phone || "",
            dateOfBirth: user.dateOfBirth || "",
            address: user.address || "",
            role: mapRole(user.role),
          });
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
            phone: profileData.phone,
            dateOfBirth: profileData.dateOfBirth,
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
    // Reload original data
    if (user) {
      setProfileData((prev) => ({
        ...prev,
        fullName: user.fullName || prev.fullName,
        phone: user.phone || prev.phone,
        dateOfBirth: user.dateOfBirth || prev.dateOfBirth,
        address: user.address || prev.address,
      }));
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
          phone: profileData.phone,
          dateOfBirth: profileData.dateOfBirth,
          address: profileData.address,
        },
        avatarFile, // null nếu không chọn ảnh mới
      );
      const updated = response.result;
      // Sync lại avatar URL từ server nếu có
      if (updated?.avatarUrl) setAvatarUrl(updated.avatarUrl);
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
                value={profileData.phone}
                onChange={(e) => handleProfileChange("phone", e.target.value)}
                placeholder="Nhập số điện thoại"
              />
            ) : (
              <div className="info-value">{profileData.phone || "—"}</div>
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
                value={profileData.dateOfBirth}
                onChange={(e) => handleProfileChange("dateOfBirth", e.target.value)}
              />
            ) : (
              <div className="info-value">
                {profileData.dateOfBirth
                  ? new Date(profileData.dateOfBirth).toLocaleDateString("vi-VN")
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

      <style>{profileStyles}</style>
    </div>
  );
};

const profileStyles = `
  .profile-page {
    min-height: 100vh;
    background: #f5f7fa;
    padding: 24px;
    max-width: 800px;
    margin: 0 auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .profile-loading {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    color: #666;
    font-size: 15px;
  }

  .spinner-large {
    width: 40px;
    height: 40px;
    border: 4px solid #e0e0e0;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Header */
  .profile-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
  }

  .back-button {
    display: flex;
    align-items: center;
    gap: 8px;
    background: none;
    border: none;
    color: #3b82f6;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    padding: 8px 12px;
    border-radius: 8px;
    transition: all 0.2s;
  }

  .back-button:hover {
    background: rgba(59, 130, 246, 0.1);
  }

  .page-title {
    font-size: 24px;
    font-weight: 700;
    color: #1a1a1a;
    letter-spacing: -0.3px;
  }

  .header-spacer {
    width: 100px;
  }

  /* Feedback messages */
  .message {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    border-radius: 10px;
    font-size: 14px;
    margin-bottom: 16px;
    animation: slideDown 0.3s ease-out;
  }

  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .success-message {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #16a34a;
  }

  .error-message {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
  }

  /* Cards */
  .profile-card {
    background: white;
    border-radius: 16px;
    padding: 28px;
    margin-bottom: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06);
    border: 1px solid #e8ecf1;
    animation: fadeIn 0.5s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .card-title {
    font-size: 18px;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 24px;
    padding-bottom: 12px;
    border-bottom: 2px solid #f0f0f0;
  }

  /* Avatar Section */
  .avatar-section {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  .avatar-container {
    position: relative;
    width: 120px;
    height: 120px;
    border-radius: 16px;
    overflow: hidden;
    cursor: pointer;
    flex-shrink: 0;
    border: 3px solid #e8ecf1;
    transition: border-color 0.3s;
  }

  .avatar-container:hover {
    border-color: #3b82f6;
  }

  .avatar-container:hover .avatar-overlay {
    opacity: 1;
  }

  .avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .avatar-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f0f4f8;
    color: #94a3b8;
  }

  .avatar-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    opacity: 0;
    transition: opacity 0.3s;
  }

  .avatar-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .avatar-name {
    font-size: 20px;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 4px;
  }

  .avatar-hint {
    font-size: 13px;
    color: #94a3b8;
    margin: 0;
  }

  /* Info Grid */
  .info-grid {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .info-row {
    display: flex;
    align-items: center;
    padding: 16px 0;
    border-bottom: 1px solid #f0f0f0;
  }

  .info-row:last-child {
    border-bottom: none;
  }

  .info-label {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 160px;
    min-width: 160px;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
  }

  .info-label svg {
    color: #6b7280;
    flex-shrink: 0;
  }

  .info-value {
    flex: 1;
    font-size: 15px;
    color: #4b5563;
    padding: 10px 14px;
    background: #f9fafb;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    min-height: 42px;
    display: flex;
    align-items: center;
  }

  .role-badge {
    display: inline-flex;
    background: #eff6ff;
    color: #2563eb;
    border-color: #bfdbfe;
    font-weight: 500;
    width: auto;
    flex: unset;
  }

  .info-input {
    flex: 1;
    font-size: 15px;
    color: #1a1a1a;
    padding: 10px 14px;
    background: white;
    border-radius: 8px;
    border: 2px solid #3b82f6;
    min-height: 42px;
    outline: none;
    transition: all 0.2s;
    font-family: inherit;
  }

  .info-input:focus {
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
  }

  .info-input::placeholder {
    color: #9ca3af;
  }

  /* Action Buttons */
  .action-buttons {
    display: flex;
    gap: 12px;
    margin-top: 28px;
    padding-top: 20px;
    border-top: 2px solid #f0f0f0;
  }

  .btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: 2px solid transparent;
  }

  .btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .btn-primary {
    background: linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%);
    color: white;
    border-color: transparent;
  }

  .btn-primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);
  }

  .btn-secondary {
    background: white;
    color: #374151;
    border-color: #d1d5db;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #f9fafb;
    border-color: #9ca3af;
  }

  .spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  /* Change Password Card */
  .password-card {
    animation: slideDown 0.3s ease-out;
  }

  .password-field {
    margin-bottom: 20px;
  }

  .password-field label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .password-input-wrapper {
    position: relative;
  }

  .password-input-wrapper input {
    width: 100%;
    padding: 12px 44px 12px 14px;
    border: 2px solid #e0e0e0;
    border-radius: 10px;
    font-size: 15px;
    color: #1a1a1a;
    transition: all 0.2s;
    background: white;
    font-family: inherit;
  }

  .password-input-wrapper input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
  }

  .toggle-password {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    transition: color 0.2s;
  }

  .toggle-password:hover {
    color: #3b82f6;
  }

  .password-actions {
    display: flex;
    gap: 12px;
    margin-top: 24px;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .profile-page {
      padding: 16px;
    }

    .page-title {
      font-size: 20px;
    }

    .header-spacer {
      display: none;
    }

    .avatar-section {
      flex-direction: column;
      text-align: center;
    }

    .avatar-info {
      align-items: center;
    }

    .info-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    .info-label {
      width: 100%;
    }

    .info-value,
    .info-input {
      width: 100%;
    }

    .action-buttons,
    .password-actions {
      flex-direction: column;
    }

    .btn {
      justify-content: center;
    }

    .profile-card {
      padding: 20px;
    }
  }
`;

export default UserProfile;
