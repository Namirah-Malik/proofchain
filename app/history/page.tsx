"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Search } from "lucide-react";
import { StateBadge } from "@/components/verification/StateBadge";
import type { VerificationState } from "@/lib/types";

interface HistoryItem {
  id: string;
  createdAt: string;
  inputType: string;
  mainClaim: string | null;
  originalInput: string;
  state: VerificationState;
  score: number | null;
  isDemo: boolean;
}

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/history")
      .then((r) => r.json())
      .then((data) => {
        setItems(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function remove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/verify/${id}`, { method: "DELETE" });
  }

  const filtered = items.filter((i) =>
    `${i.mainClaim ?? ""} ${i.originalInput}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="bg-paper flex-1">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <p className="font-mono-data text-xs uppercase tracking-widest text-ink-soft mb-3">History</p>
        <h1 className="font-display text-4xl text-navy-900 mb-8">Previous verifications</h1>

        <div className="relative mb-8">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search past claims…"
            className="w-full rounded-full border border-[var(--pc-hairline)] bg-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
          />
        </div>

        {loading ? (
          <p className="text-sm text-ink-soft">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--pc-hairline)] p-10 text-center">
            <p className="text-sm text-ink-soft mb-4">No verifications yet.</p>
            <Link href="/verify" className="text-sm font-medium text-teal hover:underline">
              Verify your first claim →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {filtered.map((item, i) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -12, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                  className="group flex items-center justify-between gap-4 rounded-lg border border-[var(--pc-hairline)] bg-white p-4 hover:border-teal hover:-translate-y-0.5 transition-[border-color,transform]"
                >
                  <Link href={`/report/${item.id}`} className="flex-1 min-w-0">
                    <p className="text-sm text-navy-900 truncate mb-1.5">
                      {item.mainClaim || item.originalInput || "Untitled verification"}
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <StateBadge state={item.state} size="sm" />
                      {item.score !== null && (
                        <span className="text-xs font-mono-data text-ink-soft">{item.score}/100</span>
                      )}
                      <span className="text-xs text-ink-soft font-mono-data">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                      {item.isDemo && (
                        <span className="text-xs text-evramber font-mono-data uppercase">Demo</span>
                      )}
                    </div>
                  </Link>
                  <button
                    onClick={() => remove(item.id)}
                    className="shrink-0 p-2 text-ink-soft hover:text-evrred opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Delete verification"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
