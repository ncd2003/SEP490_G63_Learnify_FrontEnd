import { useMemo, useState } from "react";
import { BookOpen } from "lucide-react";

const DEFAULT_LOGO_PATH = "/logo/learnify-logo.png";

const AppLogo = ({
  size = 36,
  alt = "Learnify logo",
  className = "",
  rounded = true,
  showFallbackBackground = true,
  imageScale = 1,
}) => {
  const [hasError, setHasError] = useState(false);

  const boxStyle = useMemo(
    () => ({
      width: size,
      height: size,
      borderRadius: rounded ? Math.max(8, Math.floor(size * 0.22)) : 0,
      overflow: "hidden",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: showFallbackBackground ? "#eff6ff" : "transparent",
      border: showFallbackBackground ? "1px solid #bfdbfe" : "none",
      flexShrink: 0,
    }),
    [rounded, showFallbackBackground, size],
  );

  return (
    <span className={className} style={boxStyle} aria-label={alt}>
      {hasError ? (
        <BookOpen size={Math.floor(size * 0.62)} strokeWidth={2.2} color="#2563eb" />
      ) : (
        <img
          src={DEFAULT_LOGO_PATH}
          alt={alt}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            transform: `scale(${imageScale})`,
            transformOrigin: "center",
          }}
          onError={() => setHasError(true)}
        />
      )}
    </span>
  );
};

export default AppLogo;
