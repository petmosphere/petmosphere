import {
  MAX_PET_PHOTO_BYTES,
  PET_PHOTO_TYPES,
} from "@petmosphere/api-contracts";
import sharp from "sharp";

export class InvalidPetPhotoError extends Error {}

export async function preparePetPhoto(file: File) {
  if (
    !PET_PHOTO_TYPES.includes(file.type as (typeof PET_PHOTO_TYPES)[number])
  ) {
    throw new InvalidPetPhotoError("Choose a JPEG, PNG or WebP photo.");
  }
  if (file.size > MAX_PET_PHOTO_BYTES) {
    throw new InvalidPetPhotoError("Choose a photo smaller than 4 MB.");
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
    throw new InvalidPetPhotoError(
      "We could not read that photo. Choose another JPEG, PNG or WebP image.",
    );
  }
}
