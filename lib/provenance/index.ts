import crypto from "crypto";
import { parse as parseExif } from "exifr";
import type { ProvenanceCheck } from "@/lib/types";

// Provenance signals never "prove" authenticity -- they are reported as
// available/unavailable data points for the user to weigh themselves.
export async function checkProvenance(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<ProvenanceCheck> {
  const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
  const notes: string[] = [];

  let exif: Record<string, unknown> | null = null;
  if (mimeType.startsWith("image/")) {
    try {
      const parsed = await parseExif(buffer);
      exif = parsed ?? null;
      if (!exif || Object.keys(exif).length === 0) {
        notes.push("No EXIF metadata found — common for screenshots, messaging-app re-saves, or stripped images.");
        exif = null;
      } else {
        notes.push("EXIF metadata present.");
        if (!("Make" in exif) && !("Software" in exif)) {
          notes.push("EXIF present but missing camera/software fields — inconclusive on its own.");
        }
      }
    } catch {
      notes.push("EXIF metadata could not be parsed.");
    }
  } else {
    notes.push("Provenance metadata extraction is currently image-focused; document metadata not analyzed.");
  }

  // C2PA (Content Credentials) verification requires the c2pa-node toolchain
  // and signed manifests from the originating capture device/app. Not wired
  // up in this hackathon build -- reported honestly as unavailable rather
  // than faked.
  const c2pa: ProvenanceCheck["c2pa"] = "not_available";
  notes.push("C2PA Content Credentials check not implemented in this build — reported as unavailable, not as 'no manifest found'.");

  return {
    fileName,
    mimeType,
    sizeBytes: buffer.length,
    sha256,
    exif,
    c2pa,
    signalsAvailable: exif !== null,
    notes,
  };
}
