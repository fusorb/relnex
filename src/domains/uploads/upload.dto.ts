import { z } from "zod";

// Allowed file types for uploads
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "video/mp4",
  "audio/mpeg",
  "text/plain",
];

export const requestUploadSchema = z
  .object({
    filename: z.string().min(1, "Filename is required"),
    contentType: z.enum(ALLOWED_MIME_TYPES as [string, ...string[]], {
      error: "File type not allowed",
    }),
    sizeInBytes: z
      .number()
      .max(
        100 * 1024 * 1024,
        "File size exceeds 100MB limit",
      ),
  })
  .strict();

export type RequestUploadInput = z.infer<typeof requestUploadSchema>;

export interface PresignedUploadResponseDTO {
  uploadUrl: string;
  fileUrl: string;
  fileKey: string;
}
