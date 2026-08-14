"use client";

import { useMemo, useState } from "react";
import type { EvidenceGraph, EvidenceItem, Source } from "@/lib/types";

const NODE_COLOR: Record<string, string> = {
  claim: "var(--pc-navy-900)",
  supporting_group: "var(--pc-green)",
  contradicting_group: "var(--pc-red)",
  source: "var(--pc-teal)",
  integrity: "var(--pc-amber)",
  provenance: "var(--pc-amber)",
  score: "var(--pc-navy-700)",
};

interface LaidOutNode {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export function EvidenceGraphView({
  graph,
  sources,
  evidence,
}: {
  graph: EvidenceGraph;
  sources: Source[];
  evidence: EvidenceItem[];
}) {
  const [selected, setSelected] = useState<string | null>(null);

  const layout = useMemo(() => layoutGraph(graph), [graph]);
  const width = 900;
  const height = Math.max(360, layout.maxY + 90);

  const selectedSource = selected ? sources.find((s) => s.id === graph.nodes.find((n) => n.id === selected)?.refId) : null;
  const selectedEvidence = selectedSource ? evidence.filter((e) => e.sourceId === selectedSource.id) : [];

  return (
    <div className="grid md:grid-cols-[1fr_280px] gap-4">
      <div className="overflow-x-auto border border-[var(--pc-hairline)] rounded-lg bg-white/50">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="min-w-[700px]">
          {graph.edges.map((edge, i) => {
            const from = layout.positions.get(edge.from);
            const to = layout.positions.get(edge.to);
            if (!from || !to) return null;
            const fromX = from.x + from.w / 2;
            const fromY = from.y + from.h;
            const toX = to.x + to.w / 2;
            const toY = to.y;
            const midY = (fromY + toY) / 2;
            return (
              <path
                key={i}
                d={`M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`}
                fill="none"
                stroke="var(--pc-hairline)"
                strokeWidth={1.5}
              />
            );
          })}

          {graph.nodes.map((node) => {
            const pos = layout.positions.get(node.id);
            if (!pos) return null;
            const color = NODE_COLOR[node.type] ?? "var(--pc-ink-soft)";
            const clickable = node.type === "source";
            const isSelected = selected === node.id;
            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => clickable && setSelected(isSelected ? null : node.id)}
                style={{ cursor: clickable ? "pointer" : "default" }}
              >
                <rect
                  width={pos.w}
                  height={pos.h}
                  rx={10}
                  fill={node.type === "claim" ? color : "white"}
                  stroke={color}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                />
                <text
                  x={pos.w / 2}
                  y={pos.h / 2 - (node.sublabel ? 6 : 0)}
                  textAnchor="middle"
                  fontSize={node.type === "claim" ? 13 : 12}
                  fontFamily="var(--font-plex-sans)"
                  fontWeight={600}
                  fill={node.type === "claim" ? "white" : "var(--pc-ink)"}
                >
                  {truncate(node.label, node.type === "claim" ? 60 : 24)}
                </text>
                {node.sublabel && (
                  <text
                    x={pos.w / 2}
                    y={pos.h / 2 + 12}
                    textAnchor="middle"
                    fontSize={10.5}
                    fontFamily="var(--font-plex-mono)"
                    fill={node.type === "claim" ? "rgba(255,255,255,0.75)" : "var(--pc-ink-soft)"}
                  >
                    {node.sublabel}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="border border-[var(--pc-hairline)] rounded-lg p-4 bg-white/50 text-sm">
        {!selectedSource ? (
          <p className="text-ink-soft">
            Click a <span style={{ color: "var(--pc-teal)" }}>source node</span> in the graph to inspect its
            publisher, credibility, and the exact evidence snippet it contributed.
          </p>
        ) : (
          <div className="space-y-2">
            <div className="font-semibold text-navy-900">{selectedSource.publisher}</div>
            <div className="text-xs text-ink-soft">{selectedSource.title}</div>
            <a
              href={selectedSource.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-teal underline break-all"
            >
              {selectedSource.url}
            </a>
            <div className="text-xs font-mono-data text-ink-soft">
              Date: {selectedSource.publishedAt ?? "Unknown"} · Credibility: {selectedSource.credibilityScore}/100
            </div>
            <div className="pt-2 border-t border-[var(--pc-hairline)] space-y-2">
              {selectedEvidence.map((e) => (
                <div key={e.id} className="text-xs">
                  <span
                    className="font-semibold uppercase mr-1"
                    style={{ color: e.relation === "supports" ? "var(--pc-green)" : e.relation === "contradicts" ? "var(--pc-red)" : "var(--pc-amber)" }}
                  >
                    {e.relation}
                  </span>
                  &ldquo;{e.snippet.slice(0, 140)}{e.snippet.length > 140 ? "…" : ""}&rdquo;
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

function layoutGraph(graph: EvidenceGraph) {
  const positions = new Map<string, LaidOutNode>();
  const rowGap = 110;
  const claimNode = graph.nodes.find((n) => n.id === "claim");
  const claimW = 340;
  positions.set("claim", { id: "claim", x: 900 / 2 - claimW / 2, y: 20, w: claimW, h: 56 });

  const groupIds = graph.nodes
    .filter((n) => n.type === "supporting_group" || n.type === "contradicting_group" || n.type === "integrity" || n.type === "provenance" || n.type === "score")
    .map((n) => n.id);

  const groupW = 170;
  const groupsY = 20 + 56 + rowGap - 40;
  const totalGroupsWidth = groupIds.length * groupW + (groupIds.length - 1) * 24;
  let gx = 900 / 2 - totalGroupsWidth / 2;
  groupIds.forEach((id) => {
    positions.set(id, { id, x: gx, y: groupsY, w: groupW, h: 50 });
    gx += groupW + 24;
  });

  // Source nodes under their respective group, grouped by which group edges to them
  const sourceIds = graph.nodes.filter((n) => n.type === "source").map((n) => n.id);
  const parentOf = new Map<string, string>();
  graph.edges.forEach((e) => {
    if (sourceIds.includes(e.to)) parentOf.set(e.to, e.from);
  });

  const byParent = new Map<string, string[]>();
  sourceIds.forEach((sid) => {
    const parent = parentOf.get(sid) ?? "supporting_group";
    byParent.set(parent, [...(byParent.get(parent) ?? []), sid]);
  });

  const sourceW = 150;
  const sourcesY = groupsY + 50 + rowGap - 40;
  let maxY = sourcesY + 60;

  byParent.forEach((ids, parentId) => {
    const parentPos = positions.get(parentId);
    if (!parentPos) return;
    const totalW = ids.length * sourceW + (ids.length - 1) * 16;
    let sx = parentPos.x + parentPos.w / 2 - totalW / 2;
    ids.forEach((sid) => {
      positions.set(sid, { id: sid, x: sx, y: sourcesY, w: sourceW, h: 50 });
      sx += sourceW + 16;
    });
    maxY = Math.max(maxY, sourcesY + 60);
  });

  return { positions, maxY, claimNode };
}
