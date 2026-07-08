export const MAX_PHOTOS_PER_MEMORY = 10;
export const MAX_PHOTO_FILE_BYTES = 5 * 1024 * 1024;

// Compression targets. The full image is capped at 1600px wide @ q0.75 for
// detail in the full-screen viewer; the thumbnail at 400px @ q0.65 for grids.
export const FULL_PHOTO_MAX_DIMENSION = 1600;
export const FULL_PHOTO_QUALITY = 0.75;
export const THUMBNAIL_MAX_DIMENSION = 400;
export const THUMBNAIL_QUALITY = 0.65;

export function isUploadedMemoryPhoto(photo: { downloadUrl?: string }) {
  return typeof photo.downloadUrl === "string" && photo.downloadUrl.length > 0;
}

export function countUploadablePhotos(photos: { downloadUrl?: string; photoSeed?: string }[]) {
  return photos.filter((photo) => isUploadedMemoryPhoto(photo) || !photo.photoSeed).length;
}

/**
 * Resolve the best URL for a grid/thumbnail slot: prefer the small thumbnail
 * (cheaper bandwidth), then the full download URL. Older photos without a
 * thumbnail fall back to downloadUrl automatically.
 */
export function resolvePhotoThumbnailUrl(photo: { thumbnailUrl?: string; downloadUrl?: string }) {
  return photo.thumbnailUrl || photo.downloadUrl || null;
}

/**
 * Resolve the best URL for the full-screen viewer: prefer the full download
 * URL, then the thumbnail. Both fall back to null so callers can use the
 * cached local preview blob if neither exists yet.
 */
export function resolvePhotoFullUrl(photo: { downloadUrl?: string; thumbnailUrl?: string }) {
  return photo.downloadUrl || photo.thumbnailUrl || null;
}

interface ProcessImageOptions {
  maxDimension: number;
  quality: number;
  maxBytes?: number;
}

/**
 * Decode + resize + JPEG-encode an image via canvas. Used for both the
 * compressed full image and the thumbnail. Accepts a File or the Blob output
 * of a prior compression pass. Returns the original input if canvas drawing
 * is unavailable (so callers can fall back to the raw upload).
 */
async function processImage(file: Blob, options: ProcessImageOptions): Promise<Blob> {
  const { maxDimension, quality, maxBytes = MAX_PHOTO_FILE_BYTES } = options;

  if (!file.type.startsWith("image/")) {
    throw new Error("memories.photos.errors.invalidType");
  }

  if (file.size > maxBytes) {
    throw new Error("memories.photos.errors.fileTooLarge");
  }

  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  let width = bitmap.width;
  let height = bitmap.height;

  if (width > maxDimension || height > maxDimension) {
    const scale = maxDimension / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    return file;
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await canvasToBlob(canvas, quality);
  if (!blob) return file;
  return blob;
}

/**
 * Backwards-compatible compressor used by the upload fallback path. Resizes
 * to FULL_PHOTO_MAX_DIMENSION and progressively lowers quality until under
 * the byte cap, so an oversized phone photo still uploads.
 */
export async function compressImageFile(file: Blob, maxBytes = MAX_PHOTO_FILE_BYTES): Promise<Blob> {
  if (file.size > maxBytes) {
    throw new Error("memories.photos.errors.fileTooLarge");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("memories.photos.errors.invalidType");
  }

  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  let width = bitmap.width;
  let height = bitmap.height;
  const maxDimension = FULL_PHOTO_MAX_DIMENSION;

  if (width > maxDimension || height > maxDimension) {
    const scale = maxDimension / Math.max(width, height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    return file;
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = FULL_PHOTO_QUALITY;
  let blob = await canvasToBlob(canvas, quality);

  while (blob && blob.size > maxBytes && quality > 0.45) {
    quality -= 0.08;
    blob = await canvasToBlob(canvas, quality);
  }

  if (!blob) return file;
  if (blob.size > maxBytes) {
    throw new Error("memories.photos.errors.fileTooLarge");
  }

  return blob;
}

/** Compressed full image: ≤1600px wide, JPEG q0.75. */
export async function compressFullPhoto(file: Blob, maxBytes = MAX_PHOTO_FILE_BYTES): Promise<Blob> {
  return processImage(file, {
    maxDimension: FULL_PHOTO_MAX_DIMENSION,
    quality: FULL_PHOTO_QUALITY,
    maxBytes,
  });
}

/** Compressed thumbnail: ≤400px wide, JPEG q0.65. */
export async function createThumbnail(file: Blob, maxBytes = MAX_PHOTO_FILE_BYTES): Promise<Blob> {
  return processImage(file, {
    maxDimension: THUMBNAIL_MAX_DIMENSION,
    quality: THUMBNAIL_QUALITY,
    maxBytes,
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", quality);
  });
}

export async function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(blob);
  });
}

export function dataUrlToBlob(dataUrl: string) {
  const [header, base64] = dataUrl.split(",");
  if (!header || !base64) {
    throw new Error("Invalid data URL");
  }

  const mime = header.match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mime });
}
