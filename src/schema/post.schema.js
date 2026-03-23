import { z } from "zod";

export const PostSchema = z.object({
  content: z
    .string()
    .min(1, "Nội dung bài viết không được để trống")
    .max(500, "Nội dung bài viết không được quá 500 ký tự"),
  pinned: z.boolean().default(false),
  classroomId: z.number({ required_error: "ID lớp học là bắt buộc" }),
  deleteAttachmentIds: z.array(z.number()).optional(),
});
