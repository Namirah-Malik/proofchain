import type { EvidenceItem, EvidenceScore, Source, VerificationState } from "@/lib/types";

// Evidence Score -- NOT a "truth probability". It is a transparent
// aggregation of measurable retrieval signals: how authoritative the
// sources are, how much they agree, how independent they are of each
// other, how fresh they are, and how directly they address the claim,
// net of a contradiction/uncertainty penalty.
//
// Formula (documented, not hidden inside an LLM call):
//
//   score = sourceAuthority(0-30)
//         + evidenceAgreement(0-25)
//         + sourceIndependence(0-15)
//         + freshness(0-10)
//         + directness(0-10)
//         + baseline(10)
//         - contradictionPenalty(0-25)
//         - uncertaintyPenalty(0-15)
//   clamped to [0, 100]

export function computeEvidenceScore(evidence: EvidenceItem[], sources: Source[]): EvidenceScore {
  const sourceById = new Map(sources.map((s) => [s.id, s]));
  const supporting = evidence.filter((e) => e.relation === "supports");
  const contradicting = evidence.filter((e) => e.relation === "contradicts");
  const inconclusive = evidence.filter((e) => e.relation === "inconclusive");

  const factors: EvidenceScore["factors"] = [];

  // Source authority: average credibility of sources actually cited.
  const citedSources = evidence
    .map((e) => sourceById.get(e.sourceId))
    .filter((s): s is Source => Boolean(s));
  const avgCredibility =
    citedSources.length > 0
      ? citedSources.reduce((sum, s) => sum + s.credibilityScore, 0) / citedSources.length
      : 0;
  const sourceAuthority = Math.round((avgCredibility / 100) * 30);
  factors.push({
    key: "sourceAuthority",
    label: "Source Authority",
    value: sourceAuthority,
    explanation: `Average credibility of ${citedSources.length} cited source(s): ${avgCredibility.toFixed(0)}/100.`,
  });

  // Evidence agreement: what fraction of evidence supports vs contradicts.
  const totalDirectional = supporting.length + contradicting.length;
  const agreementRatio = totalDirectional > 0 ? supporting.length / totalDirectional : 0.5;
  const evidenceAgreement = Math.round(agreementRatio * 25);
  factors.push({
    key: "evidenceAgreement",
    label: "Evidence Agreement",
    value: evidenceAgreement,
    explanation: `${supporting.length} supporting vs ${contradicting.length} contradicting item(s) found.`,
  });

  // Source independence: unique publishers as a fraction of citations.
  const uniquePublishers = new Set(citedSources.map((s) => s.publisher)).size;
  const independenceRatio = citedSources.length > 0 ? uniquePublishers / citedSources.length : 0;
  const sourceIndependence = Math.round(independenceRatio * 15);
  factors.push({
    key: "sourceIndependence",
    label: "Source Independence",
    value: sourceIndependence,
    explanation: `${uniquePublishers} independent publisher(s) among ${citedSources.length} citation(s).`,
  });

  // Freshness: sources with a known, recent publish date score higher.
  const now = Date.now();
  const datedSources = citedSources.filter((s) => s.publishedAt);
  const freshnessRatio =
    datedSources.length > 0
      ? datedSources.reduce((sum, s) => {
          const ageDays = (now - new Date(s.publishedAt as string).getTime()) / 86_400_000;
          return sum + Math.max(0, 1 - ageDays / 365);
        }, 0) / datedSources.length
      : 0.3; // unknown dates get a modest default, not zero, not full credit
  const freshness = Math.round(Math.max(0, Math.min(1, freshnessRatio)) * 10);
  factors.push({
    key: "freshness",
    label: "Freshness",
    value: freshness,
    explanation:
      datedSources.length > 0
        ? `${datedSources.length}/${citedSources.length} cited source(s) have a known publish date.`
        : "No cited sources have a known publish date; scored conservatively.",
  });

  // Directness: fraction of evidence items marked as directly addressing
  // the claim vs indirect/tangential.
  const directCount = evidence.filter((e) => e.directness === "direct").length;
  const directnessRatio = evidence.length > 0 ? directCount / evidence.length : 0;
  const directness = Math.round(directnessRatio * 10);
  factors.push({
    key: "directness",
    label: "Directness",
    value: directness,
    explanation: `${directCount}/${evidence.length} evidence item(s) directly address the claim (vs. indirect/related).`,
  });

  // Baseline: small constant so a single weak piece of evidence doesn't
  // floor at literal zero, which would read as "definitely false" rather
  // than "weakly supported."
  factors.push({
    key: "baseline",
    label: "Baseline",
    value: 10,
    explanation: "Fixed baseline so a thin evidence set doesn't score as if it were actively disproven.",
  });

  // Contradiction penalty: scales with how much contradicting evidence
  // exists relative to total, weighted by contradicting-source authority.
  const contradictingSources = contradicting
    .map((e) => sourceById.get(e.sourceId))
    .filter((s): s is Source => Boolean(s));
  const avgContradictCredibility =
    contradictingSources.length > 0
      ? contradictingSources.reduce((sum, s) => sum + s.credibilityScore, 0) / contradictingSources.length
      : 0;
  const contradictionPenalty =
    contradicting.length > 0
      ? Math.round(Math.min(25, (contradicting.length / Math.max(1, evidence.length)) * (avgContradictCredibility / 100) * 40))
      : 0;
  if (contradictionPenalty > 0) {
    factors.push({
      key: "contradictionPenalty",
      label: "Contradiction Penalty",
      value: -contradictionPenalty,
      explanation: `${contradicting.length} contradicting item(s), avg. source credibility ${avgContradictCredibility.toFixed(
        0
      )}/100.`,
    });
  }

  // Uncertainty penalty: unverified evidence and inconclusive items reduce
  // confidence without being a hard contradiction.
  const unverifiedCount = evidence.filter((e) => !e.verified).length;
  const uncertaintyPenalty = Math.round(
    Math.min(15, ((unverifiedCount + inconclusive.length) / Math.max(1, evidence.length)) * 20)
  );
  if (uncertaintyPenalty > 0) {
    factors.push({
      key: "uncertaintyPenalty",
      label: "Uncertainty Penalty",
      value: -uncertaintyPenalty,
      explanation: `${unverifiedCount} unverified and ${inconclusive.length} inconclusive evidence item(s).`,
    });
  }

  const total = Math.max(0, Math.min(100, factors.reduce((sum, f) => sum + f.value, 0)));

  return {
    total: Math.round(total),
    factors,
    formula:
      "sourceAuthority(0-30) + evidenceAgreement(0-25) + sourceIndependence(0-15) + freshness(0-10) + directness(0-10) + baseline(10) - contradictionPenalty(0-25) - uncertaintyPenalty(0-15), clamped to [0,100]",
  };
}

export function deriveVerificationState(
  score: number,
  supportingCount: number,
  contradictingCount: number,
  totalEvidence: number
): VerificationState {
  if (totalEvidence === 0) return "UNVERIFIED";
  if (supportingCount === 0 && contradictingCount === 0) return "INSUFFICIENT_EVIDENCE";

  const hasStrongContradiction = contradictingCount > 0 && contradictingCount >= supportingCount;

  if (hasStrongContradiction && score < 35) return "CONTRADICTED";
  if (hasStrongContradiction) return "MOSTLY_CONTRADICTED";
  if (score >= 75 && contradictingCount === 0) return "SUPPORTED";
  if (score >= 60) return "MOSTLY_SUPPORTED";
  if (score >= 40) return "MIXED_EVIDENCE";
  return "INSUFFICIENT_EVIDENCE";
}
