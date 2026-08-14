// SearchProvider abstraction.
//
// The pipeline only ever talks to this interface, never to a specific
// vendor. Whichever provider has credentials configured in the environment
// wins; otherwise the DemoSearchProvider returns clearly-labeled seed
// evidence so the whole app stays functional with zero keys.

import type { Source } from "@/lib/types";
import { DEMO_SOURCE_POOL } from "@/lib/demo/seedCases";

export interface SearchResultItem {
  url: string;
  title: string;
  snippet: string;
  publisher?: string;
  publishedAt?: string | null;
  // Only populated by the demo provider, which knows ground truth for its
  // seeded cases. Real providers leave this undefined and the pipeline
  // falls back to heuristic relation/directness classification.
  knownRelation?: "supports" | "contradicts" | "inconclusive";
  knownDirectness?: "direct" | "indirect";
}

export interface SearchProvider {
  name: "demo" | "tavily" | "serper" | "google";
  search(query: string): Promise<SearchResultItem[]>;
}

function classifySourceType(url: string): Source["sourceType"] {
  try {
    const host = new URL(url).hostname.replace("www.", "");
    if (host.endsWith(".gov") || host.endsWith(".gov.in") || host.includes("rbi.org") || host.endsWith(".int"))
      return "government";
    if (host.endsWith(".edu") || host.includes("research") || host.includes(".ac.")) return "academic";
    if (["snopes.com", "factcheck.org", "altnews.in", "politifact.com"].some((d) => host.includes(d)))
      return "fact_check";
    if (
      ["reuters.com", "apnews.com", "bbc.com", "thehindu.com", "ndtv.com", "livemint.com"].some((d) =>
        host.includes(d)
      )
    )
      return "news";
    if (host.includes("blog") || host.includes("medium.com")) return "unknown";
    return "unknown";
  } catch {
    return "unknown";
  }
}

const CREDIBILITY_BASE: Record<Source["sourceType"], { score: number; reason: string }> = {
  government: { score: 92, reason: "Official/primary government source" },
  academic: { score: 88, reason: "Academic or research institution" },
  fact_check: { score: 85, reason: "Established fact-checking organization" },
  news: { score: 78, reason: "Established news organization" },
  corporate: { score: 55, reason: "Corporate / self-interested publisher" },
  unknown: { score: 35, reason: "Unverified or low-authority publisher" },
  demo: { score: 50, reason: "Demo seed source" },
};

export function scoreSourceCredibility(url: string, isDemo: boolean): {
  sourceType: Source["sourceType"];
  credibilityScore: number;
  credibilityReasons: string[];
} {
  // Demo sources are still classified by their actual URL/domain (an RBI
  // press-release URL should score like a government source, not a generic
  // "demo" tier) -- isDemo only affects labeling in the UI, never scoring.
  // A URL that genuinely can't be classified falls through to "unknown".
  const sourceType = classifySourceType(url);
  const base = CREDIBILITY_BASE[sourceType];
  const reasons = [base.reason];
  if (isDemo) reasons.push("Demo seed source — illustrative, not a live retrieval");
  if (!url.startsWith("https://")) reasons.push("Not served over HTTPS (-5)");
  const score = Math.max(5, base.score - (!url.startsWith("https://") ? 5 : 0));
  return { sourceType, credibilityScore: score, credibilityReasons: reasons };
}

// ---------------------------------------------------------------------------
// Demo provider: returns clearly labeled seed evidence, keyed by loose
// keyword overlap with the demo cases. Never presented as live data.
// ---------------------------------------------------------------------------
class DemoSearchProvider implements SearchProvider {
  name = "demo" as const;

  async search(query: string): Promise<SearchResultItem[]> {
    const q = query.toLowerCase();
    const scored = DEMO_SOURCE_POOL.map((item) => {
      const overlap = item.keywords.filter((k) => q.includes(k)).length;
      return { item, overlap };
    })
      .filter((s) => s.overlap > 0)
      .sort((a, b) => b.overlap - a.overlap);

    // Intentionally return NOTHING on zero keyword overlap rather than
    // padding results with unrelated seed sources. Silently substituting
    // plausible-but-unrelated "evidence" for a claim the demo pool doesn't
    // actually cover would be exactly the kind of fabrication ProofChain
    // exists to prevent (see hallucination-control principle). Callers
    // that want the curated illustrative examples should pick one of the
    // three labeled Demo Mode cases, which are guaranteed to match.
    const chosen = scored.slice(0, 4).map((s) => s.item);

    return chosen.map((c) => ({
      url: c.url,
      title: c.title,
      snippet: c.snippet,
      publisher: c.publisher,
      publishedAt: c.publishedAt,
      knownRelation: c.relation,
      knownDirectness: c.directness,
    }));
  }
}

// ---------------------------------------------------------------------------
// Real providers -- only used when credentials are configured.
// ---------------------------------------------------------------------------
class TavilyProvider implements SearchProvider {
  name = "tavily" as const;
  constructor(private apiKey: string) {}

  async search(query: string): Promise<SearchResultItem[]> {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: this.apiKey, query, max_results: 6 }),
    });
    if (!res.ok) throw new Error(`Tavily request failed: ${res.status}`);
    const json = await res.json();
    return (json.results ?? []).map((r: { url: string; title: string; content: string }) => ({
      url: r.url,
      title: r.title,
      snippet: r.content,
    }));
  }
}

class SerperProvider implements SearchProvider {
  name = "serper" as const;
  constructor(private apiKey: string) {}

  async search(query: string): Promise<SearchResultItem[]> {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": this.apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ q: query }),
    });
    if (!res.ok) throw new Error(`Serper request failed: ${res.status}`);
    const json = await res.json();
    return (json.organic ?? []).map((r: { link: string; title: string; snippet: string }) => ({
      url: r.link,
      title: r.title,
      snippet: r.snippet,
    }));
  }
}

class GoogleCseProvider implements SearchProvider {
  name = "google" as const;
  constructor(private apiKey: string, private cx: string) {}

  async search(query: string): Promise<SearchResultItem[]> {
    const url = `https://www.googleapis.com/customsearch/v1?key=${this.apiKey}&cx=${this.cx}&q=${encodeURIComponent(
      query
    )}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Google CSE request failed: ${res.status}`);
    const json = await res.json();
    return (json.items ?? []).map((r: { link: string; title: string; snippet: string }) => ({
      url: r.link,
      title: r.title,
      snippet: r.snippet,
    }));
  }
}

export function getSearchProvider(): SearchProvider {
  if (process.env.TAVILY_API_KEY) return new TavilyProvider(process.env.TAVILY_API_KEY);
  if (process.env.SERPER_API_KEY) return new SerperProvider(process.env.SERPER_API_KEY);
  if (process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID)
    return new GoogleCseProvider(process.env.GOOGLE_SEARCH_API_KEY, process.env.GOOGLE_SEARCH_ENGINE_ID);
  return new DemoSearchProvider();
}

export const demoSearchProvider = new DemoSearchProvider();
