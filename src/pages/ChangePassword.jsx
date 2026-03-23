import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Eye,
  EyeOff,
  Check,
  X,
  Lock,
  CheckCircle2,
  Shield,
  User,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { userApi } from "@/apis/user.api";
import { PATH_AUTH, PATH_COMMON } from "@/routes/paths";

const MSG16 =
  "Mật khẩu đã được cập nhật. Tất cả các phiên đăng nhập đã bị xóa. Vui lòng đăng nhập lại.";
const MSG17 = "Mật khẩu hiện tại bạn nhập không chính xác.";
const MSG18 = "Mật khẩu mới không được trùng với mật khẩu hiện tại của bạn.";
const MSG129 = "Mật khẩu mới và xác nhận mật khẩu chưa khớp.";
const MSG_BR17 =
  "Mật khẩu mới phải có tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt (!@#$%^&*).";

const REQUIREMENTS = [
  {
    id: "len",
    label: "Độ dài tối thiểu: 8 ký tự",
    test: (p) => p.length >= 8,
  },
  {
    id: "upper",
    label: "Phải chứa ít nhất 1 chữ hoa",
    test: (p) => /[A-Z]/.test(p),
  },
  {
    id: "lower",
    label: "Phải chứa ít nhất 1 chữ thường",
    test: (p) => /[a-z]/.test(p),
  },
  {
    id: "digit",
    label: "Phải chứa ít nhất 1 chữ số",
    test: (p) => /[0-9]/.test(p),
  },
  {
    id: "special",
    label: "Phải chứa ít nhất 1 ký tự đặc biệt (!@#$%^&*)",
    test: (p) => /[!@#$%^&*]/.test(p),
  },
];

const getStrength = (password) => {
  if (!password) return 0;
  return REQUIREMENTS.filter((r) => r.test(password)).length;
};

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

const StrengthBar = ({ strength }) => {
  const colors = [
    "#e5e7eb",
    "#ef4444",
    "#f59e0b",
    "#f59e0b",
    "#3b82f6",
    "#10b981",
  ];
  const labels = ["", "Rất yếu", "Yếu", "Trung bình", "Mạnh", "Rất mạnh"];

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 5 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 4,
              background: strength >= i ? colors[strength] : "#e5e7eb",
              transition: "background .3s",
            }}
          />
        ))}
      </div>
      {strength > 0 && (
        <span
          style={{ fontSize: 11, fontWeight: 700, color: colors[strength] }}
        >
          {labels[strength]}
        </span>
      )}
    </div>
  );
};

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [form, setForm] = useState({
    current: "",
    newPass: "",
    confirm: "",
  });
  const [show, setShow] = useState({
    current: false,
    newPass: false,
    confirm: false,
  });
  const [focused, setFocused] = useState(null);
  const [loading, setLoading] = useState(false);

  const isGoogleUser = useMemo(() => {
    const provider =
      `${user?.provider || user?.authProvider || user?.loginProvider || ""}`.toLowerCase();
    return provider.includes("google") || user?.isSocialLogin === true;
  }, [user]);

  const hasLocalPassword = user?.hasLocalPassword !== false;
  const canChangePassword = !isGoogleUser || hasLocalPassword;

  const setField = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
  };

  const toggleShow = (k) => setShow((p) => ({ ...p, [k]: !p[k] }));

  const strength = getStrength(form.newPass);

  const validate = () => {
    if (!form.current) return "Vui lòng nhập mật khẩu hiện tại";
    if (!form.newPass) return "Vui lòng nhập mật khẩu mới";
    if (!form.confirm) return "Vui lòng xác nhận mật khẩu mới";

    if (!isPasswordCompliant(form.newPass)) return MSG_BR17;
    if (form.current === form.newPass) return MSG18;
    if (form.confirm !== form.newPass) return MSG129;

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canChangePassword) {
      toast.error(
        "Tài khoản Google chưa thiết lập mật khẩu cục bộ nên không thể đổi mật khẩu.",
        { id: "change-password-disabled" },
      );
      return;
    }

    const validationMessage = validate();
    if (validationMessage) {
      if (validationMessage === MSG18) {
        toast.error(MSG18, { id: "change-password-msg18" });
      } else if (validationMessage === MSG129) {
        toast.error(MSG129, { id: "change-password-msg129" });
      } else {
        toast.error(validationMessage, { id: "change-password-validation" });
      }
      return;
    }

    setLoading(true);
    try {
      await userApi.changePassword({
        oldPassword: form.current,
        newPassword: form.newPass,
        confirmPassword: form.confirm,
      });

      toast.success(MSG16, { id: "change-password-msg16" });
      await logout();
      navigate(PATH_AUTH.login, { replace: true });
    } catch (error) {
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
        backendMessage.includes("trung") ||
        backendMessage.includes("must be different") ||
        backendCode.includes("same") ||
        backendCode.includes("different")
      ) {
        toast.error(MSG18, { id: "change-password-msg18" });
      } else if (
        backendMessage.includes("confirm") ||
        backendMessage.includes("mismatch") ||
        backendMessage.includes("khop") ||
        backendMessage.includes("xac nhan") ||
        backendCode.includes("confirm") ||
        backendCode.includes("mismatch")
      ) {
        toast.error(MSG129, { id: "change-password-msg129" });
      } else if (status && status < 500) {
        // For this endpoint, FE already validates mismatch/same-password cases.
        // Remaining 4xx errors are most likely wrong current password.
        toast.error(MSG17, { id: "change-password-msg17" });
      } else {
        toast.error("Đổi mật khẩu thất bại. Vui lòng thử lại.", {
          id: "change-password-generic",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setForm({ current: "", newPass: "", confirm: "" });
  };

  const inp = (k) => ({
    ...s.input,
    ...(focused === k ? s.inputFocus : {}),
  });

  return (
    <div style={s.root}>
      <div style={s.pageWrap}>
        <aside style={s.sidebar}>
          <div style={s.sidebarTitle}>Tài khoản</div>
          <Link to={PATH_COMMON.profile} style={s.sidebarItem}>
            <User size={16} />
            <span>Hồ sơ cá nhân</span>
          </Link>
          <div style={{ ...s.sidebarItem, ...s.sidebarItemActive }}>
            <KeyRound size={16} />
            <span>Đổi mật khẩu</span>
          </div>
        </aside>

        <main style={s.main}>
          <nav style={s.crumb}>
            <Link to={PATH_COMMON.profile} style={s.crumbLink}>
              Tài khoản
            </Link>
            <ChevronRight size={12} style={{ margin: "0 4px", opacity: 0.4 }} />
            <span style={{ color: "#9ca3af" }}>Đổi mật khẩu</span>
          </nav>

          <div style={s.pgHead}>
            <div style={s.pgIcon}>
              <Lock size={22} />
            </div>
            <div>
              <h1 style={s.pgTitle}>Đổi Mật Khẩu</h1>
              <p style={s.pgSub}>
                Cập nhật mật khẩu để bảo vệ tài khoản của bạn
              </p>
            </div>
          </div>

          {!canChangePassword && (
            <div style={{ ...s.alert, ...s.alertErr }}>
              <X size={17} style={{ color: "#dc2626", flexShrink: 0 }} />
              <div>
                <strong style={{ color: "#b91c1c" }}>
                  Không thể đổi mật khẩu
                </strong>
                <p style={s.alertTxt}>
                  Tài khoản Google chưa thiết lập mật khẩu cục bộ nên không thể
                  đổi mật khẩu.
                </p>
              </div>
            </div>
          )}

          <div style={s.card}>
            <div style={s.sectionTitle}>
              <Shield size={15} style={{ color: "#3b82f6" }} />
              Yêu cầu mật khẩu
            </div>
            <ul
              style={{
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {REQUIREMENTS.map((r) => {
                const met = r.test(form.newPass);
                return (
                  <li
                    key={r.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: 13,
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: met ? "#ecfdf5" : "#f1f5f9",
                        border: `1.5px solid ${met ? "#6ee7b7" : "#e5e7eb"}`,
                        flexShrink: 0,
                        transition: "all .2s",
                      }}
                    >
                      {met ? (
                        <Check
                          size={10}
                          strokeWidth={3}
                          style={{ color: "#10b981" }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: "#d1d5db",
                          }}
                        />
                      )}
                    </div>
                    <span
                      style={{
                        color: met ? "#15803d" : "#6b7280",
                        fontWeight: met ? 600 : 400,
                        transition: "color .2s",
                      }}
                    >
                      {r.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div style={s.card}>
            <div style={s.sectionTitle}>
              <Lock size={15} style={{ color: "#3b82f6" }} />
              Thông tin mật khẩu
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div style={s.field}>
                <label style={s.lbl}>
                  Mật khẩu hiện tại: <span style={s.req}>*</span>
                </label>
                <div style={s.pwWrap}>
                  <input
                    type={show.current ? "text" : "password"}
                    value={form.current}
                    onChange={(e) => setField("current", e.target.value)}
                    onFocus={() => setFocused("current")}
                    onBlur={() => setFocused(null)}
                    placeholder="Nhập mật khẩu hiện tại"
                    style={{ ...inp("current"), paddingRight: 42 }}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShow("current")}
                    style={s.eyeBtn}
                  >
                    {show.current ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={s.field}>
                <label style={s.lbl}>
                  Mật khẩu mới: <span style={s.req}>*</span>
                </label>
                <div style={s.pwWrap}>
                  <input
                    type={show.newPass ? "text" : "password"}
                    value={form.newPass}
                    onChange={(e) => setField("newPass", e.target.value)}
                    onFocus={() => setFocused("newPass")}
                    onBlur={() => setFocused(null)}
                    placeholder="Nhập mật khẩu mới"
                    style={{ ...inp("newPass"), paddingRight: 42 }}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShow("newPass")}
                    style={s.eyeBtn}
                  >
                    {show.newPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {form.newPass && <StrengthBar strength={strength} />}
                <span style={s.helpTxt}>
                  Mật khẩu phải đáp ứng các yêu cầu bên trên
                </span>
              </div>

              <div style={s.field}>
                <label style={s.lbl}>
                  Xác nhận mật khẩu mới: <span style={s.req}>*</span>
                </label>
                <div style={s.pwWrap}>
                  <input
                    type={show.confirm ? "text" : "password"}
                    value={form.confirm}
                    onChange={(e) => setField("confirm", e.target.value)}
                    onFocus={() => setFocused("confirm")}
                    onBlur={() => setFocused(null)}
                    placeholder="Nhập lại mật khẩu mới"
                    style={{ ...inp("confirm"), paddingRight: 42 }}
                  />
                  <button
                    type="button"
                    onClick={() => toggleShow("confirm")}
                    style={s.eyeBtn}
                  >
                    {show.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={s.actions}>
                <button
                  type="submit"
                  disabled={loading || !canChangePassword}
                  style={{
                    ...s.btnPrimary,
                    opacity: loading || !canChangePassword ? 0.7 : 1,
                    cursor:
                      loading || !canChangePassword ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? (
                    <span style={s.spinner} />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  {loading ? "Đang xử lý..." : "Cập nhật mật khẩu"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  style={s.btnSecondary}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans','Segoe UI',sans-serif!important}
        input[type=password]::-ms-reveal{display:none}
        input::placeholder{color:#c4cdd8}
        @keyframes spin{to{transform:rotate(360deg)}}

        @media (max-width: 980px){
          .change-password-wrap{grid-template-columns:1fr !important}
        }
      `}</style>
    </div>
  );
}

const s = {
  root: {
    fontFamily: "'Plus Jakarta Sans','Segoe UI',sans-serif",
    background: "#f1f4f9",
    minHeight: "100vh",
    color: "#111",
    padding: "24px",
  },
  pageWrap: {
    maxWidth: 1160,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "240px 1fr",
    gap: 20,
  },
  sidebar: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 14,
    height: "fit-content",
  },
  sidebarTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: ".4px",
    marginBottom: 10,
  },
  sidebarItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    textDecoration: "none",
    color: "#334155",
    fontSize: 14,
    fontWeight: 600,
    padding: "10px 12px",
    borderRadius: 10,
  },
  sidebarItemActive: {
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
  },
  main: { minWidth: 0 },
  crumb: {
    display: "flex",
    alignItems: "center",
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 16,
  },
  crumbLink: {
    color: "#3b82f6",
    fontWeight: 600,
    textDecoration: "none",
  },
  pgHead: { display: "flex", alignItems: "center", gap: 12, marginBottom: 20 },
  pgIcon: {
    width: 44,
    height: 44,
    background: "linear-gradient(135deg,#1e3a8a,#3b82f6)",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    boxShadow: "0 4px 14px rgba(59,130,246,.25)",
    flexShrink: 0,
  },
  pgTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: "#0f172a",
    letterSpacing: "-.4px",
  },
  pgSub: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  alert: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: "12px 14px",
    borderRadius: 10,
    border: "1px solid",
    marginBottom: 16,
  },
  alertErr: { background: "#fef2f2", borderColor: "#fca5a5" },
  alertTxt: { fontSize: 13, margin: "2px 0 0", color: "#374151" },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: "24px 26px",
    marginBottom: 16,
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 15,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 18,
    paddingBottom: 12,
    borderBottom: "1px solid #e5e7eb",
  },
  field: { marginBottom: 20 },
  lbl: {
    display: "block",
    fontSize: 13,
    fontWeight: 700,
    color: "#374151",
    marginBottom: 8,
  },
  req: { color: "#ef4444" },
  helpTxt: {
    display: "block",
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 5,
    fontStyle: "italic",
  },
  errTxt: {
    display: "block",
    fontSize: 12,
    color: "#ef4444",
    fontWeight: 600,
    marginTop: 5,
  },
  pwWrap: { position: "relative" },
  input: {
    width: "100%",
    padding: "11px 13px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 14,
    color: "#111",
    background: "#fff",
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color .2s, box-shadow .2s",
  },
  inputFocus: {
    borderColor: "#3b82f6",
    boxShadow: "0 0 0 3px rgba(59,130,246,.12)",
  },
  inputErr: { borderColor: "#f87171", background: "#fff7f7" },
  eyeBtn: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#9ca3af",
    display: "flex",
    alignItems: "center",
    padding: 2,
  },
  actions: { display: "flex", gap: 10, paddingTop: 8 },
  btnPrimary: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "12px 24px",
    border: "none",
    borderRadius: 9,
    background: "linear-gradient(135deg,#3b82f6,#1e3a8a)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "inherit",
    boxShadow: "0 3px 12px rgba(59,130,246,.3)",
  },
  btnSecondary: {
    padding: "12px 22px",
    border: "1px solid #d1d5db",
    borderRadius: 9,
    background: "#fff",
    color: "#111",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  spinner: {
    display: "inline-block",
    width: 15,
    height: 15,
    border: "2.5px solid rgba(255,255,255,.35)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin .7s linear infinite",
  },
};
