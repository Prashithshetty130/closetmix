import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import { removeBackground, BackgroundRemovalOptions } from "./ai/background-removal";

// Maximum upload file size: 15MB
export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

export interface ProcessedUploadResult {
  itemId: string;
  originalFileName: string;
  originalImageUrl: string;
  processedImageUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  format: string;
}

/**
 * Ensures a directory exists.
 */
async function ensureDir(dirPath: string) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error: any) {
    if (error.code !== "EEXIST") throw error;
  }
}

/**
 * Strips EXIF metadata (GPS, camera info), handles HEIC conversion,
 * optimizes the image, and creates thumbnail and base display files.
 */
export async function processAndSaveImage(
  userId: string,
  buffer: Buffer,
  originalFilename: string,
  mimeType: string,
  cutoutOptions?: BackgroundRemovalOptions
): Promise<ProcessedUploadResult> {
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error("File exceeds 15MB size limit");
  }

  let workingBuffer = buffer;

  // Convert HEIC/HEIF to JPEG buffer if necessary
  const isHeic =
    mimeType.includes("heic") ||
    mimeType.includes("heif") ||
    originalFilename.toLowerCase().endsWith(".heic") ||
    originalFilename.toLowerCase().endsWith(".heif");

  if (isHeic) {
    try {
      // Dynamic import to handle non-node environments gracefully
      const convert = require("heic-convert");
      const converted = await convert({
        buffer: workingBuffer,
        format: "JPEG",
        quality: 0.9,
      });
      workingBuffer = Buffer.from(converted);
    } catch (heicErr) {
      console.warn("heic-convert fallback attempt with sharp:", heicErr);
    }
  }

  const itemId = uuidv4();
  const userUploadsDir = path.join(process.cwd(), "public", "uploads", userId, "items", itemId);
  await ensureDir(userUploadsDir);

  // Sharp instance: .rotate() auto-orients from EXIF orientation, then strips all EXIF/GPS tags
  const sharpInstance = sharp(workingBuffer).rotate();
  const metadata = await sharpInstance.metadata();

  // 1. Optimized display image (max 1400px width/height, WebP, EXIF stripped)
  const displayFileName = `display_${itemId}.webp`;
  const displayFilePath = path.join(userUploadsDir, displayFileName);
  await sharp(workingBuffer)
    .rotate()
    .resize({
      width: 1400,
      height: 1400,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 85 })
    .toFile(displayFilePath);

  // 2. High-performance thumbnail (360x360, WebP)
  const thumbFileName = `thumb_${itemId}.webp`;
  const thumbFilePath = path.join(userUploadsDir, thumbFileName);
  await sharp(workingBuffer)
    .rotate()
    .resize({
      width: 360,
      height: 360,
      fit: "cover",
      position: "centre",
    })
    .webp({ quality: 80 })
    .toFile(thumbFilePath);

  // 3. High-precision background removal cutout (PNG with alpha channel)
  const cutoutBuffer = await removeBackground(workingBuffer, cutoutOptions);
  const cutoutFileName = `cutout_${itemId}.png`;
  const cutoutFilePath = path.join(userUploadsDir, cutoutFileName);
  await fs.writeFile(cutoutFilePath, cutoutBuffer);

  // Relative URLs served through Next.js public directory
  const relativeBasePath = `/uploads/${userId}/items/${itemId}`;
  const displayUrl = `${relativeBasePath}/${displayFileName}`;
  const thumbUrl = `${relativeBasePath}/${thumbFileName}`;
  const cutoutUrl = `${relativeBasePath}/${cutoutFileName}`;

  return {
    itemId,
    originalFileName: originalFilename,
    originalImageUrl: displayUrl,
    processedImageUrl: cutoutUrl, // transparent cutout
    thumbnailUrl: thumbUrl,
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || "webp",
  };
}

/**
 * Removes all files for a specific item.
 */
export async function deleteItemFiles(userId: string, itemId: string) {
  const itemDir = path.join(process.cwd(), "public", "uploads", userId, "items", itemId);
  try {
    await fs.rm(itemDir, { recursive: true, force: true });
  } catch (error) {
    console.error(`Failed to delete item files at ${itemDir}:`, error);
  }
}
