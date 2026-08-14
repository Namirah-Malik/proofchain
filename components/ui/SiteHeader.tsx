import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-[var(--pc-hairline)] bg-paper/95 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="inline-flex h-6 w-6 items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <circle cx="6" cy="6" r="3" stroke="var(--pc-navy-900)" strokeWidth="1.6" />
              <circle cx="18" cy="18" r="3" stroke="var(--pc-teal)" strokeWidth="1.6" />
              <path d="M8.6 7.4 15.4 16.6" stroke="var(--pc-navy-900)" strokeWidth="1.6" strokeDasharray="1.5 2" />
            </svg>
          </span>
          <span className="font-display text-lg tracking-tight text-navy-900">ProofChain</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-ink-soft">
          <Link href="/how-it-works" className="hover:text-navy-900 transition-colors">
            How it works
          </Link>
          <Link href="/history" className="hover:text-navy-900 transition-colors">
            History
          </Link>
          <Link
            href="/verify"
            className="rounded-full bg-navy-900 text-paper px-4 py-2 text-sm font-medium hover:bg-teal transition-colors"
          >
            Verify with ProofChain
          </Link>
        </nav>
      </div>
    </header>
  );
}
