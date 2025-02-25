import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import { env } from "./env";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };

export class UploadError extends Error {}

/**
 * Stores an image and returns its public URL: Cloudinary when CLOUDINARY_URL
 * is set, otherwise public/uploads (local dev only).
 */
export async function storeImage(file: File, folder: "covers" | "chapters"): Promise<string> {
  const ext = TYPES[file.type];
  if (!ext) throw new UploadError("Use a JPEG, PNG, WebP or GIF image.");
  if (file.size > MAX_BYTES) throw new UploadError("Images must be under 5 MB.");
  const bytes = Buffer.from(await file.arrayBuffer());

  if (env.cloudinaryUrl) {
    const result = await new Promise<{ secure_url: string }>((resolve, reject) =>
      cloudinary.uploader
        .upload_stream({ folder: `taleverse/${folder}`, resource_type: "image" }, (err, res) =>
          err || !res ? reject(err ?? new Error("Upload failed")) : resolve(res),
        )
        .end(bytes),
    );
    return result.secure_url;
  }

  if (env.isProduction) throw new UploadError("Image uploads are not configured.");
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}.${ext}`;
  await writeFile(path.join(dir, name), bytes);
  return `/uploads/${folder}/${name}`;
}
