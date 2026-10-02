import sharp from "sharp";
import { execFile } from "child_process";
import path from "path";
import fs from "fs/promises";
import os from "os";
import { v4 as uuidv4 } from "uuid";

export interface BackgroundRemovalOptions {
  box_2d?: [number, number, number, number]; // [ymin, xmin, ymax, xmax] normalized 0..1000
}

/**
 * Executes neural background removal via an isolated child worker.
 * Process isolation prevents native DLL/GLib runtime collisions with Sharp and Next.js.
 */
async function runNeuralBgRemovalWorker(inputPath: string, outputPath: string): Promise<void> {
  const workerScript = path.join(process.cwd(), "src", "lib", "ai", "imgly-worker.js");

  return new Promise((resolve, reject) => {
    execFile(
      process.execPath,
      [workerScript, inputPath, outputPath],
      { timeout: 35000 },
      (error, stdout, stderr) => {
        if (error) {
          console.warn("[BackgroundRemoval] Worker error:", stderr || error.message);
          return reject(error);
        }
        resolve();
      }
    );
  });
}

/**
 * State-of-the-Art Neural Garment Segmentation & Studio Cutout.
 *
 * 1. Deep Learning Segmentation: Uses U-Net/IS-Net neural network (@imgly/background-removal-node)
 *    to accurately separate complex garment boundaries, fine textures, white footwear on light backgrounds,
 *    and knit patterns without color-bleed or false transparency.
 * 2. Process-Isolated Execution: Runs in an isolated Node child process to ensure 100% memory reclamation
 *    and eliminate binary runtime library clashes.
 * 3. Studio Auto-Trim & Proportional Margins: Trims excess empty transparent canvas and pads with
 *    a clean 3% studio breathing room for balanced flat-lay composition.
 * 4. Resilient Fallback: If neural removal fails or times out, safely preserves the original image.
 */
export async function removeBackground(
  imageBuffer: Buffer,
  options?: BackgroundRemovalOptions
): Promise<Buffer> {
  const tempId = uuidv4();
  const tempInput = path.join(os.tmpdir(), `closetmix_in_${tempId}.png`);
  const tempOutput = path.join(os.tmpdir(), `closetmix_out_${tempId}.png`);

  try {
    let workingBuffer = imageBuffer;

    // Optional Bounding Box Pre-Cropping if specific sub-garment isolation is required
    if (options?.box_2d && Array.isArray(options.box_2d) && options.box_2d.length === 4) {
      const meta = await sharp(workingBuffer).metadata();
      const origW = meta.width || 1000;
      const origH = meta.height || 1000;

      const [ymin, xmin, ymax, xmax] = options.box_2d;
      const padY = Math.round(origH * 0.015);
      const padX = Math.round(origW * 0.015);

      const top = Math.max(0, Math.floor((ymin / 1000) * origH) - padY);
      const left = Math.max(0, Math.floor((xmin / 1000) * origW) - padX);
      const bottom = Math.min(origH, Math.ceil((ymax / 1000) * origH) + padY);
      const right = Math.min(origW, Math.ceil((xmax / 1000) * origW) + padX);

      const cropW = right - left;
      const cropH = bottom - top;

      if (cropW > 80 && cropH > 80 && (cropW < origW * 0.96 || cropH < origH * 0.96)) {
        workingBuffer = await sharp(workingBuffer)
          .extract({ left, top, width: cropW, height: cropH })
          .toBuffer();
      }
    }

    // Write input image to temp file for neural model
    await sharp(workingBuffer).png().toFile(tempInput);

    // Run neural segmentation model
    await runNeuralBgRemovalWorker(tempInput, tempOutput);

    // Read segmented PNG
    const segmentedBuffer = await fs.readFile(tempOutput);
    const meta = await sharp(segmentedBuffer).metadata();

    const w = meta.width || 500;
    const h = meta.height || 500;

    // Auto-trim transparent padding and apply proportional 3% studio margin
    const finalBuffer = await sharp(segmentedBuffer)
      .trim({ threshold: 10 })
      .extend({
        top: Math.max(10, Math.round(h * 0.03)),
        bottom: Math.max(10, Math.round(h * 0.03)),
        left: Math.max(10, Math.round(w * 0.03)),
        right: Math.max(10, Math.round(w * 0.03)),
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({ quality: 95, compressionLevel: 6 })
      .toBuffer();

    return finalBuffer;
  } catch (error) {
    console.warn("[BackgroundRemoval] Neural removal encountered error, falling back to original:", error);
    return sharp(imageBuffer).png().toBuffer();
  } finally {
    // Clean up temporary files
    try {
      await fs.unlink(tempInput).catch(() => {});
      await fs.unlink(tempOutput).catch(() => {});
    } catch {}
  }
}
