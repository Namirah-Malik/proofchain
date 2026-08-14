import { imageSize } from "image-size";
import type { IntegrityCheck, ProvenanceCheck } from "@/lib/types";

const EDITING_SOFTWARE_HINTS = ["photoshop", "gimp", "snapseed", "picsart", "canva", "lightroom"];
const COMMON_SCREENSHOT_DIMENSIONS = [
  [1080, 2400], [1170, 2532], [1284, 2778], [1440, 3200], // phones
  [1920, 1080], [2560, 1440], [1366, 768], // desktops
];

const DISCLAIMER =
  "These are heuristic signals, not forensic proof. \"No obvious manipulation signals\" does NOT mean an image is authentic, and a flagged signal does NOT prove manipulation.";

export function checkIntegrity(
  buffer: Buffer,
  mimeType: string,
  provenance: ProvenanceCheck
): IntegrityCheck {
  if (!mimeType.startsWith("image/")) {
    return {
      status: "not_applicable",
      headline: "Integrity analysis applies to images only",
      signals: [],
      disclaimer: DISCLAIMER,
    };
  }

  const signals: IntegrityCheck["signals"] = [];

  // 1. Editing software fingerprints in EXIF, if present.
  const exif = provenance.exif;
  const softwareField = (exif?.["Software"] as string | undefined)?.toLowerCase() ?? "";
  const matchedEditor = EDITING_SOFTWARE_HINTS.find((hint) => softwareField.includes(hint));
  if (matchedEditor) {
    signals.push({
      label: "Editing software detected in metadata",
      detail: `EXIF "Software" field references ${matchedEditor}.`,
      severity: "warning",
    });
  }

  // 2. Missing EXIF entirely is common for screenshots/re-saves, worth
  //    surfacing as a neutral note (not necessarily a red flag).
  if (!provenance.signalsAvailable) {
    signals.push({
      label: "No EXIF metadata",
      detail: "Metadata is absent, consistent with a screenshot, re-save, or platform re-encode. Not itself evidence of manipulation.",
      severity: "info",
    });
  }

  // 3. Dimension check: is this a common screenshot resolution?
  try {
    const dims = imageSize(buffer);
    if (dims.width && dims.height) {
      const isScreenshotRes = COMMON_SCREENSHOT_DIMENSIONS.some(
        ([w, h]) =>
          (dims.width === w && dims.height === h) || (dims.width === h && dims.height === w)
      );
      if (isScreenshotRes) {
        signals.push({
          label: "Screenshot-typical dimensions",
          detail: `Image is ${dims.width}x${dims.height}, matching a common device screenshot resolution. Screenshots cannot be provenance-verified back to an original source.`,
          severity: "info",
        });
      }
    }
  } catch {
    signals.push({
      label: "Could not read image dimensions",
      detail: "File may be corrupted or an unsupported format.",
      severity: "warning",
    });
  }

  // 4. Crude compression-anomaly heuristic: very small file size relative
  //    to pixel count can indicate heavy re-compression (e.g. repeated
  //    screenshot-of-a-screenshot, common in misinformation forwarding).
  try {
    const dims = imageSize(buffer);
    if (dims.width && dims.height) {
      const pixels = dims.width * dims.height;
      const bytesPerPixel = buffer.length / pixels;
      if (bytesPerPixel < 0.15) {
        signals.push({
          label: "High compression relative to resolution",
          detail: `~${bytesPerPixel.toFixed(2)} bytes/pixel, suggesting heavy re-compression (e.g. repeated re-saving or forwarding). This degrades detail rather than proving edits.`,
          severity: "info",
        });
      }
    }
  } catch {
    // already reported above
  }

  const hasWarning = signals.some((s) => s.severity === "warning");
  return {
    status: hasWarning ? "warning" : signals.length > 0 ? "clean" : "no_signal",
    headline: hasWarning
      ? "Possible manipulation signals detected"
      : "No obvious manipulation signals detected",
    signals,
    disclaimer: DISCLAIMER,
  };
}
