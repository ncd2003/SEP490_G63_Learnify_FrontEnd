import "@/assets/css/components/pagination.css";

/**
 * Reusable Pagination Component
 * 
 * @param {Object} props
 * @param {number} props.page - Current page number
 * @param {number} props.totalPages - Total number of pages
 * @param {boolean} [props.loading=false] - Loading state
 * @param {(page: number) => void} props.onPageChange - Callback when page changes
 * @param {string} [props.className="classroom-pagination"] - CSS class name
 * @returns {JSX.Element}
 * 
 * @example
 * const [page, setPage] = useState(1);
 * <Pagination 
 *   page={page}
 *   totalPages={paging.totalPages}
 *   loading={loading}
 *   onPageChange={setPage}
 * />
 */
const Pagination = ({
  page,
  totalPages,
  loading = false,
  onPageChange,
  className = "classroom-pagination",
}) => {
  const handlePrevious = () => {
    const newPage = Math.max(1, page - 1);
    onPageChange(newPage);
  };

  const handleNext = () => {
    const newPage = Math.min(totalPages, page + 1);
    onPageChange(newPage);
  };

  return (
    <div className={className}>
      <button
        type="button"
        className="classroom-pagination-btn"
        onClick={handlePrevious}
        disabled={loading || page === 1}
      >
        ← Trước
      </button>
      <span className="classroom-pagination-info">
        Trang {page}/{totalPages}
      </span>
      <button
        type="button"
        className="classroom-pagination-btn"
        onClick={handleNext}
        disabled={loading || page === totalPages}
      >
        Sau →
      </button>
    </div>
  );
};

export default Pagination;
