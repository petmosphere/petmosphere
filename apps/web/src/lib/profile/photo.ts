import {
  MAX_PROFILE_PHOTO_BYTES,
  PROFILE_PHOTO_TYPES,
} from "@petmosphere/api-contracts";
import sharp from "sharp";

export class InvalidProfilePhotoError extends Error {}

export async function prepareProfilePhoto(file: File) {
  if (
    !PROFILE_PHOTO_TYPES.includes(
      file.type as (typeof PROFILE_PHOTO_TYPES)[number],
    )
  ) {
    throw new InvalidProfilePhotoError("Choose a JPEG, PNG or WebP photo.");
  }
  if (file.size > MAX_PROFILE_PHOTO_BYTES) {
    throw new InvalidProfilePhotoError("Choose a photo smaller than 4 MB.");
  }

  try {
    const bytes = await sharp(await file.arrayBuffer(), {
      failOn: "warning",
      limitInputPixels: 40_000_000,
    })
      .rotate()
      .resize(1024, 1024, { fit: "cover", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    return { bytes: new Uint8Array(bytes), contentType: "image/webp" as const };
  } catch {
    throw new InvalidProfilePhotoError(
      "We could not read that photo. Choose another JPEG, PNG or WebP image.",
    );
  }
}
