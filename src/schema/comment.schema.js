import { z } from "zod";

// ─── Comment Schema (mirrors CommentResponseDTO) ──────────────────────────────
export const CommentSchema = z.object({
  id:          z.number(),
  content:     z.string().trim().min(1, "Nội dung bình luận không được để trống").max(500, "Bình luận tối đa 500 ký tự"),
  active:      z.boolean().optional(),
  user:        z.object({
    id:   z.number(),
    name: z.string(),
  }).optional(),
  authorName:  z.string().optional(), // transformed from user.name
  authorRole:  z.string().optional(),
  createdAt:   z.string().optional(),
  updatedAt:   z.string().optional(),
  parentId:    z.number().optional(),
  replies:     z.array(z.lazy(() => CommentSchema)).optional(), // nested replies from API
});

// ─── Create Comment Schema (mirrors CreateCommentRequestDTO) ──────────────────
export const CreateCommentSchema = z.object({
  postId:  z.number({ required_error: "Post ID không được để trống" }),
  classroomId: z.number().optional(),
  content: z.string().trim().min(1, "Nội dung bình luận không được để trống").max(500, "Bình luận tối đa 500 ký tự"),
  parentId: z.number().optional(), // optional for reply comments
});

// ─── Update Comment Schema ────────────────────────────────────────────────────
export const UpdateCommentSchema = CreateCommentSchema;

/**
 * @typedef {z.infer<typeof CommentSchema>}        TComment
 * @typedef {z.infer<typeof CreateCommentSchema>}  TCreateComment
 * @typedef {z.infer<typeof UpdateCommentSchema>}  TUpdateComment
 */
