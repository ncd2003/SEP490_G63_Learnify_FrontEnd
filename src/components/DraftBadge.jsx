/**
 * DraftBadge Component
 * Displays a small badge showing pending draft count
 *
 * @param {Object} pendingSession - PendingSessionResponse from API
 * @param {function} onResume - Callback when user clicks to resume draft
 * @returns {JSX | null} Badge or null if no pending session
 */
export const DraftBadge = ({ pendingSession, onResume, showLabel = true }) => {
  if (!pendingSession?.hasPending) {
    return null;
  }

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onResume) {
      onResume(pendingSession);
    }
  };

  return (
    <button
      onClick={handleClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        borderRadius: "20px",
        backgroundColor: "#FFF3CD",
        border: "1px solid #FFE487",
        color: "#856404",
        fontSize: "12px",
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 0.2s ease",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = "#FFE487";
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = "#FFF3CD";
      }}
      title={`${pendingSession.itemCount} câu hỏi, lưu lúc ${new Date(pendingSession.lastSavedAt).toLocaleString("vi-VN")}`}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
      </svg>
      {showLabel && (
        <>
          <span>{pendingSession.itemCount} câu</span>
          <span>đang dở</span>
        </>
      )}
    </button>
  );
};
