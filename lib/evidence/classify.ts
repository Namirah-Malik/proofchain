import type { EvidenceRelation } from "@/lib/types";

// When the search provider doesn't tell us ground-truth relation (i.e. any
// real provider), classify supports/contradicts/inconclusive from lexical
// cues in the retrieved snippet. This is intentionally conservative: it
// only calls something "contradicts" on an explicit negation/debunk signal,
// and defaults to "inconclusive" rather than guessing "supports" -- because
// silently defaulting to "supports" would bias every claim toward looking
// true, which is the opposite of what a verification tool should do.

const CONTRADICT_SIGNALS = [
  /\bfalse\b/i,
  /\bfabricated\b/i,
  /\bhoax\b/i,
  /\bdebunk/i,
  /\bno evidence\b/i,
  /\bnot true\b/i,
  /\bdenies?\b/i,
  /\bdenied\b/i,
  /\bmisleading\b/i,
  /\bincorrect\b/i,
  /\bunsupported\b/i,
  /\bmisrepresents?\b/i,
  /\bhas not\b/i,
  /\bdid not\b/i,
];

const SUPPORT_SIGNALS = [
  /\bconfirm(s|ed)?\b/i,
  /\bverified\b/i,
  /\baccording to official\b/i,
  /\btrue\b/i,
  /\bcorrect\b/i,
];

export function classifyRelation(snippet: string, title: string): EvidenceRelation {
  const text = `${title} ${snippet}`;
  if (CONTRADICT_SIGNALS.some((r) => r.test(text))) return "contradicts";
  if (SUPPORT_SIGNALS.some((r) => r.test(text))) return "supports";
  return "inconclusive";
}

export function classifyDirectness(
  claimText: string,
  snippet: string
): "direct" | "indirect" {
  const claimWords = claimText
    .toLowerCase()
    .replace(/[^\w\s₹]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 4);
  const snippetLower = snippet.toLowerCase();
  const overlap = claimWords.filter((w) => snippetLower.includes(w)).length;
  const ratio = claimWords.length > 0 ? overlap / claimWords.length : 0;
  return ratio >= 0.25 ? "direct" : "indirect";
}

export function evidenceStrength(
  relation: EvidenceRelation,
  directness: "direct" | "indirect",
  credibilityScore: number
): number {
  const relationWeight = relation === "inconclusive" ? 0.5 : 1;
  const directnessWeight = directness === "direct" ? 1 : 0.6;
  return Math.round(credibilityScore * relationWeight * directnessWeight);
}
