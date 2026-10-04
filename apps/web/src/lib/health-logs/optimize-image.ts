import { MAX_HEALTH_LOG_IMAGE_BYTES } from "@petmosphere/api-contracts";

import { optimizeUploadImage } from "@/lib/images/optimize-upload-image";

export async function optimizeHealthLogImage(file: File) {
  return optimizeUploadImage(file, MAX_HEALTH_LOG_IMAGE_BYTES);
}
