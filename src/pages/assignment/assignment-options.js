export const ASSIGNMENT_STATUS_OPTIONS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "DRAFT", label: "Bản nháp" },
  { value: "PUBLISHED", label: "Đã xuất bản" },
];

export const CATEGORY_LABEL_MAP = {
  HOMEWORK: "Bài tập",
  TEST: "Bài kiểm tra",
};

export const FORMAT_LABEL_MAP = {
  MULTIPLE_CHOICE: "Trắc nghiệm",
  ESSAY: "Tự luận",
  MIXED: "Hỗn hợp",
};

export const STATUS_LABEL_MAP = {
  DRAFT: "Bản nháp",
  PUBLISHED: "Đã xuất bản",
};

export const formatAssignmentDateTime = (value) => {
  if (!value) {
    return "-";
  }

  try {
    return new Date(value).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
};
