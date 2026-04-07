import { z } from "zod";
import {
  BenefitCodeSchema,
  BenefitTypeSchema,
} from "@/schema/benefit.schema";

export const DURATION_UNIT_VALUES = ["HOUR", "DAY", "WEEK", "MONTH", "YEAR"];
export const PLAN_STATUS_VALUES = ["PUBLIC", "HIDE"];

export const PLAN_STATUS_LABELS = {
  PUBLIC: "Công khai",
  HIDE: "Ẩn",
  // Backward-compatible labels for legacy responses.
  ACTIVE: "Công khai",
  INACTIVE: "Ẩn",
};

/**
 * @param {string | undefined | null} status
 * @returns {string}
 */
export const getPlanStatusLabel = (status) =>
  PLAN_STATUS_LABELS[status] || status || "Không xác định";

export const DurationUnitSchema = z.enum(DURATION_UNIT_VALUES);
export const PlanStatusSchema = z.enum(PLAN_STATUS_VALUES);

export const PlanBenefitRequestSchema = z.object({
  id: z.number().int().positive("Benefit id không hợp lệ"),
  limit: z.number().int().positive("Giới hạn benefit phải lớn hơn 0"),
});

export const PlanSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z
    .string()
    .trim()
    .min(1, "Tên gói không được để trống")
    .max(100, "Tên gói tối đa 100 ký tự"),
  price: z.number().min(0, "Giá phải lớn hơn hoặc bằng 0"),
  description: z
    .string()
    .trim()
    .max(1000, "Mô tả tối đa 1000 ký tự")
    .nullable()
    .optional(),
  durationUnit: DurationUnitSchema.nullable().optional(),
  durationValue: z.number().int().min(0),
  planStatus: PlanStatusSchema,
  benefits: z.array(
    z.object({
      benefit: z.object({
        id: z.number().int().positive(),
        type: BenefitTypeSchema,
        code: BenefitCodeSchema,
      }),
      limitValue: z.number().int().nonnegative(),
      type: BenefitTypeSchema,
    })
  ).optional().default([]),
});

export const CreatePlanSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Tên gói không được để trống")
    .max(100, "Tên gói tối đa 100 ký tự"),
  price: z.number().min(0, "Giá phải lớn hơn hoặc bằng 0"),
  description: z
    .string()
    .trim()
    .min(1, "Mô tả không được để trống")
    .max(1000, "Mô tả tối đa 1000 ký tự"),
  durationUnit: DurationUnitSchema,
  durationValue: z.number().int().positive("Thời hạn phải lớn hơn 0"),
  planStatus: PlanStatusSchema,
  benefits: z.array(PlanBenefitRequestSchema).optional().default([]),
});

// Backend update endpoint uses the same PlanRequestDTO with @Valid.
export const UpdatePlanSchema = CreatePlanSchema;

/**
 * @typedef {z.infer<typeof PlanSchema>} TPlan
 * @typedef {z.infer<typeof CreatePlanSchema>} TCreatePlan
 * @typedef {z.infer<typeof UpdatePlanSchema>} TUpdatePlan
 */
