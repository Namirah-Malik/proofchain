export function CredibilityStars({ score }: { score: number }) {
  const filled = Math.round(score / 20);
  return (
    <span className="font-mono-data text-sm tracking-tight" aria-label={`Credibility ${filled} of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} style={{ color: i < filled ? "var(--pc-teal)" : "var(--pc-hairline)" }}>
          ★
        </span>
      ))}
    </span>
  );
}
