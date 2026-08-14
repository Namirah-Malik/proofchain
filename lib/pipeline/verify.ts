import { randomUUID } from "crypto";
import type {
  EvidenceItem,
  InputType,
  PipelineStage,
  Source,
  VerificationRecord,
} from "@/lib/types";
import { getLLMProvider, heuristicProvider } from "@/lib/ai/provider";
import { getSearchProvider, scoreSourceCredibility } from "@/lib/search/provider";
import { classifyRelation, classifyDirectness, evidenceStrength } from "@/lib/evidence/classify";
import { computeEvidenceScore, deriveVerificationState } from "@/lib/scoring";
import { detectEvidenceGaps, generateConclusion } from "@/lib/pipeline/conclusion";
import { buildEvidenceGraph } from "@/lib/pipeline/buildGraph";
import { checkProvenance } from "@/lib/provenance";
import { checkIntegrity } from "@/lib/integrity";
import { runOcr } from "@/lib/ocr";
import { extractArticleFromUrl } from "@/lib/urlExtract";
import { sanitizeExtractedText, validateUpload, withTimeout } from "@/lib/security";
import { createVerification, updateVerification } from "@/lib/store";

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

const STAGE_DEFS: Array<{ id: PipelineStage["id"]; label: string }> = [
  { id: "input_received", label: "Input received" },
  { id: "text_extracted", label: "Text extracted" },
  { id: "claims_identified", label: "Claims identified" },
  { id: "sources_retrieved", label: "Sources retrieved" },
  { id: "contradictions_checked", label: "Checking contradictions" },
  { id: "graph_built", label: "Building evidence graph" },
  { id: "report_generated", label: "Generating report" },
];

function initialStages(): PipelineStage[] {
  return STAGE_DEFS.map((s) => ({ id: s.id, label: s.label, status: "pending" as const }));
}

function markStage(
  record: VerificationRecord,
  id: PipelineStage["id"],
  status: PipelineStage["status"],
  detail?: string
): void {
  const stage = record.stages.find((s) => s.id === id);
  if (!stage) return;
  stage.status = status;
  stage.detail = detail;
  if (status === "active") stage.startedAt = new Date().toISOString();
  if (status === "done" || status === "error") stage.finishedAt = new Date().toISOString();
}

export interface VerifyInput {
  inputType: InputType;
  text?: string;
  url?: string;
  fileBuffer?: Buffer;
  fileName?: string;
  mimeType?: string;
  forceDemo?: boolean;
}

function bailInsufficientInput(
  record: VerificationRecord,
  extractStageDetail: string,
  gapReason: string,
  gapDetail: string,
  conclusion: string
): void {
  markStage(record, "text_extracted", "error", extractStageDetail);
  record.evidenceGaps.push({ reason: gapReason, detail: gapDetail });
  record.state = "UNVERIFIED";
  markStage(record, "claims_identified", "error", "Skipped: no extracted text.");
  markStage(record, "sources_retrieved", "error", "Skipped.");
  markStage(record, "contradictions_checked", "error", "Skipped.");
  markStage(record, "graph_built", "error", "Skipped.");
  markStage(record, "report_generated", "done", "Report generated with insufficient input.");
  record.conclusion = conclusion;
}

