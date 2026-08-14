import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const STATE_META: Record<
  string,
  { label: string; color: string; bg: string; description: string }
> = {
  SUPPORTED: {
    label: "Supported",
    color: "var(--pc-green)",
    bg: "var(--pc-green-soft)",
    description: "Evidence consistently supports this claim.",
  },
  MOSTLY_SUPPORTED: {
    label: "Mostly Supported",
    color: "var(--pc-green)",
    bg: "var(--pc-green-soft)",
    description: "Most evidence supports this claim, with some uncertainty.",
  },
  MIXED_EVIDENCE: {
    label: "Mixed Evidence",
    color: "var(--pc-amber)",
    bg: "var(--pc-amber-soft)",
    description: "Evidence both supports and contradicts this claim.",
  },
  INSUFFICIENT_EVIDENCE: {
    label: "Insufficient Evidence",
    color: "var(--pc-amber)",
    bg: "var(--pc-amber-soft)",
    description: "Not enough authoritative evidence to reach a conclusion.",
  },
  MOSTLY_CONTRADICTED: {
    label: "Mostly Contradicted",
    color: "var(--pc-red)",
    bg: "var(--pc-red-soft)",
    description: "Most evidence contradicts this claim.",
  },
  CONTRADICTED: {
    label: "Contradicted",
    color: "var(--pc-red)",
    bg: "var(--pc-red-soft)",
    description: "Evidence directly contradicts this claim.",
  },
  UNVERIFIED: {
    label: "Unverified",
    color: "var(--pc-ink-soft)",
    bg: "var(--pc-paper-dim)",
    description: "No evidence could be retrieved for this claim.",
  },
};
