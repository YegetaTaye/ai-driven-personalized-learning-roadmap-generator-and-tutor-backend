// ─── LearningNodeCard ─────────────────────────────────────────────────────────
// Custom React Flow node. Receives full RoadmapNode data via `data` prop.
// Handles all five mastery states + the branching diamond shape.

import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { MASTERY_CONFIG, masteryStyles } from "../masteryConfig";
import type { RoadmapNode } from "../roadmap.types";

// ── Badge icons ───────────────────────────────────────────────────────────────
function CheckBadge() {
  return (
    <span
      className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full
                 grid place-items-center text-[10px] font-bold text-white shadow-sm"
      style={{ background: "oklch(0.60 0.13 150)" }}
    >
      ✓
    </span>
  );
}
function LockBadge() {
  return (
    <span
      className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full
                 grid place-items-center text-[8px] font-bold shadow-sm"
      style={{ background: "#9a9088", color: "#faf7f1" }}
    >
      ⌬
    </span>
  );
}
function ReviewBadge() {
  return (
    <span
      className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full
                 grid place-items-center text-[10px] font-bold text-white shadow-sm"
      style={{ background: "oklch(0.72 0.13 70)" }}
    >
      !
    </span>
  );
}

// ── Branching diamond ─────────────────────────────────────────────────────────
function BranchingNode({ data }: { data: RoadmapNode }) {
  const isUnlocked = data.unlocked;
  return (
    <>
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <div
        className="w-[90px] h-[90px] rounded-[6px] grid place-items-center"
        style={{
          transform: "rotate(45deg)",
          border: `1.5px ${isUnlocked ? "solid" : "dashed"} ${
            isUnlocked ? "oklch(0.62 0.18 28)" : "#c2b9a6"
          }`,
          background: isUnlocked
            ? "color-mix(in srgb, oklch(0.62 0.18 28) 8%, #faf7f1)"
            : "#faf7f1",
          cursor: isUnlocked ? "pointer" : "default",
        }}
      >
        <div
          style={{ transform: "rotate(-45deg)" }}
          className="text-center px-1"
        >
          <div
            className="text-[11px] font-semibold leading-tight"
            style={{ color: "#1a1614", fontFamily: "'Crimson Pro', serif" }}
          >
            {data.title}
          </div>
          <div
            className="text-[9px] mt-1 tracking-widest uppercase"
            style={{
              color: "#9a9088",
              fontFamily: "JetBrains Mono, monospace",
            }}
          >
            branching
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
    </>
  );
}

// ── Standard node ─────────────────────────────────────────────────────────────
function StandardNode({
  data,
  selected,
}: {
  data: RoadmapNode;
  selected: boolean;
}) {
  const { state } = { state: data.masteryState };
  const cfg = MASTERY_CONFIG[state];

  return (
    <>
      <Handle type="target" position={Position.Top} className="!opacity-0" />

      <div
        className="relative w-[130px] rounded-[10px] border-[1.5px] px-3 py-2.5
                   transition-[transform,box-shadow] duration-[130ms]"
        style={{
          ...masteryStyles(state),
          ...(state === "review_needed" && {
            animation: "YenetaReviewPulse 2.2s ease-in-out infinite",
          }),
          ...(selected && { boxShadow: "0 0 0 3px rgba(200,97,58,0.35)" }),
          cursor: state === "locked" ? "default" : "pointer",
          opacity: state === "locked" ? 0.72 : 1,
        }}
      >
        {/* badges */}
        {state === "mastered" && <CheckBadge />}
        {state === "locked" && <LockBadge />}
        {state === "review_needed" && <ReviewBadge />}

        {/* title */}
        <div
          className="text-[13px] font-semibold leading-tight"
          style={{
            fontFamily: "'Crimson Pro', serif",
            color: state === "locked" ? "#6e645a" : "#1a1614",
          }}
        >
          {data.title}
        </div>

        {/* state label */}
        <div
          className="text-[9.5px] mt-1 tracking-[0.06em]"
          style={{
            fontFamily: "JetBrains Mono, monospace",
            color: cfg.textColor,
          }}
        >
          {cfg.label}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
    </>
  );
}

// ── Exported node component ───────────────────────────────────────────────────
// Register as nodeTypes={{ learningNode: LearningNodeCard }} in ReactFlow
export const LearningNodeCard = memo(function LearningNodeCard(
  props: NodeProps<RoadmapNode>,
) {
  const { data, selected } = props;
  if (data.isBranchingPoint) return <BranchingNode data={data} />;
  return <StandardNode data={data} selected={!!selected} />;
});

LearningNodeCard.displayName = "LearningNodeCard";
