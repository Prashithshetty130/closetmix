import sharp from "sharp";
import path from "path";
import os from "os";

export interface BackgroundRemovalOptions {
  box_2d?: [number, number, number, number]; // [ymin, xmin, ymax, xmax] normalized 0..1000
}

// In-memory singleton cache for RMBG-1.4 neural model and processor
let rmbgModel: any = null;
let rmbgProcessor: any = null;
let isModelLoading = false;
let modelLoadFailed = false;

/**
 * Initializes and retrieves the RMBG-1.4 neural segmentation model.
 * Caches model weights in the writable temporary directory (/tmp on serverless/Lambda).
 */
async function getRMBGModel() {
  if (rmbgModel && rmbgProcessor) {
    return { model: rmbgModel, processor: rmbgProcessor };
  }
  if (modelLoadFailed) return null;
  if (isModelLoading) {
    // Wait briefly if another request is loading the model
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 200));
      if (rmbgModel && rmbgProcessor) return { model: rmbgModel, processor: rmbgProcessor };
    }
  }

  isModelLoading = true;
  try {
    const { AutoModel, AutoProcessor, env } = await import("@huggingface/transformers");

    const cacheDir = path.join(os.tmpdir(), ".transformers-cache");
    env.cacheDir = cacheDir;

    // Check for offline bundled model in repository
    const localModelDir = path.join(process.cwd(), "src", "lib", "ai", "models", "rmbg-1.4");
    const modelSource = localModelDir;

    const [model, processor] = await Promise.all([
      AutoModel.from_pretrained(modelSource),
      AutoProcessor.from_pretrained(modelSource),
    ]);

    rmbgModel = model;
    rmbgProcessor = processor;
    isModelLoading = false;
    return { model, processor };
  } catch (err) {
    console.warn("[BackgroundRemoval] Failed to load RMBG-1.4 neural model:", err);
    modelLoadFailed = true;
    isModelLoading = false;
    return null;
  }
}

/**
 * Deep Learning Neural Background Removal using BRIA RMBG-1.4.
 * Excels at complex real-world scenes: coats on mannequins, shoes on pedestals,
 * clothes on people, and textured room backgrounds.
 */
