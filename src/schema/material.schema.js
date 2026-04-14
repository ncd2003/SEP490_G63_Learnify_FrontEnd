import { z } from "zod";

export const MaterialSchema = z.object({
  id: z.number().nullable().optional(),
  fileName: z.string(),
  fileUrl: z.string().url(),
  fileSize: z.number(),
  /** Optional unit string provided by uploader (e.g. 'KB', 'MB', 'BYTE') */
  sizeUnit: z.string().optional(),
  fileType: z.string().optional(),
  createdAt: z.string().optional(),
});

export const MaterialListSchema = z.array(MaterialSchema);

/** @typedef {z.infer<typeof MaterialSchema>} TMaterial */