export async function runVerificationPipeline(input: VerifyInput): Promise<VerificationRecord> {
  const id = randomUUID();
  const now = new Date().toISOString();

  const record: VerificationRecord = {
    id,
    createdAt: now,
    updatedAt: now,
    inputType: input.inputType,
    originalInput: input.text ?? input.url ?? input.fileName ?? "",
    extractedText: null,
    entities: [],
    mainClaim: null,
    atomicClaims: [],
    sources: [],
    evidence: [],
    provenance: null,
    integrity: null,
    evidenceGaps: [],
    score: null,
    state: "UNVERIFIED",
    conclusion: null,
    graph: null,
    stages: initialStages(),
    // isDemo drives the "Demo data" banner on the report. It's true either
    // when the person explicitly asked for a demo case, OR when no search
    // provider key is configured and retrieval fell back to the seed pool
    // -- in both cases the evidence shown is illustrative, not a live
    // retrieval, and the UI must say so honestly rather than only labeling
    // the cases the person happened to trigger via the demo buttons.
    isDemo: Boolean(input.forceDemo) || getSearchProvider().name === "demo",
    usedProviders: {
      llm: input.forceDemo ? "demo-heuristic" : getLLMProvider().name,
      search: input.forceDemo ? "demo" : getSearchProvider().name,
      ocr: input.inputType === "image" ? "tesseract" : "none",
    },
  };

  createVerification(record);

  try {
    // ---- Stage 1: input received ------------------------------------
    markStage(record, "input_received", "done", `Received ${input.inputType} input.`);

    // ---- Stage 2: text extraction (OCR for images, fetch+read for URLs) --
    markStage(record, "text_extracted", "active");
    let extractedText = input.text ?? "";

    if (input.inputType === "image" && input.fileBuffer && input.mimeType) {
      const validation = validateUpload(input.mimeType, input.fileBuffer.length);
      if (!validation.ok) throw new Error(validation.reason);

      const [provenance, ocr] = await Promise.all([
        checkProvenance(input.fileBuffer, input.fileName ?? "upload", input.mimeType),
        withTimeout(runOcr(input.fileBuffer), 25_000, "OCR").catch((err) => {
          console.error("OCR timed out or failed:", err);
          return { text: "", confidence: 0, provider: "none" as const };
        }),
      ]);
      record.provenance = provenance;
      extractedText = sanitizeExtractedText(ocr.text);
      record.integrity = checkIntegrity(input.fileBuffer, input.mimeType, provenance);

      if (!extractedText) {
        bailInsufficientInput(
          record,
          "OCR could not extract readable text from this image.",
          "No authoritative source found",
          "OCR failed to extract text, so no claim could be identified from the image.",
          "Verification could not be completed because no readable text could be extracted from the uploaded image."
        );
        updateVerification(id, record);
        return record;
      }
    }

    if (input.inputType === "url" && input.url) {
      const article = await extractArticleFromUrl(input.url);
      if (!article.ok || !article.text) {
        bailInsufficientInput(
          record,
          article.error ?? "Could not extract readable text from that URL.",
          "No authoritative source found",
          article.error ?? "The linked page could not be fetched or contained no readable article text.",
          `Verification could not be completed: ${article.error ?? "the linked page could not be read."}`
        );
        updateVerification(id, record);
        return record;
      }
      // The page title + byline give useful context but are untrusted
      // external content, same as the body -- treated identically by the
      // claim-decomposition stage below (see lib/security's wrapAsUntrustedData
      // and the system prompts in lib/ai/provider.ts).
      extractedText = sanitizeExtractedText(
        article.title ? `${article.title}. ${article.text}` : article.text
      );
      record.originalInput = article.finalUrl;
    }

    record.extractedText = extractedText;
    markStage(record, "text_extracted", "done", `${extractedText.length} characters extracted.`);

    // ---- Stage 3: claim decomposition ---------------------------------
    markStage(record, "claims_identified", "active");
    const provider = record.isDemo ? heuristicProvider : getLLMProvider();
    let claimResult;
    try {
      claimResult = await withTimeout(provider.extractClaims(extractedText), 15_000, "Claim extraction");
    } catch (err) {
      console.error("LLM claim extraction failed or timed out, falling back to heuristic provider:", err);
      claimResult = await heuristicProvider.extractClaims(extractedText);
      record.usedProviders.llm = "demo-heuristic";
    }
    record.mainClaim = claimResult.mainClaim;
    record.atomicClaims = claimResult.atomicClaims;
    record.entities = claimResult.entities;
    markStage(
      record,
      "claims_identified",
      "done",
      `${claimResult.atomicClaims.length} atomic claim(s) identified.`
    );

    // ---- Stage 4: source retrieval -------------------------------------
    markStage(record, "sources_retrieved", "active");
    const searchProvider = record.isDemo ? getSearchProvider() : getSearchProvider();
    const isDemoSearch = record.isDemo || searchProvider.name === "demo";

    const sources: Source[] = [];
    const evidence: EvidenceItem[] = [];
    const sourceUrlToId = new Map<string, string>();

    for (const claim of record.atomicClaims) {
      let results: Awaited<ReturnType<typeof searchProvider.search>>;
      try {
        results = await withTimeout(searchProvider.search(claim.text), 10_000, "Source retrieval");
      } catch (err) {
        console.error("Search provider failed or timed out:", err);
        results = [];
      }

      for (const result of results) {
        let sourceId = sourceUrlToId.get(result.url);
        if (!sourceId) {
          const { sourceType, credibilityScore, credibilityReasons } = scoreSourceCredibility(
            result.url,
            isDemoSearch
          );
          sourceId = uid("src");
          sourceUrlToId.set(result.url, sourceId);
          sources.push({
            id: sourceId,
            url: result.url,
            title: result.title,
            publisher: result.publisher ?? new URL(result.url).hostname,
            sourceType,
            publishedAt: result.publishedAt ?? null,
            retrievedAt: new Date().toISOString(),
            credibilityScore,
            credibilityReasons,
            isDemo: isDemoSearch,
          });
        }

        const relation = result.knownRelation ?? classifyRelation(result.snippet, result.title);
        const directness = result.knownDirectness ?? classifyDirectness(claim.text, result.snippet);
        const src = sources.find((s) => s.id === sourceId)!;
        const strength = evidenceStrength(relation, directness, src.credibilityScore);

        evidence.push({
          id: uid("ev"),
          claimId: claim.id,
          sourceId,
          snippet: result.snippet.slice(0, 500),
          relation,
          strength,
          directness,
          reasonSelected: `${src.sourceType.replace("_", " ")} source ${
            relation === "supports" ? "supporting" : relation === "contradicts" ? "contradicting" : "related to"
          } this claim, matched by retrieval query.`,
          verified: isDemoSearch ? true : Boolean(result.url && result.snippet),
        });

        claim.status = relation === "supports" ? "SUPPORTED" : relation === "contradicts" ? "CONTRADICTED" : "UNVERIFIED";
      }
    }

    record.sources = sources;
    record.evidence = evidence;
    markStage(
      record,
      "sources_retrieved",
      "done",
      `${sources.length} source(s), ${evidence.length} evidence item(s) retrieved.`
    );

    // ---- Stage 5: contradiction check + evidence gaps -------------------
    markStage(record, "contradictions_checked", "active");
    record.evidenceGaps = detectEvidenceGaps(evidence, sources);
    const supportingCount = evidence.filter((e) => e.relation === "supports").length;
    const contradictingCount = evidence.filter((e) => e.relation === "contradicts").length;
    markStage(
      record,
      "contradictions_checked",
      "done",
      `${supportingCount} supporting, ${contradictingCount} contradicting.`
    );

    // ---- Stage 6: scoring -------------------------------------------------
    const score = computeEvidenceScore(evidence, sources);
    record.score = score;
    record.state = deriveVerificationState(score.total, supportingCount, contradictingCount, evidence.length);

    // ---- Stage 7: evidence graph -------------------------------------------
    markStage(record, "graph_built", "active");
    record.graph = buildEvidenceGraph({
      claimText: record.mainClaim ?? extractedText,
      evidence,
      sources,
      provenance: record.provenance,
      integrity: record.integrity,
      score,
    });
    markStage(record, "graph_built", "done", `${record.graph.nodes.length} node(s) in evidence graph.`);

    // ---- Stage 8: report / conclusion --------------------------------------
    markStage(record, "report_generated", "active");
    record.conclusion = generateConclusion({
      mainClaim: record.mainClaim ?? extractedText,
      state: record.state,
      score: score.total,
      supporting: evidence.filter((e) => e.relation === "supports"),
      contradicting: evidence.filter((e) => e.relation === "contradicts"),
      sources,
      gaps: record.evidenceGaps,
    });
    markStage(record, "report_generated", "done", "Verification report ready.");

    updateVerification(id, record);
    return record;
  } catch (err) {
    console.error("Verification pipeline error:", err);
    record.error = err instanceof Error ? err.message : "Unknown error during verification.";
    record.stages.forEach((s) => {
      if (s.status === "pending" || s.status === "active") s.status = "error";
    });
    updateVerification(id, record);
    return record;
  }
}
