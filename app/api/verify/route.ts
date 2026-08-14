import { NextRequest, NextResponse } from "next/server";
import { runVerificationPipeline } from "@/lib/pipeline/verify";
import { validateUpload } from "@/lib/security";

// Basic in-memory rate limiting (per-process; fine for a hackathon deploy).
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 12;
const requestLog = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(key) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  timestamps.push(now);
  requestLog.set(key, timestamps);
  return timestamps.length > RATE_LIMIT_MAX;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many verification requests. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  try {
    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");
      const forceDemo = formData.get("demo") === "true";

      if (!(file instanceof File)) {
        return NextResponse.json({ error: "No file provided." }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const validation = validateUpload(file.type, buffer.length);
      if (!validation.ok) {
        return NextResponse.json({ error: validation.reason }, { status: 400 });
      }

      const inputType = file.type === "application/pdf" ? "document" : "image";
      if (inputType === "document") {
        return NextResponse.json(
          {
            error:
              "Document (PDF) verification isn't wired into this build's OCR path yet — please paste the text claim instead, or upload it as an image screenshot.",
          },
          { status: 400 }
        );
      }

      const record = await runVerificationPipeline({
        inputType,
        fileBuffer: buffer,
        fileName: file.name,
        mimeType: file.type,
        forceDemo,
      });
      return NextResponse.json(record);
    }

    const body = await req.json();
    const text = typeof body.text === "string" ? body.text.trim() : "";
    const url = typeof body.url === "string" ? body.url.trim() : "";
    const forceDemo = Boolean(body.demo);

    if (url) {
      if (url.length > 2000) {
        return NextResponse.json({ error: "URL is too long." }, { status: 400 });
      }
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        return NextResponse.json({ error: "That doesn't look like a valid URL." }, { status: 400 });
      }
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return NextResponse.json({ error: "Only http(s) URLs are supported." }, { status: 400 });
      }

      const record = await runVerificationPipeline({ inputType: "url", url, forceDemo });
      return NextResponse.json(record);
    }

    if (!text) {
      return NextResponse.json({ error: "Please provide a claim or a URL to verify." }, { status: 400 });
    }
    if (text.length > 4000) {
      return NextResponse.json({ error: "Claim text is too long (max 4000 characters)." }, { status: 400 });
    }

    const record = await runVerificationPipeline({ inputType: "text", text, forceDemo });
    return NextResponse.json(record);
  } catch (err) {
    console.error("POST /api/verify failed:", err);
    return NextResponse.json(
      { error: "Verification could not be completed due to an internal error." },
      { status: 500 }
    );
  }
}
