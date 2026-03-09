/**
 * Wrapper chuẩn của mọi response từ backend (ApiResponse<T>).
 *
 * @template T
 * @typedef {Object} BaseResponse
 * @property {string} timestamp  - Thời điểm server xử lý, format "yyyy-MM-dd HH:mm:ss"
 * @property {number} code       - Mã kết quả (mặc định 1000 = thành công)
 * @property {string} [message]  - Thông báo (optional, JsonInclude.NON_NULL)
 * @property {T}      [result]   - Dữ liệu trả về (optional, JsonInclude.NON_NULL)
 */

/**
 * @template T
 * @typedef {Object} PaginationResponse
 * @property {number} size        - Số phần tử mỗi trang
 * @property {number} page        - Trang hiện tại
 * @property {number} total       - Tổng số phần tử
 * @property {number} totalPages  - Tổng số trang
 * @property {T[]}    items       - Danh sách phần tử trong trang
 */

/**
 * @template T
 * @typedef {BaseResponse<T>} ErrorResponse
 */

