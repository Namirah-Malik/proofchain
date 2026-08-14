import Link from "next/link";
import { ScanSearch, BookOpen, Share2, CheckSquare2, ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { AnimatedCard } from "@/components/ui/AnimatedCard";

const STEPS = [
  {
    n: "01",
    icon: ScanSearch,
    title: "Break down",
    body: "A single post can hide several claims. We separate them so each one can be checked on its own terms.",
  },
  {
    n: "02",
    icon: BookOpen,
    title: "Find context",
    body: "We gather source context: publisher, date, excerpt, and the limits of what it establishes.",
  },
  {
    n: "03",
    icon: Share2,
    title: "Detect tension",
    body: "Supporting, contradicting, outdated, and insufficient evidence are kept distinct rather than averaged away.",
  },
  {
    n: "04",
    icon: CheckSquare2,
    title: "Compose an assessment",
    body: "The conclusion reflects the evidence available, with uncertainty that stays visible rather than getting rounded off.",
  },
];

const STEPPER = [
  { label: "01 · BREAK DOWN" },
  { label: "02 · CONTEXT" },
  { label: "03 · COMPARE" },
  { label: "04 · ASSESS" },
];

export default function HowItWorksPage() {
  return (
    <div className="bg-paper flex-1">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <p className="font-mono-data text-xs uppercase tracking-widest text-ink-soft mb-3">
          Method / No magic box
        </p>
        <h1 className="font-display text-5xl md:text-6xl leading-[1.08] tracking-tight text-navy-900 mb-6 text-balance">
          The chain is the answer.
        </h1>
        <p className="text-lg text-ink-soft max-w-2xl leading-relaxed">
          ProofChain is designed to make the route from input to assessment visible, interruptible, and useful.
        </p>

        {/* 4-step cards */}
        <div className="mt-12 grid md:grid-cols-4 gap-4">
          {STEPS.map((step, i) => (
            <AnimatedCard
              key={step.n}
              delay={i * 0.08}
              className="rounded-xl border border-[var(--pc-hairline)] bg-white/60 p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="font-mono-data text-xs text-ink-soft">{step.n}</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--pc-hairline)] text-teal">
                  <step.icon size={15} />
                </span>
              </div>
              <h3 className="font-display text-2xl text-navy-900 mb-3 leading-snug">{step.title}</h3>
              <p className="text-sm text-ink-soft leading-relaxed">{step.body}</p>
            </AnimatedCard>
          ))}
        </div>

        {/* What you get */}
        <div className="mt-20 pt-16 border-t border-[var(--pc-hairline)] grid md:grid-cols-[280px_1fr] gap-10 items-start">
          <Reveal>
            <p className="font-mono-data text-xs uppercase tracking-widest text-ink-soft mb-4">What you get</p>
            <h2 className="font-display text-4xl leading-tight text-navy-900 text-balance">
              A result you can argue with.
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {STEPPER.map((s, i) => (
                <span key={s.label} className="flex items-center gap-2">
                  <span
                    className={`font-mono-data text-xs uppercase tracking-wide rounded-full px-3 py-1.5 ${
                      i === 2
                        ? "bg-evramber-soft text-evramber"
                        : "bg-[var(--pc-paper-dim)] text-ink-soft"
                    }`}
                  >
                    {s.label}
                  </span>
                  {i < STEPPER.length - 1 && <ArrowRight size={13} className="text-ink-soft/50" />}
                </span>
              ))}
            </div>

            <p className="text-[15px] leading-relaxed text-ink/90 max-w-xl">
              A ProofChain assessment is not a stamp of truth. It is a compact research brief: what was claimed,
              what was found, what conflicts, and which parts remain open. You stay responsible for the final
              decision.
            </p>

            <Link
              href="/verify"
              className="inline-flex items-center gap-1.5 mt-6 text-sm font-medium text-teal hover:text-navy-900 transition-colors"
            >
              Try a verification <ArrowRight size={15} />
            </Link>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
