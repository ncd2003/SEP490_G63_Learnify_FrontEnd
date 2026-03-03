// Classroom Response DTO shape (from backend ClassroomResponseDTO)
export const classroomResponseSchema = {
  id: null,           // Long   → number
  name: "",           // String → string
  code: "",           // String → string
  subject: "",        // String → string
  description: "",    // String → string
  imageUrl: null,     // String → string | null
};

// Classroom Create/Update Request shape
export const classroomRequestSchema = {
  name: "",           // required
  subject: "",        // required
  description: "",    // optional
  imageUrl: null,     // optional
};

// Validation rules for classroom form (mirrors backend @Length and @NotBlank)
export const classroomValidationRules = {
  name: {
    required: true,
    minLength: 3,
    maxLength: 50,
    message: "Tên lớp phải từ 3 đến 50 ký tự",
  },
  subject: {
    required: true,
    minLength: 3,
    maxLength: 50,
    message: "Môn học phải từ 3 đến 50 ký tự",
  },
  description: {
    required: false,
    minLength: 3,
    maxLength: 50,
    message: "Mô tả phải từ 3 đến 50 ký tự (nếu có)",
  },
};

/**
 * Validate classroom form data
 * @param {Object} data - Form data to validate
 * @returns {{ valid: boolean, errors: Object }}
 */
export const validateClassroomForm = (data) => {
  const errors = {};
  const { name: nr, subject: sr, description: dr } = classroomValidationRules;

  const nameLen = data.name?.trim().length ?? 0;
  if (!data.name || nameLen < nr.minLength || nameLen > nr.maxLength) {
    errors.name = nr.message;
  }

  const subjectLen = data.subject?.trim().length ?? 0;
  if (!data.subject || subjectLen < sr.minLength || subjectLen > sr.maxLength) {
    errors.subject = sr.message;
  }

  if (data.description && data.description.trim().length > 0) {
    const descLen = data.description.trim().length;
    if (descLen < dr.minLength || descLen > dr.maxLength) {
      errors.description = dr.message;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};
