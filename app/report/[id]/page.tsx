import { notFound } from "next/navigation";
import Link from "next/link";
import { getVerification } from "@/lib/store";
import { StateBadge } from "@/components/verification/StateBadge";
import { EvidenceCard } from "@/components/evidence/EvidenceCard";
import { CredibilityStars } from "@/components/evidence/CredibilityStars";
import { ScoreDial, ScoreFactorList } from "@/components/report/ScoreBreakdown";
import { StageTracker } from "@/components/verification/StageTracker";
import { EvidenceGraphView } from "@/components/graph/EvidenceGraphView";
import { Reveal } from "@/components/ui/Reveal";
import { AlertTriangle, ShieldCheck, FileWarning } from "lucide-react";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = getVerification(id);
  if (!record) notFound();

  const supporting = record.evidence.filter((e) => e.relation === "supports");
  const contradicting = record.evidence.filter((e) => e.relation === "contradicts");
  const inconclusive = record.evidence.filter((e) => e.relation === "inconclusive");
  const sourceById = new Map(record.sources.map((s) => [s.id, s]));

  return (
    <div className="bg-paper flex-1">
      <div className="mx-auto max-w-5xl px-6 py-12">
        {record.isDemo && (
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-evramber-soft text-evramber text-xs font-mono-data uppercase tracking-wide px-3 py-1.5">
            <ShieldCheck size={13} /> Demo data — illustrative, not a live verification
          </div>
        )}

        {/* Header */}
        <Reveal as="div">
          <header className="mb-10">
            <p className="font-mono-data text-xs uppercase tracking-widest text-ink-soft mb-3">Verification Report</p>
            <h1 className="font-display text-3xl md:text-4xl leading-tight text-navy-900 text-balance mb-5">
              &ldquo;{record.mainClaim ?? record.originalInput}&rdquo;
            </h1>
            <div className="flex flex-wrap items-center gap-4">
              <StateBadge state={record.state} size="lg" />
              <span className="text-xs text-ink-soft font-mono-data">
                Verified {new Date(record.createdAt).toLocaleString()}
              </span>
              <span className="text-xs text-ink-soft font-mono-data">
                LLM: {record.usedProviders.llm} · Search: {record.usedProviders.search} · OCR: {record.usedProviders.ocr}
              </span>
            </div>
          </header>
        </Reveal>

        {record.error && (
          <div className="mb-8 rounded-lg border border-evrred bg-evrred-soft text-evrred p-4 text-sm flex gap-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>{record.error}</span>
          </div>
        )}

        {/* Score + conclusion */}
        <section className="grid md:grid-cols-[auto_1fr] gap-8 items-start mb-14 rule pt-10">
          <div className="relative">{record.score && <ScoreDial score={record.score} />}</div>
          <Reveal>
            <h2 className="font-display text-xl text-navy-900 mb-2">Conclusion</h2>
            <p className="text-[15px] leading-relaxed text-ink/90">{record.conclusion}</p>
          </Reveal>
        </section>

        {/* Atomic claims */}
        {record.atomicClaims.length > 0 && (
          <section className="mb-14 rule pt-10">
            <Reveal>
              <h2 className="font-display text-xl text-navy-900 mb-4">Atomic Claims</h2>
              <ol className="space-y-2">
                {record.atomicClaims.map((c, i) => (
                  <li key={c.id} className="flex items-start gap-3 text-sm">
                    <span className="font-mono-data text-ink-soft shrink-0 mt-0.5">{i + 1}.</span>
                    <div>
                      <span className="text-ink">{c.text}</span>
                      <span className="ml-2 text-xs font-mono-data text-ink-soft uppercase">
                        {c.category} · {c.importance} priority
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </Reveal>
          </section>
        )}

        {/* Supporting / Contradicting evidence */}
        <section className="mb-14 rule pt-10 grid md:grid-cols-2 gap-8">
          <Reveal>
            <h2 className="font-display text-xl text-evrgreen mb-4">Supporting Evidence</h2>
            {supporting.length === 0 ? (
              <p className="text-sm text-ink-soft">No supporting evidence found.</p>
            ) : (
              <div className="space-y-3">
                {supporting.map((e) => (
                  <EvidenceCard key={e.id} evidence={e} source={sourceById.get(e.sourceId)} />
                ))}
              </div>
            )}
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="font-display text-xl text-evrred mb-4">Contradicting Evidence</h2>
            {contradicting.length === 0 ? (
              <p className="text-sm text-ink-soft">No contradicting evidence found.</p>
            ) : (
              <div className="space-y-3">
                {contradicting.map((e) => (
                  <EvidenceCard key={e.id} evidence={e} source={sourceById.get(e.sourceId)} />
                ))}
              </div>
            )}
          </Reveal>
        </section>

        {inconclusive.length > 0 && (
          <section className="mb-14 rule pt-10">
            <Reveal>
              <h2 className="font-display text-xl text-evramber mb-4">Inconclusive Evidence</h2>
              <div className="grid md:grid-cols-2 gap-3">
                {inconclusive.map((e) => (
                  <EvidenceCard key={e.id} evidence={e} source={sourceById.get(e.sourceId)} />
                ))}
              </div>
            </Reveal>
          </section>
        )}

        {/* Source quality */}
        {record.sources.length > 0 && (
          <section className="mb-14 rule pt-10">
            <h2 className="font-display text-xl text-navy-900 mb-4">Source Quality</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-ink-soft font-mono-data border-b border-[var(--pc-hairline)]">
                    <th className="py-2 pr-4">Publisher</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Credibility</th>
                    <th className="py-2 pr-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {record.sources.map((s) => (
                    <tr key={s.id} className="border-b border-[var(--pc-hairline)] last:border-0">
                      <td className="py-2.5 pr-4">
                        <a href={s.url} target="_blank" rel="noreferrer" className="text-navy-900 hover:text-teal underline">
                          {s.publisher}
                        </a>
                      </td>
                      <td className="py-2.5 pr-4 capitalize text-ink-soft">{s.sourceType.replace("_", " ")}</td>
                      <td className="py-2.5 pr-4">
                        <CredibilityStars score={s.credibilityScore} />
                      </td>
                      <td className="py-2.5 pr-4 text-ink-soft font-mono-data">{s.publishedAt ?? "Unknown"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Evidence graph */}
        {record.graph && record.graph.nodes.length > 1 && (
          <section className="mb-14 rule pt-10">
            <Reveal>
              <h2 className="font-display text-xl text-navy-900 mb-1">Evidence Graph</h2>
              <p className="text-xs text-ink-soft mb-4">Click a source node to inspect its evidence.</p>
              <EvidenceGraphView graph={record.graph} sources={record.sources} evidence={record.evidence} />
            </Reveal>
          </section>
        )}

        {/* Score breakdown */}
        {record.score && (
          <section className="mb-14 rule pt-10">
            <Reveal>
              <h2 className="font-display text-xl text-navy-900 mb-4">Evidence Score Breakdown</h2>
              <ScoreFactorList score={record.score} />
            </Reveal>
          </section>
        )}

        {/* Provenance */}
        {record.provenance && (
          <section className="mb-14 rule pt-10">
            <Reveal>
              <h2 className="font-display text-xl text-navy-900 mb-4">Provenance</h2>
              <div className="rounded-lg border border-[var(--pc-hairline)] bg-white p-4 text-sm space-y-2">
                <div className="font-mono-data text-xs break-all">
                  <span className="text-ink-soft">SHA-256: </span>
                  {record.provenance.sha256}
                </div>
                <div className="text-ink-soft text-xs font-mono-data">
                  {record.provenance.mimeType} · {(record.provenance.sizeBytes / 1024).toFixed(1)} KB
                </div>
                <div className="text-xs">
                  <span className="text-ink-soft">C2PA Content Credentials: </span>
                  <span className="capitalize">{record.provenance.c2pa.replace("_", " ")}</span>
                </div>
                <div className="text-xs">
                  <span className="text-ink-soft">EXIF metadata: </span>
                  {record.provenance.signalsAvailable ? "Present" : "Not available"}
                </div>
                <ul className="pt-2 mt-2 border-t border-[var(--pc-hairline)] space-y-1">
                  {record.provenance.notes.map((n, i) => (
                    <li key={i} className="text-xs text-ink-soft">
                      · {n}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </section>
        )}

        {/* Integrity */}
        {record.integrity && record.integrity.status !== "not_applicable" && (
          <section className="mb-14 rule pt-10">
            <Reveal>
              <h2 className="font-display text-xl text-navy-900 mb-4">Integrity</h2>
              <div className="rounded-lg border border-[var(--pc-hairline)] bg-white p-4 text-sm">
                <div
                  className="font-medium mb-3"
                  style={{ color: record.integrity.status === "warning" ? "var(--pc-amber)" : "var(--pc-green)" }}
                >
                  {record.integrity.status === "warning" ? "⚠️" : "🟢"} {record.integrity.headline}
                </div>
                {record.integrity.signals.length > 0 && (
                  <ul className="space-y-2 mb-3">
                    {record.integrity.signals.map((s, i) => (
                      <li key={i} className="text-xs">
                        <span className="font-medium text-ink">{s.label}: </span>
                        <span className="text-ink-soft">{s.detail}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-xs text-ink-soft pt-2 border-t border-[var(--pc-hairline)] italic">
                  {record.integrity.disclaimer}
                </p>
              </div>
            </Reveal>
          </section>
        )}

        {/* Evidence gap */}
        {record.evidenceGaps.length > 0 && (
          <section className="mb-14 rule pt-10">
            <Reveal>
              <h2 className="font-display text-xl text-navy-900 mb-4 flex items-center gap-2">
                <FileWarning size={18} className="text-evramber" /> Evidence Gap
              </h2>
              <div className="space-y-2">
                {record.evidenceGaps.map((g, i) => (
                  <div key={i} className="rounded-lg border border-evramber/30 bg-evramber-soft p-3 text-sm">
                    <span className="font-medium text-evramber">{g.reason}</span>
                    <p className="text-ink-soft text-xs mt-1">{g.detail}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </section>
        )}

        {/* Source trail / pipeline stages */}
        <section className="mb-14 rule pt-10">
          <Reveal>
            <h2 className="font-display text-xl text-navy-900 mb-4">Evidence Trail</h2>
            <StageTracker stages={record.stages} />
          </Reveal>
        </section>

        <div className="flex gap-3 pt-6 rule">
          <Link
            href="/verify"
            className="rounded-full bg-navy-900 text-paper px-5 py-2.5 text-sm font-medium transition-all hover:bg-teal hover:scale-[1.03] active:scale-[0.98]"
          >
            Verify another claim
          </Link>
          <Link
            href="/history"
            className="rounded-full border border-[var(--pc-hairline)] px-5 py-2.5 text-sm font-medium text-ink-soft transition-all hover:border-navy-700 hover:scale-[1.03] active:scale-[0.98]"
          >
            View history
          </Link>
        </div>
      </div>
    </div>
  );
}
