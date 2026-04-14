import AppLogo from "@/components/AppLogo";

const LogoLoading = ({ message = "Dang tai du lieu..." }) => {
  return (
    <div style={styles.wrapper}>
      <div style={styles.stack}>
        <div style={styles.logoRing}>
          <AppLogo size={72} rounded={false} showFallbackBackground={false} />
        </div>
        <div style={styles.spinner} />
      </div>
      <p style={styles.message}>{message}</p>
    </div>
  );
};

const spinKeyframes = `@keyframes logo-loading-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;

if (typeof document !== "undefined" && !document.getElementById("logo-loading-keyframes")) {
  const style = document.createElement("style");
  style.id = "logo-loading-keyframes";
  style.textContent = spinKeyframes;
  document.head.appendChild(style);
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#ffffff",
    gap: 18,
    padding: 20,
  },
  stack: {
    position: "relative",
    width: 92,
    height: 92,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoRing: {
    width: 72,
    height: 72,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  spinner: {
    position: "absolute",
    inset: 0,
    borderRadius: "50%",
    border: "4px solid #dbeafe",
    borderTopColor: "#2563eb",
    animation: "logo-loading-spin 0.9s linear infinite",
  },
  message: {
    margin: 0,
    color: "#334155",
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: 0.2,
  },
};

export default LogoLoading;
