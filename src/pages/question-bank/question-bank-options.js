export const gradeOptions = [
  { value: "", label: "-- Chọn khối lớp --" },
  { value: "6", label: "Khối 6" },
  { value: "7", label: "Khối 7" },
  { value: "8", label: "Khối 8" },
  { value: "9", label: "Khối 9" },
  { value: "10", label: "Khối 10" },
  { value: "11", label: "Khối 11" },
  { value: "12", label: "Khối 12" },
  { value: "university", label: "Đại học" },
  { value: "college", label: "Cao đẳng" },
  { value: "other", label: "Khác" },
];

export const subjectOptions = [
  { value: "", label: "-- Chọn môn học --" },
  { value: "math", label: "Toán học" },
  { value: "arithmetic", label: "Số học" },
  { value: "algebra", label: "Đại số" },
  { value: "algebra-calculus", label: "Đại số và Giải tích" },
  { value: "calculus", label: "Giải tích" },
  { value: "geometry", label: "Hình học" },
  { value: "civic-education", label: "GDCD" },
  { value: "technology", label: "Công nghệ" },
  { value: "physics", label: "Vật lý" },
  { value: "chemistry", label: "Hóa học" },
  { value: "biology", label: "Sinh học" },
  { value: "literature", label: "Ngữ văn" },
  { value: "english", label: "Tiếng Anh" },
  { value: "history", label: "Lịch sử" },
  { value: "geography", label: "Địa lý" },
  { value: "informatics", label: "Tin học" },
  { value: "other", label: "Môn học khác" },
];

export const resourceTypeOptions = [
  { value: "", label: "-- Chọn loại tài liệu --" },
  { value: "pdf", label: "PDF / Tài liệu văn bản" },
  { value: "video", label: "Video bài giảng" },
  { value: "slide", label: "Slide / Bài trình chiếu" },
  { value: "exercise", label: "Bài tập / Worksheet" },
  { value: "exam", label: "Đề thi / Kiểm tra" },
  { value: "other", label: "Khác" },
];

export const accessOptions = [
  { value: "private", label: "Riêng tư (chỉ mình tôi)" },
  { value: "class", label: "Lớp học của tôi" },
  { value: "public", label: "Công khai" },
];

export const exampleNames = [
  { good: true, text: '"Toán 10 - Chương 1: Hàm số bậc nhất"' },
  { good: true, text: '"Vật lý 11 - Tài liệu ôn tập giữa kỳ"' },
  { good: true, text: '"Tiếng Anh A1 - Grammar & Exercises"' },
  { good: true, text: '"Java Backend - Slide bài giảng Q1"' },
  { good: false, text: '"Tài liệu" (Quá ngắn, không rõ ràng)' },
];

export const getLabelFromOptions = (options, value) => {
  const matched = options.find((opt) => opt.value === value);
  return matched?.label ?? value;
};
