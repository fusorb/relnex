import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "@/lib/storage/s3";
import { RequestUploadInput, PresignedUploadResponseDTO } from "./upload.dto";
import { ApiError } from "@/lib/errors";
import { logger } from "@/lib/useful/utils/logger";
import crypto from "crypto";

export class UploadService {
  private bucketName: string;
  private publicBaseUrl: string;

  constructor() {
    this.bucketName =
      process.env.STORAGE_BUCKET_NAME || process.env.AWS_BUCKET_NAME || "";
    this.publicBaseUrl = process.env.NEXT_PUBLIC_STORAGE_PUBLIC_URL || "";

    if (!this.bucketName) {
      throw ApiError.internal("Storage bucket name is not configured");
    }
  }

  async generatePresignedUploadTarget(
    userId: string,
    input: RequestUploadInput,
  ): Promise<PresignedUploadResponseDTO> {
    const fileExtension = input.filename.split(".").pop();
    const uniqueFileId = crypto.randomUUID();

    // Organizes files clearly in the bucket under users/[userId]/uploads
    const fileKey = `users/${userId}/uploads/${uniqueFileId}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      ContentType: input.contentType,
    });

    try {
      // Generate a secure upload signature link that expires in 15 minutes (900 seconds)
      const uploadUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 900,
      });

      // Build the safe, clean public access URL link
      const safeBase = this.publicBaseUrl.replace(/\/$/, "");
      const fileUrl = safeBase ? `${safeBase}/${fileKey}` : fileKey;

      return {
        uploadUrl,
        fileUrl,
        fileKey,
      };
    } catch (error) {
      logger.error("Upload signature generation failed", error);
      throw ApiError.internal("Failed to generate upload URL");
    }
  }
}
