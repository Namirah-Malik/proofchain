import Link from "next/link";
import { ArrowRight, ScanText, Search, GitCompareArrows, FileCheck2 } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { HeroContent } from "@/components/ui/HeroContent";
import { HeroVideo } from "@/components/ui/HeroVideo";
import { AnimatedCard } from "@/components/ui/AnimatedCard";

const STEPS = [
  {
    icon: ScanText,
    title: "Extract",
    body: "Pull the actual claim out of a pasted statement, a screenshot, a document, or a link — with OCR and entity detection.",
  },
  {
    icon: Search,
    title: "Retrieve",
    body: "Search trusted sources for evidence, on purpose looking for both agreement and disagreement.",
  },
  {
    icon: GitCompareArrows,
    title: "Cross-check",
    body: "Weigh source credibility, flag contradictions, and surface what's still unknown instead of guessing.",
  },
  {
    icon: FileCheck2,
    title: "Prove",
    body: "Produce a traceable report: every score, every source, every reason — inspectable end to end.",
  },
];

export default function Home() {
  return (
    <div className="bg-navy-950 text-paper">
      {/* Hero with video background */}
      <section className="relative overflow-hidden">
        <HeroVideo />

        {/* Soft vignette centered on the text column so the footage stays
            visible at the edges/corners instead of being flattened by a
            full-bleed dark overlay. Bottom still fades to solid navy for a
            seamless handoff into the next section. */}
        <div
          className="absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(58% 55% at 50% 42%, rgba(10,20,32,0.58) 0%, rgba(10,20,32,0.18) 62%, transparent 100%), linear-gradient(180deg, rgba(10,20,32,0.05) 0%, rgba(10,20,32,0.25) 62%, var(--pc-navy-950) 97%)",
          }}
        />

        <div className="absolute inset-0 opacity-[0.1]" aria-hidden>
          <svg width="100%" height="100%" className="h-full w-full">
            <defs>
              <pattern id="grid" width="42" height="42" patternUnits="userSpaceOnUse">
                <path d="M 42 0 L 0 0 0 42" fill="none" stroke="var(--pc-navy-600)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <HeroContent />
      </section>

      {/* Positioning strip */}
      <section className="border-y border-navy-800 bg-navy-900">
        <div className="mx-auto max-w-5xl px-6 py-10 grid md:grid-cols-2 gap-8 text-sm">
          <Reveal className="border-l-2 border-navy-600 pl-5">
            <div className="text-paper/40 font-mono-data uppercase text-xs tracking-widest mb-2">Existing AI</div>
            <p className="font-display text-xl italic text-paper/70">&ldquo;Here is my answer.&rdquo;</p>
          </Reveal>
          <Reveal delay={0.1} className="border-l-2 border-violet pl-5">
            <div className="text-violet-bright font-mono-data uppercase text-xs tracking-widest mb-2">ProofChain</div>
            <p className="font-display text-xl italic text-paper">
              &ldquo;Here is the claim, the evidence, the contradicting evidence, the source quality, and the trail.&rdquo;
            </p>
          </Reveal>
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="grid md:grid-cols-4 gap-6">
          {STEPS.map((step, i) => (
            <AnimatedCard key={step.title} delay={i * 0.08}>
              <div className="flex items-center gap-3 mb-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-navy-600 text-teal-bright">
                  <step.icon size={16} />
                </span>
                <span className="font-mono-data text-xs text-paper/40">0{i + 1}</span>
              </div>
              <h3 className="font-display text-xl mb-2">{step.title}</h3>
              <p className="text-sm text-paper/60 leading-relaxed">{step.body}</p>
            </AnimatedCard>
          ))}
        </div>
      </section>

      {/* Principle */}
      <section className="bg-paper text-ink">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <Reveal>
            <p className="font-mono-data text-xs uppercase tracking-widest text-ink-soft mb-4">
              Evidence-grounded verification
            </p>
            <h2 className="font-display text-3xl md:text-4xl leading-tight text-balance">
              ProofChain never simply says <span className="text-evrgreen">true</span> or{" "}
              <span className="text-evrred">false</span>.
            </h2>
            <p className="mt-5 text-ink-soft leading-relaxed">
              Every conclusion is built from a visible chain: claim → atomic claims → evidence → source quality →
              supporting/contradicting evidence → provenance and integrity signals → evidence score → explanation →
              source trail. When the evidence isn&rsquo;t there, ProofChain says so instead of inventing an answer.
            </p>
            <Link
              href="/verify"
              className="inline-flex items-center gap-2 mt-8 rounded-full bg-navy-900 text-paper px-6 py-3 font-medium hover:bg-teal transition-all hover:scale-[1.03] active:scale-[0.98]"
            >
              Try a verification <ArrowRight size={16} />
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
