"use client";

import { motion } from "framer-motion";
import type { EvidenceScore } from "@/lib/types";

function scoreColor(total: number): string {
  if (total >= 70) return "var(--pc-green)";
  if (total >= 40) return "var(--pc-amber)";
  return "var(--pc-red)";
}

export function ScoreDial({ score }: { score: EvidenceScore }) {
  const color = scoreColor(score.total);
  const circumference = 2 * Math.PI * 52;
  const offset = circumference * (1 - score.total / 100);

  return (
    <div className="flex items-center gap-5">
      <svg width="120" height="120" viewBox="0 0 120 120" className="shrink-0 -rotate-90">
        <circle cx="60" cy="60" r="52" fill="none" stroke="var(--pc-hairline)" strokeWidth="10" />
        <motion.circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        />
      </svg>
      <div>
        <motion.div
          className="font-display text-4xl"
          style={{ color }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          {score.total}
          <span className="text-lg text-ink-soft">/100</span>
        </motion.div>
        <div className="text-sm text-ink-soft mt-1">Evidence Score</div>
        <div className="text-xs text-ink-soft mt-0.5 max-w-xs">
          Not a probability of truth — a transparent sum of measurable retrieval signals.
        </div>
      </div>
    </div>
  );
}

export function ScoreFactorList({ score }: { score: EvidenceScore }) {
  const max = Math.max(...score.factors.map((f) => Math.abs(f.value)), 30);
  return (
    <div className="space-y-3">
      {score.factors.map((f, i) => (
        <div key={f.key}>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="font-medium text-ink">{f.label}</span>
            <span className="font-mono-data" style={{ color: f.value < 0 ? "var(--pc-red)" : "var(--pc-ink)" }}>
              {f.value > 0 ? "+" : ""}
              {f.value}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--pc-paper-dim)] overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              whileInView={{ width: `${Math.min(100, (Math.abs(f.value) / max) * 100)}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              style={{
                backgroundColor: f.value < 0 ? "var(--pc-red)" : "var(--pc-teal)",
                marginLeft: f.value < 0 ? "auto" : 0,
              }}
            />
          </div>
          <div className="text-xs text-ink-soft mt-1">{f.explanation}</div>
        </div>
      ))}
      <div className="pt-3 mt-3 border-t border-[var(--pc-hairline)] text-xs text-ink-soft font-mono-data">
        {score.formula}
      </div>
    </div>
  );
}
