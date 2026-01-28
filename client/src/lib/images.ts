const API = "/api";

export type ImageItem =
  | { type: "url"; id: number; url: string }
  | { type: "base64"; id: number; data: string; mimeType: string | null };

export function imageUrl(img: { id: number; imageType: string }): string {
  return `${API}/images/${img.id}`;
}

export function imageSrc(
  img: { id: number; imageType: string; imageUrl?: string | null; imageData?: string | null; mimeType?: string | null }
): string {
  if (img.imageType === "url" && img.imageUrl) return img.imageUrl;
  if (img.imageType === "base64" && img.imageData && img.mimeType) {
    return `data:${img.mimeType};base64,${img.imageData}`;
  }
  return imageUrl(img);
}

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function toImageItem(
  img: { id: number; imageType: string; imageUrl?: string | null; imageData?: string | null; mimeType?: string | null }
): ImageItem {
  if (img.imageType === "url" && img.imageUrl) {
    return { type: "url", id: img.id, url: img.imageUrl };
  }
  if (img.imageType === "base64" && img.imageData) {
    return {
      type: "base64",
      id: img.id,
      data: img.imageData,
      mimeType: img.mimeType ?? null,
    };
  }
  return { type: "url", id: img.id, url: imageUrl(img) };
}