async function removeBackgroundNeural(imageBuffer: Buffer): Promise<Buffer | null> {
  const neural = await getRMBGModel();
  if (!neural) return null;

  try {
    const { RawImage } = await import("@huggingface/transformers");

    // Resize input image to 1024px max dimension for fast, high-res segmentation
    const origSharp = sharp(imageBuffer).rotate();
    const meta = await origSharp.metadata();
    const origW = meta.width || 800;
    const origH = meta.height || 800;

    const maxDim = 1024;
    const targetW = origW >= origH ? Math.min(maxDim, origW) : Math.round((origW / origH) * Math.min(maxDim, origH));
    const targetH = origH > origW ? Math.min(maxDim, origH) : Math.round((origH / origW) * Math.min(maxDim, origW));

    const optimizedPng = await origSharp
      .resize(targetW, targetH, { fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();

    const rawImage = await RawImage.fromBlob(new Blob([optimizedPng], { type: "image/png" }));
    const { pixel_values } = await neural.processor(rawImage);
    const { output } = await neural.model({ input: pixel_values });

    // Extract mask tensor [1, 1024, 1024] -> resize to image dimensions
    const mask = await RawImage.fromTensor(output[0].mul(255).to("uint8")).resize(rawImage.width, rawImage.height);
    const maskBuffer = Buffer.from(mask.data);

    // Composite mask onto alpha channel
    const { data: rawImgData, info } = await sharp(optimizedPng)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const outData = Buffer.from(rawImgData);
    let transparentCount = 0;

    for (let i = 0; i < maskBuffer.length; i++) {
      const alphaVal = maskBuffer[i];
      outData[i * 4 + 3] = alphaVal;
      if (alphaVal < 30) transparentCount++;
    }

    // Verify neural model isolated meaningful background
    const totalPixels = info.width * info.height;
    if (transparentCount < totalPixels * 0.05) {
      // If neural model cleared less than 5%, it may have been ambiguous
      return null;
    }

    // Auto-trim transparent space and pad with balanced 4% studio margin
    const trimmed = await sharp(outData, {
      raw: { width: info.width, height: info.height, channels: 4 },
    })
      .trim({ threshold: 8 })
      .png({ quality: 95 })
      .toBuffer();

    const trimmedMeta = await sharp(trimmed).metadata();
    const padW = Math.max(14, Math.round((trimmedMeta.width || 300) * 0.04));
    const padH = Math.max(14, Math.round((trimmedMeta.height || 300) * 0.04));

    const studioCutout = await sharp(trimmed)
      .extend({
        top: padH,
        bottom: padH,
        left: padW,
        right: padW,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({ quality: 95, compressionLevel: 6 })
      .toBuffer();

    return studioCutout;
  } catch (err) {
    console.warn("[BackgroundRemoval] Neural segmentation execution failed, falling back:", err);
    return null;
  }
}

/**
 * Intelligent Connected-Border Bilinear Fallback Segmentation Engine.
 */
async function removeBackgroundHeuristic(
  workingBuffer: Buffer
): Promise<Buffer> {
  const sharpInstance = sharp(workingBuffer).rotate();
  const meta = await sharpInstance.metadata();
  const origWidth = meta.width || 600;
  const origHeight = meta.height || 600;

  const maxDim = 900;
  const processWidth = origWidth > origHeight
    ? Math.min(maxDim, origWidth)
    : Math.round((origWidth / origHeight) * Math.min(maxDim, origHeight));
  const processHeight = origHeight >= origWidth
    ? Math.min(maxDim, origHeight)
    : Math.round((origHeight / origWidth) * Math.min(maxDim, origWidth));

  const { data, info } = await sharpInstance
    .resize(processWidth, processHeight, { fit: "inside", withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;

  const cornerSize = Math.max(3, Math.min(15, Math.floor(Math.min(w, h) * 0.04)));

  function getAveragePatch(startX: number, startY: number): [number, number, number] {
    let r = 0, g = 0, b = 0, count = 0;
    for (let y = startY; y < startY + cornerSize && y < h; y++) {
      for (let x = startX; x < startX + cornerSize && x < w; x++) {
        const idx = (y * w + x) * 4;
        r += data[idx];
        g += data[idx + 1];
        b += data[idx + 2];
        count++;
      }
    }
    return count > 0 ? [r / count, g / count, b / count] : [245, 245, 245];
  }

  const cTL = getAveragePatch(0, 0);
  const cTR = getAveragePatch(w - cornerSize, 0);
  const cBL = getAveragePatch(0, h - cornerSize);
  const cBR = getAveragePatch(w - cornerSize, h - cornerSize);

  const borderSamples: Array<[number, number, number]> = [];
  const step = Math.max(1, Math.floor(Math.max(w, h) / 80));

  for (let x = 0; x < w; x += step) {
    const idxT = (0 * w + x) * 4;
    borderSamples.push([data[idxT], data[idxT + 1], data[idxT + 2]]);
    const idxB = ((h - 1) * w + x) * 4;
    borderSamples.push([data[idxB], data[idxB + 1], data[idxB + 2]]);
  }
  for (let y = 0; y < h; y += step) {
    const idxL = (y * w + 0) * 4;
    borderSamples.push([data[idxL], data[idxL + 1], data[idxL + 2]]);
    const idxR = (y * w + (w - 1)) * 4;
    borderSamples.push([data[idxR], data[idxR + 1], data[idxR + 2]]);
  }

  function getExpectedBg(x: number, y: number): [number, number, number] {
    const u = x / Math.max(1, w - 1);
    const v = y / Math.max(1, h - 1);
    const r = (1 - u) * (1 - v) * cTL[0] + u * (1 - v) * cTR[0] + (1 - u) * v * cBL[0] + u * v * cBR[0];
    const g = (1 - u) * (1 - v) * cTL[1] + u * (1 - v) * cTR[1] + (1 - u) * v * cBL[1] + u * v * cBR[1];
    const b = (1 - u) * (1 - v) * cTL[2] + u * (1 - v) * cTR[2] + (1 - u) * v * cBL[2] + u * v * cBR[2];
    return [r, g, b];
  }

  let totalVar = 0;
  for (const [r, g, b] of borderSamples) {
    const dTL = Math.sqrt((r - cTL[0]) ** 2 + (g - cTL[1]) ** 2 + (b - cTL[2]) ** 2);
    const dTR = Math.sqrt((r - cTR[0]) ** 2 + (g - cTR[1]) ** 2 + (b - cTR[2]) ** 2);
    const dBL = Math.sqrt((r - cBL[0]) ** 2 + (g - cBL[1]) ** 2 + (b - cBL[2]) ** 2);
    const dBR = Math.sqrt((r - cBR[0]) ** 2 + (g - cBR[1]) ** 2 + (b - cBR[2]) ** 2);
    totalVar += Math.min(dTL, dTR, dBL, dBR);
  }
  const avgVar = borderSamples.length > 0 ? totalVar / borderSamples.length : 10;
  const threshold = Math.max(26, Math.min(68, 28 + avgVar * 0.75));
  const featherBand = 10;

  const mask = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let qHead = 0;
  let qTail = 0;

  function getDistanceToBg(x: number, y: number): number {
    const idx = (y * w + x) * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const a = data[idx + 3];
    if (a < 20) return 0;
    const [bgR, bgG, bgB] = getExpectedBg(x, y);
    return Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
  }

  function isBorderBg(x: number, y: number): boolean {
    return getDistanceToBg(x, y) <= threshold;
  }

  for (let x = 0; x < w; x++) {
    if (isBorderBg(x, 0)) {
      mask[0 * w + x] = 1;
      queue[qTail++] = 0 * w + x;
    }
    if (isBorderBg(x, h - 1)) {
      mask[(h - 1) * w + x] = 1;
      queue[qTail++] = (h - 1) * w + x;
    }
  }
  for (let y = 0; y < h; y++) {
    if (mask[y * w + 0] === 0 && isBorderBg(0, y)) {
      mask[y * w + 0] = 1;
      queue[qTail++] = y * w + 0;
    }
    if (mask[y * w + (w - 1)] === 0 && isBorderBg(w - 1, y)) {
      mask[y * w + (w - 1)] = 1;
      queue[qTail++] = y * w + (w - 1);
    }
  }

  while (qHead < qTail) {
    const pos = queue[qHead++];
    const x = pos % w;
    const y = Math.floor(pos / w);
    const neighbors = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
        const nPos = ny * w + nx;
        if (mask[nPos] === 0 && isBorderBg(nx, ny)) {
          mask[nPos] = 1;
          queue[qTail++] = nPos;
        }
      }
    }
  }

  const outData = Buffer.from(data);
  let backgroundPixels = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const pos = y * w + x;
      const idx = pos * 4;

      if (mask[pos] === 1) {
        outData[idx + 3] = 0;
        backgroundPixels++;
      } else {
        const isBoundary =
          (x > 0 && mask[pos - 1] === 1) ||
          (x < w - 1 && mask[pos + 1] === 1) ||
          (y > 0 && mask[pos - w] === 1) ||
          (y < h - 1 && mask[pos + w] === 1);

        if (isBoundary) {
          const dist = getDistanceToBg(x, y);
          if (dist < threshold + featherBand) {
            const alphaFactor = Math.max(0.35, Math.min(1, (dist - (threshold - 6)) / (featherBand + 6)));
            outData[idx + 3] = Math.round(data[idx + 3] * alphaFactor);
          }
        }
      }
    }
  }

  if (backgroundPixels < (w * h) * 0.05) {
    return sharp(workingBuffer).png().toBuffer();
  }

  const trimmed = await sharp(outData, {
    raw: { width: w, height: h, channels: 4 },
  })
    .trim({ threshold: 8 })
    .png({ quality: 95 })
    .toBuffer();

  const trimmedMeta = await sharp(trimmed).metadata();
  const padW = Math.max(14, Math.round((trimmedMeta.width || 300) * 0.04));
  const padH = Math.max(14, Math.round((trimmedMeta.height || 300) * 0.04));

  return sharp(trimmed)
    .extend({
      top: padH,
      bottom: padH,
      left: padW,
      right: padW,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ quality: 95, compressionLevel: 6 })
    .toBuffer();
}

/**
 * Main Studio Background Removal Entrypoint.
 * Prioritizes RMBG-1.4 Neural Segmentation, then falls back to Connected-Border Segmentation.
 */
export async function removeBackground(
  imageBuffer: Buffer,
  options?: BackgroundRemovalOptions
): Promise<Buffer> {
  try {
    let workingBuffer = imageBuffer;

    // Optional Bounding Box Pre-Cropping if specific sub-garment isolation is required
    if (options?.box_2d && Array.isArray(options.box_2d) && options.box_2d.length === 4) {
      const meta = await sharp(workingBuffer).metadata();
      const origW = meta.width || 1000;
      const origH = meta.height || 1000;

      const [ymin, xmin, ymax, xmax] = options.box_2d;
      const padY = Math.round(origH * 0.02);
      const padX = Math.round(origW * 0.02);

      const top = Math.max(0, Math.floor((ymin / 1000) * origH) - padY);
      const left = Math.max(0, Math.floor((xmin / 1000) * origW) - padX);
      const bottom = Math.min(origH, Math.ceil((ymax / 1000) * origH) + padY);
      const right = Math.min(origW, Math.ceil((xmax / 1000) * origW) + padX);

      const cropW = right - left;
      const cropH = bottom - top;

      if (cropW > 60 && cropH > 60 && (cropW < origW * 0.98 || cropH < origH * 0.98)) {
        workingBuffer = await sharp(workingBuffer)
          .extract({ left, top, width: cropW, height: cropH })
          .toBuffer();
      }
    }

    // 1. Try SOTA Neural Segmentation with RMBG-1.4
    const neuralCutout = await removeBackgroundNeural(workingBuffer);
    if (neuralCutout) {
      return neuralCutout;
    }

    // 2. Intelligent Connected-Border Fallback
    return await removeBackgroundHeuristic(workingBuffer);
  } catch (error) {
    console.warn("[BackgroundRemoval] Error in pipeline, returning clean PNG:", error);
    return sharp(imageBuffer).png().toBuffer();
  }
}
