"use client";

// Upload helper: presign on the Relnex API, then PUT the bytes straight to the
// object store (the presigned URL is cross-origin, so no credentials are sent).
import { useRef, useState } from "react";
import { Button, Icon, Label } from "@fusorb/facet-components";
import { apiClient } from "@/lib/useful/api-client";

interface PresignResponse {
  uploadUrl: string;
  fileUrl: string;
  fileKey: string;
}

export const ACCEPTED_UPLOAD_TYPES =
  "image/jpeg,image/png,image/webp,image/gif,application/pdf,video/mp4,audio/mpeg,text/plain";

export async function uploadFile(file: File): Promise<string> {
  const res = await apiClient<{ success: boolean; data: PresignResponse }>("/api/uploads/presign", {
    method: "POST",
    bodyData: { filename: file.name, contentType: file.type, sizeInBytes: file.size },
  });
  const put = await fetch(res.data.uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
  if (!put.ok) throw new Error(`Upload failed (${put.status})`);
  return res.data.fileUrl;
}

export function FileUpload({
  label,
  value,
  onChange,
  accept = ACCEPTED_UPLOAD_TYPES,
}: {
  label: string;
  value: string | null;
  onChange: (url: string) => void;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await uploadFile(file));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          <Icon name="upload" className="size-4" aria-hidden />
          {busy ? "Uploading..." : value ? "Replace" : "Upload"}
        </Button>
        {value && (
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="truncate text-xs text-primary hover:underline"
          >
            View file
          </a>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFile}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
