import type { EvidenceGraph, EvidenceItem, Source, ProvenanceCheck, IntegrityCheck, EvidenceScore } from "@/lib/types";

export function buildEvidenceGraph(params: {
  claimText: string;
  evidence: EvidenceItem[];
  sources: Source[];
  provenance: ProvenanceCheck | null;
  integrity: IntegrityCheck | null;
  score: EvidenceScore | null;
}): EvidenceGraph {
  const { claimText, evidence, sources, provenance, integrity, score } = params;
  const sourceById = new Map(sources.map((s) => [s.id, s]));

  const nodes: EvidenceGraph["nodes"] = [];
  const edges: EvidenceGraph["edges"] = [];

  nodes.push({ id: "claim", type: "claim", label: claimText.slice(0, 90) });

  const supporting = evidence.filter((e) => e.relation === "supports");
  const contradicting = evidence.filter((e) => e.relation === "contradicts");

  if (supporting.length > 0) {
    nodes.push({
      id: "supporting_group",
      type: "supporting_group",
      label: "Supporting Evidence",
      sublabel: `${supporting.length} item(s)`,
    });
    edges.push({ from: "claim", to: "supporting_group" });
    supporting.forEach((e) => {
      const src = sourceById.get(e.sourceId);
      if (!src) return;
      const nodeId = `source_${src.id}`;
      if (!nodes.find((n) => n.id === nodeId)) {
        nodes.push({ id: nodeId, type: "source", label: src.publisher, sublabel: `★ ${Math.round(src.credibilityScore / 20)}/5`, refId: src.id });
      }
      edges.push({ from: "supporting_group", to: nodeId });
    });
  }

  if (contradicting.length > 0) {
    nodes.push({
      id: "contradicting_group",
      type: "contradicting_group",
      label: "Contradicting Evidence",
      sublabel: `${contradicting.length} item(s)`,
    });
    edges.push({ from: "claim", to: "contradicting_group" });
    contradicting.forEach((e) => {
      const src = sourceById.get(e.sourceId);
      if (!src) return;
      const nodeId = `source_${src.id}`;
      if (!nodes.find((n) => n.id === nodeId)) {
        nodes.push({ id: nodeId, type: "source", label: src.publisher, sublabel: `★ ${Math.round(src.credibilityScore / 20)}/5`, refId: src.id });
      }
      edges.push({ from: "contradicting_group", to: nodeId });
    });
  }

  if (provenance) {
    nodes.push({
      id: "provenance",
      type: "provenance",
      label: "Provenance Signals",
      sublabel: provenance.signalsAvailable ? "Available" : "Unavailable",
    });
    edges.push({ from: "claim", to: "provenance" });
  }

  if (integrity && integrity.status !== "not_applicable") {
    nodes.push({
      id: "integrity",
      type: "integrity",
      label: "Integrity Signals",
      sublabel: integrity.headline,
    });
    edges.push({ from: "claim", to: "integrity" });
  }

  if (score) {
    nodes.push({
      id: "score",
      type: "score",
      label: "Evidence Score",
      sublabel: `${score.total}/100`,
    });
    edges.push({ from: "claim", to: "score" });
  }

  return { nodes, edges };
}
