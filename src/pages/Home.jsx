import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Users,
  ClipboardList,
  FileText,
  Calendar,
  BarChart2,
  Bell,
  ChevronRight,
  Menu,
  X,
  Mail,
  MapPin,
  Phone,
  Clock,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import LogoutDialog from "@/components/LogoutDialog";
import { PATH_AUTH, PATH_COMMON } from "@/routes/paths";

/* ── Feature cards — đúng theo wireframe ── */
const FEATURES = [
  {
    icon: Users,
    color: "#3b82f6",
    bg: "#eff6ff",
    title: "Quản lý Lớp học",
    desc: "Tạo và quản lý lớp học dễ dàng, thêm học sinh, phân công bài tập và theo dõi tiến độ học tập.",
  },
  {
    icon: ClipboardList,
    color: "#10b981",
    bg: "#ecfdf5",
    title: "Bài tập & Kiểm tra",
    desc: "Tạo bài tập, kiểm tra trực tuyến với nhiều dạng câu hỏi. Hệ thống tự động chấm điểm và thống kê kết quả.",
  },
  {
    icon: FileText,
    color: "#f59e0b",
    bg: "#fffbeb",
    title: "Tài liệu & Bài giảng",
    desc: "Chia sẻ tài liệu, bài giảng, video và các nguồn học liệu cho học sinh một cách nhanh chóng.",
  },
  {
    icon: Calendar,
    color: "#8b5cf6",
    bg: "#f5f3ff",
    title: "Lịch học",
    desc: "Quản lý lịch dạy và lịch học, nhận thông báo tự động về các buổi học sắp diễn ra.",
  },
  {
    icon: BarChart2,
    color: "#ec4899",
    bg: "#fdf2f8",
    title: "Bảng điểm",
    desc: "Theo dõi điểm số, đánh giá và báo cáo tiến độ học tập của từng học sinh.",
  },
  {
    icon: Bell,
    color: "#06b6d4",
    bg: "#ecfeff",
    title: "Thông báo",
    desc: "Nhận thông báo về bài tập mới, lịch học, tin nhắn và các hoạt động quan trọng trong lớp.",
  },
];

