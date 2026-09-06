import { MAX_HEALTH_LOG_IMAGE_BYTES } from "@petmosphere/api-contracts";
import { afterEach, describe, expect, it, vi } from "vitest";

import { optimizeHealthLogImage } from "./optimize-image";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("optimizeHealthLogImage", () => {
  it("leaves photos within the upload limit unchanged", async () => {
    const file = new File(["photo"], "photo.jpg", { type: "image/jpeg" });

    await expect(optimizeHealthLogImage(file)).resolves.toBe(file);
  });

  it("converts an oversized photo to a smaller WebP file", async () => {
    const close = vi.fn();
    const drawImage = vi.fn();
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn().mockResolvedValue({ close, height: 3000, width: 4000 }),
    );
    const canvas = {
      getContext: vi.fn(() => ({ drawImage })),
      height: 0,
      toBlob: vi.fn((callback: BlobCallback) =>
        callback(new Blob(["optimized"], { type: "image/webp" })),
      ),
      width: 0,
    };
    const createElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName) =>
      tagName === "canvas"
        ? (canvas as unknown as HTMLCanvasElement)
        : createElement(tagName),
    );
    const file = new File(
      [new Uint8Array(MAX_HEALTH_LOG_IMAGE_BYTES + 1)],
      "large.jpg",
      { type: "image/jpeg" },
    );

    const optimized = await optimizeHealthLogImage(file);

    expect(optimized.type).toBe("image/webp");
    expect(optimized.size).toBeLessThan(MAX_HEALTH_LOG_IMAGE_BYTES);
    expect(canvas.width).toBe(1600);
    expect(canvas.height).toBe(1200);
    expect(drawImage).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
  });
});
