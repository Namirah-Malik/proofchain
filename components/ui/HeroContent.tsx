"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export function HeroContent() {
  return (
    <motion.div
      className="relative mx-auto max-w-5xl px-6 pt-24 pb-20 text-center"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        variants={item}
        className="inline-flex items-center gap-2 rounded-full border border-navy-600 bg-navy-950/40 backdrop-blur-sm px-3 py-1 text-xs font-mono-data uppercase tracking-widest text-teal-bright mb-8"
      >
        An evidence verification layer for the AI era
      </motion.div>

      <motion.h1
        variants={item}
        className="font-display text-5xl md:text-6xl leading-[1.08] tracking-tight text-balance"
        style={{ textShadow: "0 2px 24px rgba(10,20,32,0.55)" }}
      >
        Don&rsquo;t ask AI whether
        <br />
        something is true.
        <br />
        <span className="italic text-teal-bright">Make AI prove it.</span>
      </motion.h1>

      <motion.p
        variants={item}
        className="mt-7 text-lg text-paper/85 max-w-2xl mx-auto leading-relaxed"
        style={{ textShadow: "0 1px 16px rgba(10,20,32,0.5)" }}
      >
        Submit a claim, a screenshot, a document, or a link. ProofChain extracts what&rsquo;s actually being said,
        retrieves supporting <em>and</em> contradicting evidence, weighs source credibility, and hands you a report
        you can inspect claim by claim — not a verdict you have to take on faith.
      </motion.p>

      <motion.div variants={item} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/verify"
          className="inline-flex items-center gap-2 rounded-full bg-teal px-6 py-3.5 font-medium text-navy-950 transition-all hover:bg-teal-bright hover:scale-[1.03] active:scale-[0.98]"
        >
          Verify with ProofChain <ArrowRight size={16} />
        </Link>
        <Link
          href="/verify?demo=1"
          className="inline-flex items-center gap-2 rounded-full border border-navy-600 bg-navy-950/30 backdrop-blur-sm px-6 py-3.5 font-medium text-paper/90 transition-all hover:border-violet-bright hover:text-violet-bright hover:scale-[1.03] active:scale-[0.98]"
        >
          See it run in Demo Mode
        </Link>
      </motion.div>
      <motion.p
        variants={item}
        className="mt-4 text-xs text-paper/60 font-mono-data"
        style={{ textShadow: "0 1px 12px rgba(10,20,32,0.5)" }}
      >
     </motion.p>
    </motion.div>
  );
}
