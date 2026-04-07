import { useState } from "react";
import { createPortal } from "react-dom";
import { LogOut, X } from "lucide-react";

const MSG_CONFIRM = "Bạn có chắc chắn muốn đăng xuất?";

export default function LogoutDialog({ isOpen, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm?.();
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <>
      <div onClick={loading ? undefined : onClose} style={s.overlay}>
        <div style={s.dialog} onClick={(e) => e.stopPropagation()}>
          <button onClick={onClose} style={s.closeBtn} disabled={loading}>
            <X size={15} />
          </button>

          <div style={s.iconWrap}>
            <LogOut size={26} style={{ color: "#ef4444" }} />
          </div>

          <h3 style={s.title}>Xác nhận đăng xuất</h3>
          <p style={s.desc}>{MSG_CONFIRM}</p>

          <div style={s.actions}>
            <button onClick={onClose} disabled={loading} style={s.btnCancel}>
              Hủy
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              style={{
                ...s.btnConfirm,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? <span style={s.spinner} /> : <LogOut size={14} />}
              {loading ? "Đang xử lý..." : "Đồng ý"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes scaleIn { from { opacity:0; transform:scale(.93) translateY(10px) }
                             to   { opacity:1; transform:scale(1)  translateY(0)     } }
        @keyframes spin    { to { transform:rotate(360deg) } }
      `}</style>
    </>,
    document.body,
  );
}

const s = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,.45)",
    backdropFilter: "blur(4px)",
    zIndex: 2000,
    display: "grid",
    placeItems: "center",
    padding: 16,
    animation: "fadeIn .2s ease both",
  },
  dialog: {
    position: "relative",
    zIndex: 1000,
    background: "#fff",
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    width: "min(400px, 92vw)",
    padding: "36px 32px",
    textAlign: "center",
    boxShadow: "0 24px 60px rgba(0,0,0,.18)",
    animation: "scaleIn .25s ease both",
    fontFamily: "'Plus Jakarta Sans','Segoe UI',sans-serif",
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    background: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#9ca3af",
  },
  iconWrap: {
    width: 60,
    height: 60,
    background: "#fef2f2",
    border: "2px solid #fca5a5",
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
  },
  title: {
    fontSize: 18,
    fontWeight: 800,
    color: "#0f172a",
    letterSpacing: "-.3px",
    marginBottom: 10,
  },
  desc: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 1.7,
    marginBottom: 28,
  },
  actions: {
    display: "flex",
    gap: 12,
  },
  btnCancel: {
    flex: 1,
    padding: "12px 20px",
    border: "1.5px solid #e5e7eb",
    borderRadius: 10,
    background: "#fff",
    color: "#374151",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  btnConfirm: {
    flex: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    padding: "12px 20px",
    border: "none",
    borderRadius: 10,
    background: "linear-gradient(135deg,#ef4444,#dc2626)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "inherit",
    boxShadow: "0 4px 12px rgba(239,68,68,.3)",
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
