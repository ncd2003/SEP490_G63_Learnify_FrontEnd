// ─── SESSION TYPE ENUM ─────────────────────────────────────────────────────────
export const SESSION_TYPE = {
  ONLINE: "ONLINE",
  OFFLINE: "OFFLINE",
};

// ─── RECURRENCE PATTERN ENUM ───────────────────────────────────────────────────
export const RECURRENCE_PATTERN = {
  NONE: "NONE",
  DAILY: "DAILY",
  WEEKLY: "WEEKLY",
  MONTHLY: "MONTHLY",
  YEARLY: "YEARLY",
};

// ─── ATTENDANCE STATUS ENUM ────────────────────────────────────────────────────
export const ATTENDANCE_STATUS = {
  PRESENT: "PRESENT",
  ABSENT: "ABSENT",
  LATE: "LATE",
  EXCUSED: "EXCUSED",
};

// ─── ClassSessionResponseDTO shape ─────────────────────────────────────────────
export const classSessionResponseSchema = {
  id: null,             // Long   → number
  classroomId: null,    // Long   → number
  classroomName: "",    // String → string
  title: "",            // String → string (max 200)
  description: "",      // String → string | null (TEXT)
  sessionDate: "",      // LocalDate  → "yyyy-MM-dd"
  startTime: "",        // LocalTime  → "HH:mm"
  endTime: "",          // LocalTime  → "HH:mm"
  type: "",             // SessionType → "ONLINE" | "OFFLINE"
  location: "",         // String → string | null (max 200)
  meetingLink: "",      // String → string | null (max 500)
  recordingLink: "",    // String → string | null (max 1000)
  recordingStatus: "",  // String → "SCHEDULED" | "RECORDING" | "COMPLETED" | null
  recordingCompletedAt: "", // Instant → "yyyy-MM-dd HH:mm:ss" or null
  allowRecording: true, // boolean - cho phép ghi âm
  attendanceTaken: false, // boolean
  createdAt: "",        // Instant → "yyyy-MM-dd HH:mm:ss"
  updatedAt: "",        // Instant → "yyyy-MM-dd HH:mm:ss"
};

// ─── CreateClassSessionRequestDTO shape ────────────────────────────────────────
export const createSessionRequestSchema = {
  title: "",            // @NotBlank, @Length(3, 200)
  description: "",      // @Length(max=1000), optional
  sessionDate: "",      // @NotNull, "yyyy-MM-dd"
  startTime: "",        // @NotNull, "HH:mm"
  endTime: "",          // @NotNull, "HH:mm"
  type: SESSION_TYPE.OFFLINE, // @NotNull, ONLINE | OFFLINE
  location: "",         // @Length(max=200), optional
  meetingLink: "",      // @Length(max=500), optional
  recurrencePattern: RECURRENCE_PATTERN.NONE, // Mô hình lặp lại
  recurrenceCount: null, // Số lần lặp lại (nếu có)
  allowRecording: true, // Cho phép ghi âm hay không
};

// ─── AttendanceRecordResponseDTO shape ─────────────────────────────────────────
export const attendanceRecordResponseSchema = {
  id: null,             // Long   → number
  sessionId: null,      // Long   → number
  studentId: null,      // Long   → number
  studentName: "",      // String → string
  markedById: null,     // Long   → number | null
  markedByName: "",     // String → string | null
  status: "",           // AttendanceStatus → "PRESENT" | "ABSENT" | "LATE" | "EXCUSED"
  createdAt: "",        // Instant → "yyyy-MM-dd HH:mm:ss"
  updatedAt: "",        // Instant → "yyyy-MM-dd HH:mm:ss"
};

// ─── MarkAttendanceRequestDTO shape ────────────────────────────────────────────
export const markAttendanceRequestSchema = {
  studentId: null,      // @NotNull, Long → number
  status: "",           // @NotNull, PRESENT | ABSENT | LATE | EXCUSED
};

