import { z } from "zod";

export const ClassroomSchema = z.object({
  id:          z.number(),
  name:        z.string().trim().min(3, "Tên lớp phải ít nhất 3 ký tự").max(50, "Tên lớp tối đa 50 ký tự"),
  code:        z.string(),
  subject:     z.string().trim().min(3, "Môn học phải ít nhất 3 ký tự").max(50, "Môn học tối đa 50 ký tự"),
  description: z.string().trim().max(500, "Mô tả tối đa 500 ký tự").optional(),
  imageUrl:    z.string().url("URL ảnh không hợp lệ").nullable().optional(),
});

export const CreateClassroomSchema = ClassroomSchema.pick({
  name:        true,
  subject:     true,
  description: true,
  imageUrl:    true,
});

export const UpdateClassroomSchema = ClassroomSchema.pick({
  name:        true,
  subject:     true,
  description: true,
  imageUrl:    true,
});

/**
 * @typedef {z.infer<typeof ClassroomSchema>} TClassroom
 * @typedef {z.infer<typeof CreateClassroomSchema>} TCreateClassroom
 * @typedef {z.infer<typeof UpdateClassroomSchema>} TUpdateClassroom
 */

