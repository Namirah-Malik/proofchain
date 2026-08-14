import type { EvidenceGapReason, EvidenceItem, Source, VerificationState } from "@/lib/types";

export function detectEvidenceGaps(
  evidence: EvidenceItem[],
  sources: Source[]
): EvidenceGapReason[] {
  const gaps: EvidenceGapReason[] = [];
  const supporting = evidence.filter((e) => e.relation === "supports");
  const contradicting = evidence.filter((e) => e.relation === "contradicts");

  if (evidence.length === 0) {
    gaps.push({
      reason: "No authoritative source found",
      detail: "The retrieval layer did not return any sources related to this claim.",
    });
    return gaps;
  }

  const highAuthority = sources.filter((s) => s.credibilityScore >= 75);
  if (highAuthority.length === 0) {
    gaps.push({
      reason: "Only low-authority sources found",
      detail: "No government, academic, established-news, or fact-checking source was retrieved for this claim.",
    });
  }

  if (supporting.length > 0 && contradicting.length > 0) {
    gaps.push({
      reason: "Sources contradict each other",
      detail: `${supporting.length} source(s) support the claim while ${contradicting.length} contradict it.`,
    });
  }

  const undated = sources.filter((s) => !s.publishedAt);
  if (undated.length === sources.length && sources.length > 0) {
    gaps.push({
      reason: "Evidence dates unknown",
      detail: "None of the retrieved sources have a verifiable publish date, so freshness cannot be assessed.",
    });
  }

  const unverified = evidence.filter((e) => !e.verified);
  if (unverified.length > 0) {
    gaps.push({
      reason: "Some evidence could not be independently verified",
      detail: `${unverified.length} evidence item(s) are marked UNVERIFIED.`,
    });
  }

  return gaps;
}

export function generateConclusion(params: {
  mainClaim: string;
  state: VerificationState;
  score: number;
  supporting: EvidenceItem[];
  contradicting: EvidenceItem[];
  sources: Source[];
  gaps: EvidenceGapReason[];
}): string {
  const { mainClaim, state, score, supporting, contradicting, sources, gaps } = params;
  const sourceById = new Map(sources.map((s) => [s.id, s]));

  const topSupport = supporting
    .slice()
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 2)
    .map((e) => sourceById.get(e.sourceId)?.publisher)
    .filter(Boolean);
  const topContradict = contradicting
    .slice()
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 2)
    .map((e) => sourceById.get(e.sourceId)?.publisher)
    .filter(Boolean);

  const stateSentence: Record<VerificationState, string> = {
    SUPPORTED: `The retrieved evidence consistently supports the claim "${mainClaim}", with no contradicting evidence found.`,
    MOSTLY_SUPPORTED: `Most retrieved evidence supports the claim "${mainClaim}", though not every signal is conclusive.`,
    MIXED_EVIDENCE: `Retrieved evidence is mixed on the claim "${mainClaim}" — some sources support it, others do not.`,
    INSUFFICIENT_EVIDENCE: `There is not enough authoritative evidence to assess the claim "${mainClaim}" one way or the other.`,
    MOSTLY_CONTRADICTED: `Most retrieved evidence contradicts the claim "${mainClaim}".`,
    CONTRADICTED: `The retrieved evidence directly contradicts the claim "${mainClaim}".`,
    UNVERIFIED: `No evidence could be retrieved to evaluate the claim "${mainClaim}".`,
  };

  const parts: string[] = [stateSentence[state]];

  if (topSupport.length > 0) {
    parts.push(`Supporting: ${topSupport.join(", ")}.`);
  }
  if (topContradict.length > 0) {
    parts.push(`Contradicting: ${topContradict.join(", ")}.`);
  }
  parts.push(`Evidence Score: ${score}/100 — this reflects source authority, agreement, independence, freshness, and directness, not a probability of truth.`);
  if (gaps.length > 0) {
    parts.push(`Evidence gaps: ${gaps.map((g) => g.reason).join("; ")}.`);
  }

  return parts.join(" ");
}
