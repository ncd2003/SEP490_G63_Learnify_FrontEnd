import { z } from "zod";

export const QuestionBankSchema = z.object({
  id: z.number(),
  name: z
    .string()
    .trim()
    .min(3, "Tên ngân hàng phải ít nhất 3 ký tự")
    .max(120, "Tên ngân hàng tối đa 120 ký tự"),
  gradeLevel: z.string().trim().min(1, "Vui lòng chọn khối lớp"),
  subject: z
    .string()
    .trim()
    .min(2, "Môn học phải ít nhất 2 ký tự")
    .max(80, "Môn học tối đa 80 ký tự"),
  description: z
    .string()
    .trim()
    .max(1000, "Mô tả tối đa 1000 ký tự")
    .nullable()
    .optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  updateAt: z.string().nullable().optional(),
});

export const CreateQuestionBankSchema = QuestionBankSchema.pick({
  name: true,
  gradeLevel: true,
  subject: true,
  description: true,
});

export const UpdateQuestionBankSchema = QuestionBankSchema.pick({
  name: true,
  description: true,
})
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Cần ít nhất một trường để cập nhật",
  );

/**
 * @typedef {z.infer<typeof QuestionBankSchema>} TQuestionBank
 * @typedef {z.infer<typeof CreateQuestionBankSchema>} TCreateQuestionBank
 * @typedef {z.infer<typeof UpdateQuestionBankSchema>} TUpdateQuestionBank
 */
