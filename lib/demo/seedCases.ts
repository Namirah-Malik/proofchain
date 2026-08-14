// Demo Mode seed data.
//
// Every item here is clearly synthetic and is labeled isDemo: true wherever
// it flows into a VerificationRecord. Nothing here is presented as a live
// result. This lets the full UI (graph, report, credibility, contradictions)
// be demonstrated with zero API keys, per spec section 12.

export interface DemoSourceSeed {
  url: string;
  title: string;
  publisher: string;
  snippet: string;
  publishedAt: string | null;
  keywords: string[];
  relation: "supports" | "contradicts" | "inconclusive";
  directness: "direct" | "indirect";
}

// A shared pool the DemoSearchProvider matches against by keyword overlap,
// so typing a related-but-not-identical claim still returns something
// plausible rather than nothing.
export const DEMO_SOURCE_POOL: DemoSourceSeed[] = [
  {
    url: "https://www.rbi.org.in/press-releases",
    title: "RBI Press Release: No new ₹5000 denomination note planned",
    publisher: "Reserve Bank of India",
    snippet:
      "The Reserve Bank of India has not announced, and has no current plans to introduce, a ₹5000 currency note. Existing denominations remain unchanged.",
    publishedAt: "2026-06-02",
    keywords: ["5000", "note", "currency", "rbi", "rupee", "denomination", "₹500", "₹5000"],
    relation: "contradicts",
    directness: "direct",
  },
  {
    url: "https://www.reuters.com/world/india/rbi-denomination-fact-check",
    title: "Fact check: Viral claim about new ₹5000 note is false",
    publisher: "Reuters",
    snippet:
      "Reuters found no official notification supporting the circulating screenshot claiming a new ₹5000 note. The image's formatting does not match RBI's official release template.",
    publishedAt: "2026-06-03",
    keywords: ["5000", "note", "viral", "fake", "screenshot", "rbi", "fact check"],
    relation: "contradicts",
    directness: "direct",
  },
  {
    url: "https://www.random-news-blog24.info/breaking-5000-note",
    title: "BREAKING: Govt to launch 5000 note immediately!!!",
    publisher: "random-news-blog24.info",
    snippet:
      "Sources say the government is about to launch a new note. Share before it gets deleted!",
    publishedAt: null,
    keywords: ["5000", "note", "breaking", "govt"],
    relation: "supports",
    directness: "indirect",
  },
  {
    url: "https://www.who.int/news/statements/vaccine-safety-review",
    title: "WHO statement on vaccine safety monitoring",
    publisher: "World Health Organization",
    snippet:
      "Ongoing global surveillance continues to find that approved vaccines meet established safety and efficacy standards, consistent with prior review cycles.",
    publishedAt: "2026-03-14",
    keywords: ["vaccine", "safety", "who", "health", "side effects"],
    relation: "contradicts",
    directness: "direct",
  },
  {
    url: "https://www.bbc.com/news/health-vaccine-claims-debunked",
    title: "Claims about vaccine ingredient are unsupported, experts say",
    publisher: "BBC News",
    snippet:
      "Medical researchers interviewed by the BBC said the specific ingredient claim circulating online misrepresents published clinical trial data.",
    publishedAt: "2026-02-20",
    keywords: ["vaccine", "ingredient", "side effects", "health", "claim"],
    relation: "contradicts",
    directness: "direct",
  },
  {
    url: "https://healthtruthnow.blogspot.com/2026/01/the-real-story",
    title: "The REAL story they don't want you to know",
    publisher: "healthtruthnow.blogspot.com",
    snippet: "Anonymous insider claims reveal shocking cover-up (unverified).",
    publishedAt: null,
    keywords: ["vaccine", "cover-up", "health", "insider"],
    relation: "supports",
    directness: "indirect",
  },
  {
    url: "https://apnews.com/article/election-result-certification",
    title: "State election results formally certified",
    publisher: "Associated Press",
    snippet:
      "Election officials in the state completed formal certification of results after a standard audit found no irregularities affecting the outcome.",
    publishedAt: "2026-04-18",
    keywords: ["election", "results", "certified", "audit", "vote"],
    relation: "contradicts",
    directness: "direct",
  },
  {
    url: "https://www.politifact.com/factchecks/2026/election-fraud-claim",
    title: "PolitiFact: Election fraud claim rated False",
    publisher: "PolitiFact",
    snippet:
      "The specific fraud allegation traces back to a misinterpreted spreadsheet column and does not match the certified county-level tallies.",
    publishedAt: "2026-04-20",
    keywords: ["election", "fraud", "claim", "false", "vote"],
    relation: "contradicts",
    directness: "direct",
  },
];

// A single manipulated-looking uploaded screenshot demo case, wired end to
// end so the "upload a suspicious screenshot" demo flow works without OCR
// even needing to run (though real OCR still runs on real uploads).
export const DEMO_CASE_IDS = {
  fakeAnnouncement: "demo-fake-govt-note",
  misleadingHealth: "demo-misleading-health-claim",
  manipulatedImage: "demo-manipulated-image",
} as const;

export interface DemoCaseDefinition {
  id: string;
  label: string;
  description: string;
  inputType: "text" | "image";
  sampleText: string;
}

export const DEMO_CASES: DemoCaseDefinition[] = [
  {
    id: DEMO_CASE_IDS.fakeAnnouncement,
    label: "Fake government announcement",
    description:
      "A screenshot-style claim about a new ₹5000 note replacing ₹500 notes — a real misinformation pattern.",
    inputType: "text",
    sampleText:
      "The government announced a new ₹5000 note yesterday and it will replace ₹500 notes starting next month.",
  },
  {
    id: DEMO_CASE_IDS.misleadingHealth,
    label: "Misleading health claim",
    description: "A vague, alarming health claim of the kind that spreads quickly on social media.",
    inputType: "text",
    sampleText:
      "A viral post claims a common vaccine ingredient causes severe side effects in most people and that health authorities are covering it up.",
  },
  {
    id: DEMO_CASE_IDS.manipulatedImage,
    label: "Election fraud screenshot",
    description: "A claim about certified election results being fraudulent, commonly seen after close elections.",
    inputType: "text",
    sampleText:
      "A widely shared screenshot claims the state's certified election results were manipulated and that the real winner was declared the loser.",
  },
];
