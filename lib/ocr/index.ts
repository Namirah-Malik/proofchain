// OCR layer. Default provider is Tesseract (via tesseract.js, pure JS/WASM,
// no system binary dependency so this works on Vercel-style deployments).
// The interface is intentionally narrow so a hosted OCR API can be dropped
// in later (e.g. Google Vision, Azure Read) without touching call sites.

import { createWorker } from "tesseract.js";

export interface OcrResult {
  text: string;
  confidence: number; // 0-100
  provider: "tesseract" | "none";
}

export async function runOcr(imageBuffer: Buffer): Promise<OcrResult> {
  try {
    const worker = await createWorker("eng");
    const {
      data: { text, confidence },
    } = await worker.recognize(imageBuffer);
    await worker.terminate();
    return { text: text.trim(), confidence, provider: "tesseract" };
  } catch (err) {
    console.error("OCR failed:", err);
    return { text: "", confidence: 0, provider: "none" };
  }
}
