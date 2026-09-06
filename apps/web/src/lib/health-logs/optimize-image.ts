import { MAX_HEALTH_LOG_IMAGE_BYTES } from "@petmosphere/api-contracts";

const MAX_IMAGE_DIMENSION = 1600;
const WEBP_QUALITIES = [0.82, 0.68, 0.54] as const;

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("health log image optimisation failed")),
      "image/webp",
      quality,
    );
  });
}

export async function optimizeHealthLogImage(file: File) {
  if (file.size <= MAX_HEALTH_LOG_IMAGE_BYTES) return file;

  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(
      1,
      MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("health log image canvas unavailable");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    for (const quality of WEBP_QUALITIES) {
      const blob = await canvasToBlob(canvas, quality);
      if (blob.size <= MAX_HEALTH_LOG_IMAGE_BYTES) {
        return new File([blob], "health-log-photo.webp", {
          lastModified: file.lastModified,
          type: "image/webp",
        });
      }
    }

    throw new Error("health log image remains too large");
  } finally {
    bitmap.close();
  }
}
