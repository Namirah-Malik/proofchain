import type { VerificationState } from "@/lib/types";
import { STATE_META } from "@/lib/utils";

export function StateBadge({ state, size = "md" }: { state: VerificationState; size?: "sm" | "md" | "lg" }) {
  const meta = STATE_META[state] ?? STATE_META.UNVERIFIED;
  const sizes = {
    sm: "text-xs px-2.5 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full font-medium font-mono-data uppercase tracking-wide ${sizes[size]}`}
      style={{ backgroundColor: meta.bg, color: meta.color, border: `1px solid ${meta.color}33` }}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
      {meta.label}
    </span>
  );
}
