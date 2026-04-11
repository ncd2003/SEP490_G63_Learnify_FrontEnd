import { z } from "zod";

export const BENEFIT_CODE_VALUES = ["AI_REQUEST", "STORAGE"];
export const BENEFIT_TYPE_VALUES = ["COUNTER", "DATA_SIZE"];

export const BENEFIT_CODE_LABELS = {
  AI_REQUEST: "Yêu cầu AI",
  STORAGE: "Dung lượng lưu trữ",
};

export const BENEFIT_TYPE_LABELS = {
  COUNTER: "Đếm lượt",
  DATA_SIZE: "Dung lượng",
  STORAGE: "Dung lượng",
};

/**
 * @param {string | undefined | null} code
 * @returns {string}
 */
export const getBenefitCodeLabel = (code) =>
  BENEFIT_CODE_LABELS[code] || code || "Lợi ích";

/**
 * @param {string | undefined | null} type
 * @returns {string}
 */
export const getBenefitTypeLabel = (type) =>
  BENEFIT_TYPE_LABELS[type] || type || "Loại lợi ích";

export const BenefitCodeSchema = z.enum(BENEFIT_CODE_VALUES);
export const BenefitTypeSchema = z.enum(BENEFIT_TYPE_VALUES);

export const BenefitSchema = z.object({
  id: z.number(),
  code: BenefitCodeSchema,
  type: BenefitTypeSchema,
});

export const CreateBenefitSchema = z.object({
  code: BenefitCodeSchema,
  type: BenefitTypeSchema,
});

// Backend update DTO requires both fields as @NotNull, same as create.
export const UpdateBenefitSchema = CreateBenefitSchema;

/**
 * @typedef {z.infer<typeof BenefitSchema>} TBenefit
 * @typedef {z.infer<typeof CreateBenefitSchema>} TCreateBenefit
 * @typedef {z.infer<typeof UpdateBenefitSchema>} TUpdateBenefit
 */
