import { z } from "zod";

export const FolderNodeSchema = z.lazy(() =>
  z.object({
    id: z.number(),
    name: z.string(),
    parentId: z.number().nullable().optional(),
    subFolders: z.array(FolderNodeSchema).default([]),
  })
);

export const FolderListSchema = z.array(FolderNodeSchema);

export const FolderRequestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "FOLDER_NAME_CAN_NOT_BE_BLANK")
    .max(100, "FOLDER_NAME_TOO_LONG"),
  parentId: z.number().nullable().optional(),
  classroomId: z.number(),
});

/** @typedef {z.infer<typeof FolderNodeSchema>} TFolderNode */
/** @typedef {z.infer<typeof FolderRequestSchema>} TFolderRequest */
