// ProofChain core domain types.
// These mirror the persisted shape in lib/store (JSON-backed dev "database")
// and the reference Prisma schema in prisma/schema.prisma.

export type InputType = "text" | "image" | "document" | "url";

export type VerificationState =
  | "SUPPORTED"
  | "MOSTLY_SUPPORTED"
  | "MIXED_EVIDENCE"
  | "INSUFFICIENT_EVIDENCE"
  | "MOSTLY_CONTRADICTED"
  | "CONTRADICTED"
  | "UNVERIFIED";

export type PipelineStageId =
  | "input_received"
  | "text_extracted"
  | "claims_identified"
  | "sources_retrieved"
  | "contradictions_checked"
  | "graph_built"
  | "report_generated";

export type StageStatus = "pending" | "active" | "done" | "error";

export interface PipelineStage {
  id: PipelineStageId;
  label: string;
  status: StageStatus;
  detail?: string;
  startedAt?: string;
  finishedAt?: string;
}

export type EntityType = "person" | "organization" | "location" | "date" | "number" | "url";

export interface ExtractedEntity {
  type: EntityType;
  value: string;
}

export interface AtomicClaim {
  id: string;
  text: string;
  category: "factual" | "temporal" | "quantitative" | "attribution" | "other";
  importance: "high" | "medium" | "low";
  status: VerificationState;
  entities: ExtractedEntity[];
}

export type SourceType =
  | "government"
  | "news"
  | "academic"
  | "fact_check"
  | "corporate"
  | "unknown"
  | "demo";

export interface Source {
  id: string;
  url: string;
  title: string;
  publisher: string;
  sourceType: SourceType;
  publishedAt: string | null;
  retrievedAt: string;
  credibilityScore: number; // 0-100, explainable
  credibilityReasons: string[];
  isDemo?: boolean;
}

export type EvidenceRelation = "supports" | "contradicts" | "inconclusive";

export interface EvidenceItem {
  id: string;
  claimId: string;
  sourceId: string;
  snippet: string;
  relation: EvidenceRelation;
  strength: number; // 0-100
  directness: "direct" | "indirect";
  reasonSelected: string;
  verified: boolean; // false => UNVERIFIED, must never be fabricated
}

export interface ProvenanceCheck {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  exif: Record<string, unknown> | null;
  c2pa: "available" | "not_available";
  signalsAvailable: boolean;
  notes: string[];
}

export interface IntegrityCheck {
  status: "clean" | "warning" | "no_signal" | "not_applicable";
  headline: string;
  signals: Array<{ label: string; detail: string; severity: "info" | "warning" }>;
  disclaimer: string;
}

export interface EvidenceGapReason {
  reason: string;
  detail: string;
}

export interface ScoreFactor {
  key: string;
  label: string;
  value: number; // contribution, can be negative
  explanation: string;
}

export interface EvidenceScore {
  total: number; // 0-100
  factors: ScoreFactor[];
  formula: string;
}

export interface EvidenceGraphNode {
  id: string;
  type: "claim" | "supporting_group" | "contradicting_group" | "source" | "integrity" | "provenance" | "score";
  label: string;
  sublabel?: string;
  refId?: string; // source id, evidence id, etc.
}

export interface EvidenceGraphEdge {
  from: string;
  to: string;
}

export interface EvidenceGraph {
  nodes: EvidenceGraphNode[];
  edges: EvidenceGraphEdge[];
}

export interface VerificationRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  inputType: InputType;
  originalInput: string; // raw text, or file name for uploads
  extractedText: string | null;
  entities: ExtractedEntity[];
  mainClaim: string | null;
  atomicClaims: AtomicClaim[];
  sources: Source[];
  evidence: EvidenceItem[];
  provenance: ProvenanceCheck | null;
  integrity: IntegrityCheck | null;
  evidenceGaps: EvidenceGapReason[];
  score: EvidenceScore | null;
  state: VerificationState;
  conclusion: string | null;
  graph: EvidenceGraph | null;
  stages: PipelineStage[];
  isDemo: boolean;
  usedProviders: {
    llm: "demo-heuristic" | "openai" | "anthropic";
    search: "demo" | "tavily" | "serper" | "google";
    ocr: "tesseract" | "none";
  };
  error?: string;
}
