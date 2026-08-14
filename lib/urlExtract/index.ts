import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { isSafeExternalUrl, withTimeout } from "@/lib/security";

export interface UrlExtractionResult {
  ok: boolean;
  title: string | null;
  text: string;
  siteName: string | null;
  finalUrl: string;
  error?: string;
}

const MAX_HTML_BYTES = 5 * 1024 * 1024; // 5MB cap on fetched page size
const FETCH_TIMEOUT_MS = 12_000;

// Fetches a user-supplied URL server-side and extracts the main readable
// article text (title + body), so a pasted link can be verified the same
// way a pasted claim can. The fetched HTML/text is treated as untrusted
// data end to end -- see lib/security's wrapAsUntrustedData, which the
// pipeline applies before this text ever reaches an LLM prompt.
export async function extractArticleFromUrl(url: string): Promise<UrlExtractionResult> {
  if (!isSafeExternalUrl(url)) {
    return {
      ok: false,
      title: null,
      text: "",
      siteName: null,
      finalUrl: url,
      error: "This URL isn't allowed (only public http/https addresses are supported).",
    };
  }

  let res: Response;
  try {
    res = await withTimeout(
      fetch(url, {
        redirect: "follow",
        headers: {
          "User-Agent": "ProofChainBot/1.0 (+evidence-verification; fetches article text only)",
          Accept: "text/html,application/xhtml+xml",
        },
      }),
      FETCH_TIMEOUT_MS,
      "URL fetch"
    );
  } catch (err) {
    return {
      ok: false,
      title: null,
      text: "",
      siteName: null,
      finalUrl: url,
      error: err instanceof Error && err.message.includes("timed out")
        ? "The page took too long to respond."
        : "Could not reach that URL. It may be offline or blocking automated requests.",
    };
  }

  if (!res.ok) {
    return {
      ok: false,
      title: null,
      text: "",
      siteName: null,
      finalUrl: res.url || url,
      error: `The page responded with status ${res.status}.`,
    };
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html") && !contentType.includes("xhtml")) {
    return {
      ok: false,
      title: null,
      text: "",
      siteName: null,
      finalUrl: res.url || url,
      error: `Unsupported content type (${contentType || "unknown"}). Only HTML articles are supported.`,
    };
  }

  const reader = res.body?.getReader();
  if (!reader) {
    return { ok: false, title: null, text: "", siteName: null, finalUrl: res.url || url, error: "Empty response." };
  }
  let received = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > MAX_HTML_BYTES) {
      reader.cancel();
      return {
        ok: false,
        title: null,
        text: "",
        siteName: null,
        finalUrl: res.url || url,
        error: "Page is too large to process (over 5MB of HTML).",
      };
    }
    chunks.push(value);
  }
  const html = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf-8");

  try {
    const dom = new JSDOM(html, { url: res.url || url });
    const article = new Readability(dom.window.document).parse();

    if (!article || !article.textContent || article.textContent.trim().length < 40) {
      return {
        ok: false,
        title: article?.title ?? null,
        text: "",
        siteName: article?.siteName ?? null,
        finalUrl: res.url || url,
        error: "Could not find readable article text on that page.",
      };
    }

    return {
      ok: true,
      title: article.title ?? null,
      text: article.textContent.replace(/\s+/g, " ").trim().slice(0, 8000),
      siteName: article.siteName ?? null,
      finalUrl: res.url || url,
    };
  } catch {
    return {
      ok: false,
      title: null,
      text: "",
      siteName: null,
      finalUrl: res.url || url,
      error: "Failed to parse the page content.",
    };
  }
}
