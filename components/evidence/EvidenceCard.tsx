import type { EvidenceItem, Source } from "@/lib/types";
import { CredibilityStars } from "@/components/evidence/CredibilityStars";

const RELATION_META = {
  supports: { icon: "🟢", label: "Supporting", color: "var(--pc-green)" },
  contradicts: { icon: "🔴", label: "Contradicting", color: "var(--pc-red)" },
  inconclusive: { icon: "🟡", label: "Inconclusive", color: "var(--pc-amber)" },
};

export function EvidenceCard({ evidence, source }: { evidence: EvidenceItem; source: Source | undefined }) {
  const meta = RELATION_META[evidence.relation];
  if (!source) return null;

  return (
    <div className="border border-[var(--pc-hairline)] rounded-lg p-4 bg-white/60">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-navy-900 hover:text-teal underline decoration-[var(--pc-hairline)] underline-offset-4"
          >
            {source.publisher}
          </a>
          <div className="text-xs text-ink-soft mt-0.5">{source.title}</div>
        </div>
        <span
          className="shrink-0 text-xs font-mono-data uppercase tracking-wide rounded-full px-2 py-1"
          style={{ color: meta.color, backgroundColor: `${meta.color}14` }}
        >
          {meta.icon} {meta.label}
        </span>
      </div>

      <p className="text-sm text-ink/90 leading-relaxed mb-3">&ldquo;{evidence.snippet}&rdquo;</p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft font-mono-data">
        <span>Publisher: {source.publisher}</span>
        <span>Date: {source.publishedAt ?? "Unknown"}</span>
        <span className="flex items-center gap-1">
          Credibility: <CredibilityStars score={source.credibilityScore} />
        </span>
        <span>Directness: {evidence.directness}</span>
        {!evidence.verified && (
          <span className="text-[var(--pc-amber)] font-semibold">UNVERIFIED</span>
        )}
      </div>

      <div className="mt-2 pt-2 border-t border-[var(--pc-hairline)] text-xs text-ink-soft">
        <span className="font-semibold text-ink">Why selected: </span>
        {evidence.reasonSelected}
      </div>
    </div>
  );
}
