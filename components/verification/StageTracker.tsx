import type { PipelineStage } from "@/lib/types";

const ICON: Record<PipelineStage["status"], string> = {
  done: "✓",
  active: "⟳",
  pending: "○",
  error: "✕",
};

const COLOR: Record<PipelineStage["status"], string> = {
  done: "var(--pc-teal)",
  active: "var(--pc-navy-700)",
  pending: "var(--pc-ink-soft)",
  error: "var(--pc-red)",
};

export function StageTracker({ stages }: { stages: PipelineStage[] }) {
  return (
    <ol className="space-y-0">
      {stages.map((stage, i) => (
        <li key={stage.id} className="flex gap-3 relative pb-6 last:pb-0">
          {i < stages.length - 1 && (
            <span
              className="absolute left-[10px] top-6 bottom-0 w-px"
              style={{ backgroundColor: "var(--pc-hairline)" }}
            />
          )}
          <span
            className="mt-0.5 shrink-0 flex h-5 w-5 items-center justify-center rounded-full text-xs font-mono-data"
            style={{
              color: stage.status === "pending" ? COLOR.pending : "white",
              backgroundColor: stage.status === "pending" ? "transparent" : COLOR[stage.status],
              border: `1px solid ${COLOR[stage.status]}`,
            }}
          >
            {stage.status === "pending" ? "" : ICON[stage.status]}
          </span>
          <div>
            <div
              className="text-sm font-medium"
              style={{ color: stage.status === "pending" ? "var(--pc-ink-soft)" : "var(--pc-ink)" }}
            >
              {stage.label}
              {stage.status === "active" && <span className="animate-pulse"> …</span>}
            </div>
            {stage.detail && <div className="text-xs text-ink-soft mt-0.5">{stage.detail}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}
