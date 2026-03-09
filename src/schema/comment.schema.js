import { z } from "zod";

// ─── Comment Schema (mirrors CommentResponseDTO) ──────────────────────────────
export const CommentSchema = z.object({
  id:          z.number(),
  content:     z.string().trim().min(1, "Nội dung bình luận không được để trống").max(1000, "Bình luận tối đa 1000 ký tự"),
  active:      z.boolean().optional(),
  authorName:  z.string().optional(),
  authorRole:  z.string().optional(),
  createdAt:   z.string().optional(),
  updatedAt:   z.string().optional(),
});

// ─── Create Comment Schema (mirrors CreateCommentRequestDTO) ──────────────────
export const CreateCommentSchema = z.object({
  postId:  z.number({ required_error: "Post ID không được để trống" }),
  content: z.string().trim().min(1, "Nội dung bình luận không được để trống").max(1000, "Bình luận tối đa 1000 ký tự"),
});

// ─── Update Comment Schema ────────────────────────────────────────────────────
export const UpdateCommentSchema = CreateCommentSchema;

/**
 * @typedef {z.infer<typeof CommentSchema>}        TComment
 * @typedef {z.infer<typeof CreateCommentSchema>}  TCreateComment
 * @typedef {z.infer<typeof UpdateCommentSchema>}  TUpdateComment
 */