// ─── Validation Rules (mirrors backend Jakarta Validation) ─────────────────────
export const sessionValidationRules = {
  title: {
    required: true,
    minLength: 3,
    maxLength: 200,
    message: "Tiêu đề phải từ 3 đến 200 ký tự",
  },
  description: {
    required: false,
    maxLength: 1000,
    message: "Mô tả không được vượt quá 1000 ký tự",
  },
  sessionDate: {
    required: true,
    message: "Ngày học không được để trống",
  },
  startTime: {
    required: true,
    message: "Thời gian bắt đầu không được để trống",
  },
  endTime: {
    required: true,
    message: "Thời gian kết thúc không được để trống",
  },
  type: {
    required: true,
    message: "Loại buổi học không được để trống",
  },
  location: {
    required: false,
    maxLength: 200,
    message: "Địa điểm không được vượt quá 200 ký tự",
  },
  meetingLink: {
    required: false,
    maxLength: 500,
    message: "Link meeting không được vượt quá 500 ký tự",
  },
  recurrencePattern: {
    required: false,
    message: "Mô hình lặp lại không hợp lệ",
  },
  recurrenceCount: {
    required: false,
    min: 1,
    max: 365,
    message: "Số lần lặp lại phải từ 1 đến 365",
  },
};

/**
 * Validate session form data (mirrors backend CreateClassSessionRequestDTO validation)
 * @param {Object} data - Form data to validate
 * @returns {{ valid: boolean, errors: Object }}
 */
export const validateSessionForm = (data) => {
  const errors = {};

  const toDateTime = (dateStr, timeStr) => {
    if (!dateStr || !timeStr) return null;
    const [year, month, day] = dateStr.split("-").map(Number);
    const [hour, minute] = timeStr.split(":").map(Number);
    return new Date(year, (month || 1) - 1, day || 1, hour || 0, minute || 0, 0, 0);
  };

  // Title validation
  const titleLen = data.title?.trim().length ?? 0;
  if (!titleLen) {
    errors.title = "Tiêu đề không được để trống";
  } else if (titleLen < 3 || titleLen > 200) {
    errors.title = sessionValidationRules.title.message;
  }

  // Description validation (optional but max 1000)
  const descLen = data.description?.trim().length ?? 0;
  if (descLen > 1000) {
    errors.description = sessionValidationRules.description.message;
  }

  // Session date validation
  if (!data.sessionDate) {
    errors.sessionDate = sessionValidationRules.sessionDate.message;
  }

  // Start time validation
  if (!data.startTime) {
    errors.startTime = sessionValidationRules.startTime.message;
  }

  // End time validation
  if (!data.endTime) {
    errors.endTime = sessionValidationRules.endTime.message;
  }

  // BR-40: End time must be after start time
  if (data.startTime && data.endTime && data.endTime <= data.startTime) {
    errors.endTime = "Thời gian kết thúc phải sau thời gian bắt đầu";
  }

  const startDateTime = toDateTime(data.sessionDate, data.startTime);
  const endDateTime = toDateTime(data.sessionDate, data.endTime);

  if (startDateTime && startDateTime.getTime() < Date.now()) {
    errors.startTime = "Không được chọn giờ bắt đầu trong quá khứ";
  }

  if (startDateTime && endDateTime && endDateTime.getTime() > startDateTime.getTime()) {
    const durationMs = endDateTime.getTime() - startDateTime.getTime();
    const minimumDurationMs = 15 * 60 * 1000;
    if (durationMs < minimumDurationMs) {
      errors.endTime = "Thời lượng buổi học tối thiểu là 15 phút";
    }
  }

  // Type validation
  if (!data.type) {
    errors.type = sessionValidationRules.type.message;
  }

  // Location validation (max 200)
  const locLen = data.location?.trim().length ?? 0;
  if (locLen > 200) {
    errors.location = sessionValidationRules.location.message;
  }

  // Meeting link validation (max 500)
  const linkLen = data.meetingLink?.trim().length ?? 0;
  if (linkLen > 500) {
    errors.meetingLink = sessionValidationRules.meetingLink.message;
  }

  // Recurrence count validation (only if pattern is not NONE)
  if (data.recurrencePattern && data.recurrencePattern !== RECURRENCE_PATTERN.NONE) {
    const count = data.recurrenceCount;
    if (count === null || count === undefined || count === "") {
      errors.recurrenceCount = "Số lần lặp lại không được để trống";
    } else if (Number(count) < 1 || Number(count) > 365) {
      errors.recurrenceCount = sessionValidationRules.recurrenceCount.message;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};
