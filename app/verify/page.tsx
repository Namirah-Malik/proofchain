"use client";

import { useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Image as ImageIcon, Link2, Sparkles, X, Check } from "lucide-react";
import { DEMO_CASES } from "@/lib/demo/seedCases";
import { StageTracker } from "@/components/verification/StageTracker";
import type { PipelineStage } from "@/lib/types";

const INITIAL_STAGES: PipelineStage[] = [
  { id: "input_received", label: "Input received", status: "pending" },
  { id: "text_extracted", label: "Text extracted", status: "pending" },
  { id: "claims_identified", label: "Claims identified", status: "pending" },
  { id: "sources_retrieved", label: "Sources retrieved", status: "pending" },
  { id: "contradictions_checked", label: "Checking contradictions", status: "pending" },
  { id: "graph_built", label: "Building evidence graph", status: "pending" },
  { id: "report_generated", label: "Generating report", status: "pending" },
];

const HANDOFF_STEPS = ["Input received", "Claims extracted", "Sources compared", "Assessment composed"];

type Mode = "text" | "image" | "url";

function VerifyPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const demoParam = params.get("demo") === "1";

  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [useDemo, setUseDemo] = useState(demoParam);
  const [submitting, setSubmitting] = useState(false);
  const [stages, setStages] = useState<PipelineStage[]>(INITIAL_STAGES);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setMode("image");
  }

  function applyDemoCase(sampleText: string) {
    setText(sampleText);
    setMode("text");
    setUseDemo(true);
  }

  async function submit() {
    setError(null);
    if (mode === "text" && !text.trim()) {
      setError("Paste a claim to verify, or choose a prepared demo below.");
      return;
    }
    if (mode === "image" && !file) {
      setError("Choose a screenshot or image to verify.");
      return;
    }
    if (mode === "url" && !url.trim()) {
      setError("Enter an article or source URL to verify.");
      return;
    }

    setSubmitting(true);
    setStages(INITIAL_STAGES.map((s, i) => (i === 0 ? { ...s, status: "active" } : s)));

    try {
      let res: Response;
      if (mode === "image" && file) {
        const formData = new FormData();
        formData.append("file", file);
        if (useDemo) formData.append("demo", "true");
        res = await fetch("/api/verify", { method: "POST", body: formData });
      } else if (mode === "url") {
        res = await fetch("/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: url.trim(), demo: useDemo }),
        });
      } else {
        res = await fetch("/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, demo: useDemo }),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Verification failed.");
        setSubmitting(false);
        return;
      }
      if (data.stages) setStages(data.stages);
      router.push(`/report/${data.id}`);
    } catch {
      setError("Could not reach the verification service. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-paper flex-1">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <p className="font-mono-data text-xs uppercase tracking-widest text-ink-soft mb-3">
          Research workspace / Verify a claim
        </p>
        <h1 className="font-display text-4xl leading-tight text-navy-900 mb-10 text-balance">
          Submit a claim, screenshot, document, or link, and we&rsquo;ll break it down and map the evidence around
          each one.
        </h1>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
          {/* Main panel */}
          <div className="rounded-2xl border border-[var(--pc-hairline)] bg-white/60 p-6 md:p-8">
            <AnimatePresence mode="wait">
              {!submitting ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {/* Tabs */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="inline-flex rounded-full border border-[var(--pc-hairline)] bg-[var(--pc-paper-dim)]/60 p-1">
                      {(
                        [
                          { key: "text" as Mode, label: "Claim or text", icon: FileText },
                          { key: "image" as Mode, label: "Screenshot", icon: ImageIcon },
                          { key: "url" as Mode, label: "Web address", icon: Link2 },
                        ]
                      ).map((t) => (
                        <button
                          key={t.key}
                          onClick={() => {
                            setMode(t.key);
                            if (t.key === "image") fileInputRef.current?.click();
                          }}
                          className={`relative flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                            mode === t.key ? "text-navy-950" : "text-ink-soft hover:text-navy-900"
                          }`}
                        >
                          {mode === t.key && (
                            <motion.span
                              layoutId="tab-pill"
                              className="absolute inset-0 rounded-full bg-teal"
                              transition={{ type: "spring", stiffness: 400, damping: 32 }}
                            />
                          )}
                          <span className="relative flex items-center gap-1.5">
                            <t.icon size={14} /> {t.label}
                          </span>
                        </button>
                      ))}
                    </div>
                    {mode === "url" && (
                      <span className="hidden sm:inline-flex font-mono-data text-[10px] uppercase tracking-widest text-violet px-2 py-1 rounded-full bg-violet-soft">
                        URL mode
                      </span>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />

                  <AnimatePresence mode="wait">
                    {mode === "text" && (
                      <motion.textarea
                        key="text-input"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                        value={text}
                        onChange={(e) => {
                          setText(e.target.value);
                          setUseDemo(false);
                        }}
                        placeholder="e.g. The government announced a new ₹5000 note yesterday and it will replace ₹500 notes."
                        rows={7}
                        className="w-full rounded-lg border border-[var(--pc-hairline)] bg-white p-4 text-[15px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-teal resize-none"
                      />
                    )}

                    {mode === "image" && (
                      <motion.div
                        key="image-input"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
                        }}
                        onClick={() => !file && fileInputRef.current?.click()}
                        className="w-full rounded-lg border-2 border-dashed border-[var(--pc-hairline)] bg-white p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-teal transition-colors min-h-[220px]"
                      >
                        {preview ? (
                          <div className="relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={preview}
                              alt="Upload preview"
                              className="max-h-64 rounded-md border border-[var(--pc-hairline)]"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFile(null);
                                setPreview(null);
                              }}
                              className="absolute -top-2 -right-2 bg-navy-900 text-paper rounded-full p-1"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <Upload size={22} className="text-ink-soft mb-3" />
                            <p className="text-sm text-ink-soft">Drag a screenshot here, or click to choose a file</p>
                            <p className="text-xs text-ink-soft/70 mt-1">JPEG, PNG, WEBP, GIF · up to 15MB</p>
                          </>
                        )}
                      </motion.div>
                    )}

                    {mode === "url" && (
                      <motion.div
                        key="url-input"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                      >
                        <label className="block font-mono-data text-xs uppercase tracking-widest text-ink-soft mb-2">
                          Article or source URL
                        </label>
                        <input
                          type="url"
                          value={url}
                          onChange={(e) => {
                            setUrl(e.target.value);
                            setUseDemo(false);
                          }}
                          placeholder="https://example.com/article"
                          className="w-full rounded-lg border border-[var(--pc-hairline)] bg-white px-4 py-3.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-teal"
                        />
                        <p className="text-xs text-ink-soft mt-3">
                          We fetch the page server-side and read the main article text with Readability — no
                          browser extension needed. Paywalled or JS-only pages may not extract cleanly.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {error && <p className="text-sm text-evrred mt-3">{error}</p>}

                  <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-5 border-t border-[var(--pc-hairline)]">
                    <p className="text-xs text-ink-soft max-w-sm">
                      We do not make a final truth decision. You will see the sources, tensions, and reasoning.
                    </p>
                    <button
                      onClick={submit}
                      className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 rounded-full bg-navy-900 text-paper px-6 py-3 font-medium transition-all hover:bg-teal hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Start verification
                    </button>
                  </div>

                  <div className="mt-12 pt-8 border-t border-[var(--pc-hairline)]">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles size={15} className="text-teal" />
                      <p className="text-sm font-medium text-navy-900">Try Demo Mode — no API keys needed</p>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3">
                      {DEMO_CASES.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => applyDemoCase(c.sampleText)}
                          className="text-left rounded-lg border border-[var(--pc-hairline)] bg-white p-4 transition-all hover:border-teal hover:-translate-y-0.5"
                        >
                          <div className="text-sm font-medium text-navy-900 mb-1">{c.label}</div>
                          <div className="text-xs text-ink-soft leading-relaxed">{c.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="progress" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
                  <p className="text-sm font-medium text-navy-900 mb-6">Running verification pipeline…</p>
                  <StageTracker stages={stages} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-2xl border p-6 relative overflow-hidden"
              style={{
                borderColor: "color-mix(in srgb, var(--pc-violet) 25%, var(--pc-hairline))",
                background:
                  "linear-gradient(155deg, var(--pc-violet-soft) 0%, var(--pc-gold-soft) 100%)",
              }}
            >
              <div
                className="absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-40 animate-float"
                style={{ background: "radial-gradient(circle, var(--pc-violet-bright), transparent 70%)" }}
                aria-hidden
              />
              <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-gold mb-4">
                <Sparkles size={16} />
              </span>
              <h3 className="relative font-display text-xl text-navy-900 mb-2">See the whole chain.</h3>
              <p className="relative text-sm text-ink-soft leading-relaxed mb-4">
                Try a prepared example to see how a claim becomes a map of sources and relationships.
              </p>
              <button
                onClick={() => applyDemoCase(DEMO_CASES[0].sampleText)}
                className="relative inline-flex items-center gap-1.5 text-sm font-medium text-navy-900 hover:text-violet transition-colors"
              >
                Open prepared demo <span aria-hidden>→</span>
              </button>
              <p className="relative font-mono-data text-[10px] uppercase tracking-widest text-ink-soft/70 mt-4">
                Clearly labeled demo data
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="rounded-2xl border border-[var(--pc-hairline)] bg-white/60 p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Link2 size={14} className="text-teal" />
                <p className="font-mono-data text-xs uppercase tracking-widest text-ink-soft">The handoff</p>
              </div>
              <ol className="space-y-3">
                {HANDOFF_STEPS.map((label, i) => {
                  const active = submitting && i === 0;
                  const done = submitting ? i === 0 : false;
                  return (
                    <li key={label} className="flex items-center gap-3 text-sm">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono-data text-xs ${
                          done ? "bg-teal text-white" : "border border-[var(--pc-hairline)] text-ink-soft"
                        }`}
                      >
                        {done ? <Check size={13} /> : i + 1}
                      </span>
                      <span className={active || done ? "text-navy-900 font-medium" : "text-ink-soft"}>{label}</span>
                    </li>
                  );
                })}
              </ol>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyPageInner />
    </Suspense>
  );
}
