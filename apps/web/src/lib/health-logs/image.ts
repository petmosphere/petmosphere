import {
  HEALTH_LOG_IMAGE_TYPES,
  MAX_HEALTH_LOG_IMAGE_BYTES,
} from "@petmosphere/api-contracts";
import sharp from "sharp";

export class InvalidHealthLogImageError extends Error {}

export async function prepareHealthLogImage(file: File) {
  if (
    !HEALTH_LOG_IMAGE_TYPES.includes(
      file.type as (typeof HEALTH_LOG_IMAGE_TYPES)[number],
    )
  ) {
    throw new InvalidHealthLogImageError("Choose JPEG, PNG or WebP photos.");
  }
  if (file.size > MAX_HEALTH_LOG_IMAGE_BYTES) {
    throw new InvalidHealthLogImageError(
      "Choose photos that are each smaller than 4 MB.",
    );
  }

  try {
    const bytes = await sharp(await file.arrayBuffer(), {
      failOn: "warning",
      limitInputPixels: 40_000_000,
    })
      .rotate()
      .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    return { bytes: new Uint8Array(bytes), contentType: "image/webp" as const };
  } catch {
    throw new InvalidHealthLogImageError(
      "We could not read one of those photos. Choose another JPEG, PNG or WebP image.",
    );
  }
}