/* ── Illustration placeholder (replaces [IMAGE] in wireframe) ── */
function HeroIllustration() {
  return (
    <div style={s.heroIllus}>
      <div style={s.illustCard}>
        <div style={s.illustHeader}>
          <div style={{ ...s.illustDot, background: "#ef4444" }} />
          <div style={{ ...s.illustDot, background: "#f59e0b" }} />
          <div style={{ ...s.illustDot, background: "#10b981" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <div
              style={{ ...s.illustBar, width: 140, background: "#dbeafe" }}
            />
            <div style={{ ...s.illustBar, width: 80, background: "#bbf7d0" }} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div
              style={{ ...s.illustBar, width: 100, background: "#e9d5ff" }}
            />
            <div
              style={{ ...s.illustBar, width: 120, background: "#fde68a" }}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div
              style={{ ...s.illustBar, width: 160, background: "#dbeafe" }}
            />
            <div style={{ ...s.illustBar, width: 60, background: "#bbf7d0" }} />
          </div>
        </div>
        <div style={s.illustMini}>
          <div style={s.illustAvatar}>10A</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1e40af" }}>
              Lớp 10A1 · 38 học sinh
            </div>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 1 }}>
              Điểm danh hôm nay: 36/38
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════ */
export default function Homepage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!userMenuRef.current?.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  };

  const handleGoToProfile = () => {
    setUserMenuOpen(false);
    navigate(PATH_COMMON.profile);
  };

  const handleLogoutClick = () => {
    setUserMenuOpen(false);
    setMobileOpen(false);
    setIsLogoutDialogOpen(true);
  };

  const handleConfirmLogout = async () => {
    try {
      await logout();
      navigate(PATH_AUTH.login);
    } finally {
      setIsLogoutDialogOpen(false);
    }
  };

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <div style={s.root}>
      {/* ══ NAVBAR ══ */}
      <header
        style={{
          ...s.navbar,
          boxShadow: scrolled ? "0 1px 12px rgba(0,0,0,.08)" : "none",
        }}
      >
        <div style={s.navInner}>
          {/* Logo */}
          <div style={s.logo}>
            <div style={s.logoIcon}>
              <BookOpen size={18} strokeWidth={2.5} />
            </div>
            <span style={s.logoTxt}>Learnify</span>
          </div>

          {/* Desktop nav links */}
          <nav style={s.navLinks}>
            {["intro", "features", "contact"].map((id, i) => (
              <button key={id} onClick={() => scrollTo(id)} style={s.navLink}>
                {["Giới Thiệu", "Tính Năng", "Liên Hệ"][i]}
              </button>
            ))}
          </nav>

          {/* Auth buttons — BR-01 */}
          <div style={s.navAuth}>
            {isAuthenticated ? (
              <div style={s.userMenuWrap} ref={userMenuRef}>
                <Link to="/classrooms" style={s.btnNavPrimary}>
                  Vào Lớp học
                </Link>
                <button
                  type="button"
                  style={s.avatarSmall}
                  title={user?.fullName || "User"}
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                >
                  {initials}
                </button>
                {userMenuOpen && (
                  <div style={s.userMenuDropdown}>
                    <button
                      type="button"
                      style={s.userMenuItem}
                      onClick={handleGoToProfile}
                    >
                      Trang cá nhân
                    </button>
                    <button
                      type="button"
                      style={{ ...s.userMenuItem, ...s.userMenuDanger }}
                      onClick={handleLogoutClick}
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" style={s.btnNavGhost}>
                  Đăng nhập
                </Link>
                <Link to="/register" style={s.btnNavPrimary}>
                  Đăng ký
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen((p) => !p)} style={s.hamburger}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div style={s.mobileMenu}>
            {["intro", "features", "contact"].map((id, i) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                style={s.mobileLink}
              >
                {["Giới Thiệu", "Tính Năng", "Liên Hệ"][i]}
              </button>
            ))}
            <div style={{ display: "flex", gap: 10, padding: "12px 20px" }}>
              {isAuthenticated ? (
                <>
                  <Link
                    to="/classrooms"
                    style={{ ...s.btnNavPrimary, flex: 1, textAlign: "center" }}
                  >
                    Vào Lớp học
                  </Link>
                  <button
                    type="button"
                    style={{ ...s.btnNavGhost, flex: 1 }}
                    onClick={handleGoToProfile}
                  >
                    Trang cá nhân
                  </button>
                  <button
                    type="button"
                    style={{
                      ...s.btnNavGhost,
                      flex: 1,
                      color: "#dc2626",
                      borderColor: "#fecaca",
                    }}
                    onClick={handleLogoutClick}
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    style={{ ...s.btnNavGhost, flex: 1, textAlign: "center" }}
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    style={{ ...s.btnNavPrimary, flex: 1, textAlign: "center" }}
                  >
                    Đăng ký
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ══ SECTION 1: GIỚI THIỆU ══ */}
      <section id="intro" style={s.introSection}>
        <div style={s.container}>
          <h2 style={s.sectionTitle}>Giới Thiệu</h2>
          <div style={s.sectionDivider} />

          <div style={s.introGrid}>
            <div style={s.introText}>
              <p style={s.bodyText}>
                Learnify là nền tảng giáo dục trực tuyến hàng đầu, kết nối giáo
                viên và học sinh trong môi trường học tập hiện đại và hiệu quả.
                Với Learnify, bạn có thể tạo lớp học, quản lý bài tập, theo dõi
                tiến độ học tập và tương tác với học sinh mọi lúc, mọi nơi.
              </p>
              <p style={{ ...s.bodyText, marginTop: 16 }}>
                Hệ thống cung cấp đầy đủ công cụ để tổ chức lớp học trực tuyến,
                từ quản lý lịch học, tài liệu, bài giảng đến hệ thống kiểm tra
                và đánh giá toàn diện.
              </p>

              <div style={s.introCta}>
                <Link to="/login" style={s.btnPrimary}>
                  Bắt đầu miễn phí <ChevronRight size={16} />
                </Link>
                <button
                  onClick={() => scrollTo("features")}
                  style={s.btnOutline}
                >
                  Xem tính năng
                </button>
              </div>
            </div>

            <HeroIllustration />
          </div>
        </div>
      </section>

      {/* ══ SECTION 2: TÍNH NĂNG ══ */}
      <section id="features" style={{ ...s.section, background: "#f8fafc" }}>
        <div style={s.container}>
          <h2 style={s.sectionTitle}>Tính Năng</h2>
          <div style={s.sectionDivider} />

          <div style={s.featGrid}>
            {FEATURES.map(({ icon: Icon, color, bg, title, desc }) => (
              <div key={title} style={s.featCard}>
                <div style={{ ...s.featIconWrap, background: bg }}>
                  <Icon size={24} style={{ color }} />
                </div>
                <h3 style={s.featTitle}>{title}</h3>
                <p style={s.featDesc}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SECTION 3: LIÊN HỆ ══ */}
      <section id="contact" style={s.section}>
        <div style={s.container}>
          <h2 style={s.sectionTitle}>Liên Hệ</h2>
          <div style={s.sectionDivider} />

          <div style={s.contactGrid}>
            <div style={s.contactItem}>
              <div style={s.contactIcon}>
                <Mail size={15} style={{ color: "#3b82f6" }} />
              </div>
              <div>
                <div style={s.contactLbl}>Email</div>
                <div style={s.contactVal}>support@learnify.edu.vn</div>
              </div>
            </div>
            <div style={s.contactItem}>
              <div style={s.contactIcon}>
                <Phone size={15} style={{ color: "#3b82f6" }} />
              </div>
              <div>
                <div style={s.contactLbl}>Điện thoại</div>
                <div style={s.contactVal}>1900-xxxx</div>
              </div>
            </div>
            <div style={s.contactItem}>
              <div style={s.contactIcon}>
                <MapPin size={15} style={{ color: "#3b82f6" }} />
              </div>
              <div>
                <div style={s.contactLbl}>Địa chỉ</div>
                <div style={s.contactVal}>
                  123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh
                </div>
              </div>
            </div>
            <div style={s.contactItem}>
              <div style={s.contactIcon}>
                <Clock size={15} style={{ color: "#3b82f6" }} />
              </div>
              <div>
                <div style={s.contactLbl}>Giờ làm việc</div>
                <div style={s.contactVal}>Thứ 2 – Thứ 6: 8:00 – 17:00</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={s.footer}>
        <div style={s.container}>
          <div style={s.footerInner}>
            <div style={s.logo}>
              <div style={{ ...s.logoIcon, width: 28, height: 28 }}>
                <BookOpen size={14} strokeWidth={2.5} />
              </div>
              <span style={{ ...s.logoTxt, color: "#fff", fontSize: 15 }}>
                Learnify
              </span>
            </div>
            <span style={{ fontSize: 12, color: "#6b7280" }}>
              © 2024 Learnify. All rights reserved.
            </span>
            <div style={{ display: "flex", gap: 20 }}>
              <Link to={PATH_AUTH.terms} style={s.footerLink}>
                Điều khoản
              </Link>
              <Link to={PATH_AUTH.privacy} style={s.footerLink}>
                Chính sách
              </Link>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Plus Jakarta Sans','Segoe UI',sans-serif!important}
        html{scroll-behavior:smooth}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}

        @media (max-width: 900px){
          .desktop-only{display:none}
        }
      `}</style>

      <LogoutDialog
        isOpen={isLogoutDialogOpen}
        onClose={() => setIsLogoutDialogOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </div>
  );
}

/* ── Styles ── */
const s = {
  root: {
    fontFamily: "'Plus Jakarta Sans','Segoe UI',sans-serif",
    background: "#fff",
    color: "#0f172a",
    minHeight: "100vh",
  },
  navbar: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "rgba(255,255,255,0.96)",
    backdropFilter: "blur(10px)",
    borderBottom: "1px solid #f1f5f9",
    transition: "box-shadow .3s",
  },
  navInner: {
    maxWidth: 1080,
    margin: "0 auto",
    padding: "0 24px",
    height: 64,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: { display: "flex", alignItems: "center", gap: 9, flexShrink: 0 },
  logoIcon: {
    width: 34,
    height: 34,
    background: "linear-gradient(135deg,#1e3a8a,#3b82f6)",
    borderRadius: 9,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    boxShadow: "0 3px 10px rgba(59,130,246,.32)",
  },
  logoTxt: {
    fontSize: 17,
    fontWeight: 800,
    color: "#0f172a",
    letterSpacing: "-.4px",
  },
  navLinks: { display: "flex", gap: 4 },
  navLink: {
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "6px 14px",
    borderRadius: 7,
    fontFamily: "inherit",
    transition: "background .15s, color .15s",
  },
  navAuth: { display: "flex", alignItems: "center", gap: 8 },
  userMenuWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    position: "relative",
  },
  userMenuDropdown: {
    position: "absolute",
    top: "calc(100% + 10px)",
    right: 0,
    minWidth: 170,
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    boxShadow: "0 10px 24px rgba(15,23,42,.12)",
    background: "#fff",
    padding: 6,
    display: "flex",
    flexDirection: "column",
    gap: 4,
    zIndex: 120,
  },
  userMenuItem: {
    width: "100%",
    border: "none",
    background: "transparent",
    textAlign: "left",
    borderRadius: 8,
    padding: "9px 10px",
    fontSize: 13,
    fontWeight: 600,
    color: "#111827",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  userMenuDanger: { color: "#dc2626" },
  btnNavGhost: {
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
    textDecoration: "none",
    padding: "7px 14px",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
  },
  btnNavPrimary: {
    fontSize: 13,
    fontWeight: 700,
    color: "#fff",
    textDecoration: "none",
    padding: "8px 18px",
    background: "linear-gradient(135deg,#3b82f6,#1e3a8a)",
    borderRadius: 8,
    boxShadow: "0 3px 10px rgba(59,130,246,.3)",
  },
  avatarSmall: {
    width: 32,
    height: 32,
    background: "linear-gradient(135deg,#1e3a8a,#3b82f6)",
    borderRadius: "50%",
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    cursor: "pointer",
  },
  hamburger: {
    display: "none",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#374151",
    padding: 6,
  },
  mobileMenu: {
    background: "#fff",
    borderTop: "1px solid #f1f5f9",
    display: "flex",
    flexDirection: "column",
  },
  mobileLink: {
    padding: "14px 20px",
    fontSize: 14,
    fontWeight: 600,
    color: "#374151",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontFamily: "inherit",
    textAlign: "left",
    borderBottom: "1px solid #f1f5f9",
  },
  container: { maxWidth: 1080, margin: "0 auto", padding: "0 24px" },
  introSection: { padding: "72px 0 64px", background: "#fff" },
  section: { padding: "64px 0" },
  sectionTitle: {
    fontSize: 26,
    fontWeight: 800,
    color: "#0f172a",
    letterSpacing: "-.5px",
    marginBottom: 10,
  },
  sectionDivider: {
    height: 2,
    background: "#e5e7eb",
    marginBottom: 36,
    borderRadius: 2,
  },
  introGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 340px",
    gap: 56,
    alignItems: "center",
  },
  introText: {},
  bodyText: { fontSize: 15, color: "#374151", lineHeight: 1.8 },
  introCta: { display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" },
  btnPrimary: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "12px 24px",
    background: "linear-gradient(135deg,#3b82f6,#1e3a8a)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
    borderRadius: 10,
    textDecoration: "none",
    boxShadow: "0 4px 14px rgba(59,130,246,.3)",
  },
  btnOutline: {
    display: "inline-flex",
    alignItems: "center",
    padding: "12px 24px",
    border: "1.5px solid #e5e7eb",
    color: "#374151",
    fontSize: 14,
    fontWeight: 600,
    borderRadius: 10,
    background: "#fff",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  heroIllus: {},
  illustCard: {
    background: "#f8fafc",
    border: "1.5px solid #e5e7eb",
    borderRadius: 14,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 14,
    animation: "floatY 4s ease-in-out infinite",
  },
  illustHeader: { display: "flex", gap: 6 },
  illustDot: { width: 10, height: 10, borderRadius: "50%" },
  illustBar: { height: 10, borderRadius: 6 },
  illustMini: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "#eff6ff",
    borderRadius: 9,
    padding: "10px 12px",
  },
  illustAvatar: {
    width: 28,
    height: 28,
    background: "#3b82f6",
    borderRadius: "50%",
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  featGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: 20,
  },
  featCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: "24px 20px",
    transition: "box-shadow .2s, transform .2s",
  },
  featIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  featTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 8,
  },
  featDesc: { fontSize: 13, color: "#6b7280", lineHeight: 1.65 },
  contactGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
  },
  contactItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "16px 18px",
  },
  contactIcon: {
    width: 34,
    height: 34,
    background: "#eff6ff",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  contactLbl: {
    fontSize: 11,
    fontWeight: 700,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: ".4px",
    marginBottom: 4,
  },
  contactVal: { fontSize: 13, color: "#374151", fontWeight: 500 },
  footer: { background: "#0f172a", padding: "22px 0" },
  footerInner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerLink: { fontSize: 12, color: "#6b7280", textDecoration: "none" },
};
