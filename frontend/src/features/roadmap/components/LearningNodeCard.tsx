import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { MASTERY_CONFIG } from "@/lib/masteryConfig";
import type { RoadmapNode } from "@/types";

// Hierarchy-level color palettes
// level 0 = root topics (warm amber), level 1 = subtopics (sage), level 2+ = deep nodes (slate)
const LEVEL_STYLES = [
  // level 0 — main topics
  {
    bg: "#fdecd4",
    border: "#d4905c",
    text: "#6b3a18",
    dotBg: "#d4905c",
    lockedBg: "#f5e8d8",
    lockedBorder: "#d0bfa8",
  },
  // level 1 — subtopics
  {
    bg: "#d8f0e0",
    border: "#5aaa78",
    text: "#1a5532",
    dotBg: "#5aaa78",
    lockedBg: "#e8f5ee",
    lockedBorder: "#a8d4b8",
  },
  // level 2+ — deep nodes
  {
    bg: "#d8e4f8",
    border: "#6080c0",
    text: "#1a2e58",
    dotBg: "#6080c0",
    lockedBg: "#eaeefc",
    lockedBorder: "#b0c0e0",
  },
] as const;

function levelStyle(level: number) {
  return LEVEL_STYLES[Math.min(level, 2)];
}

function CheckBadge() {
  return (
    <span
      className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full grid place-items-center text-[10px] font-bold text-white shadow-sm"
      style={{ background: "oklch(0.60 0.13 150)" }}
    >
      ✓
    </span>
  );
}

function SkipBadge() {
  return (
    <span
      className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full grid place-items-center text-[9px] font-bold shadow-sm"
      style={{ background: "#b0a898", color: "#faf7f1" }}
    >
      ↷
    </span>
  );
}

function LockBadge() {
  return (
    <span
      className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full grid place-items-center text-[8px] font-bold shadow-sm"
      style={{ background: "#9a9088", color: "#faf7f1" }}
    >
      🔒
    </span>
  );
}

function ReviewBadge() {
  return (
    <span
      className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full grid place-items-center text-[10px] font-bold text-white shadow-sm"
      style={{ background: "oklch(0.72 0.13 70)" }}
    >
      !
    </span>
  );
}

function BranchingNode({ data }: { data: RoadmapNode }) {
  return (
    <>
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <div
        className="w-[90px] h-[90px] rounded-[6px] grid place-items-center"
        style={{
          transform: "rotate(45deg)",
          border: `1.5px ${data.unlocked ? "solid" : "dashed"} ${data.unlocked ? "#d4905c" : "#c2b9a6"}`,
          background: data.unlocked ? "#fdecd4" : "#faf7f1",
          cursor: data.unlocked ? "pointer" : "default",
        }}
      >
        <div
          style={{ transform: "rotate(-45deg)" }}
          className="text-center px-1"
        >
          <div
            className="text-[11px] font-semibold leading-tight"
            style={{ color: "#6b3a18", fontFamily: "'Crimson Pro', serif" }}
          >
            {data.title}
          </div>
          <div
            className="text-[9px] mt-1 tracking-widest uppercase"
            style={{
              color: "#d4905c",
              fontFamily: "JetBrains Mono, monospace",
            }}
          >
            branch
          </div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
    </>
  );
}

function StandardNode({
  data,
  selected,
  level,
}: {
  data: RoadmapNode & { isAutoMastered?: boolean };
  selected: boolean;
  level: number;
}) {
  const state = data.masteryState;
  const cfg = MASTERY_CONFIG[state];
  const lvl = levelStyle(level);
  const isLocked = !data.unlocked;
  const isAutoMastered = !!data.isAutoMastered;

  // Auto-mastered nodes get a muted treatment
  const bgColor = isAutoMastered
    ? "#ebe6db"
    : isLocked
      ? lvl.lockedBg
      : state === "not_started"
        ? lvl.bg
        : cfg.backgroundColor;
  const borderColor = isAutoMastered
    ? "#c2b9a6"
    : isLocked
      ? lvl.lockedBorder
      : state === "not_started"
        ? lvl.border
        : cfg.borderColor;
  const textColor = isAutoMastered
    ? "#9a9088"
    : isLocked
      ? "#9a9088"
      : state === "not_started"
        ? lvl.text
        : cfg.textColor;

  return (
    <>
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <div
        className="relative rounded-[10px] border-[1.5px] px-3 py-2.5 transition-[transform,box-shadow] duration-[130ms]"
        style={{
          width: 160,
          background: bgColor,
          borderColor,
          borderStyle: isLocked ? "dashed" : "solid",
          ...(state === "review_needed" &&
            !isAutoMastered && {
              animation: "YenetaReviewPulse 2.2s ease-in-out infinite",
            }),
          ...(selected && { boxShadow: "0 0 0 3px rgba(200,97,58,0.35)" }),
          cursor: isLocked || isAutoMastered ? "default" : "pointer",
          opacity: isLocked ? 0.75 : isAutoMastered ? 0.65 : 1,
        }}
      >
        {/* Level indicator stripe */}
        <div
          className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full"
          style={{
            background: isLocked || isAutoMastered ? "#c2b9a6" : lvl.dotBg,
            opacity: isLocked || isAutoMastered ? 0.4 : 0.7,
          }}
        />

        {isAutoMastered && <SkipBadge />}
        {!isAutoMastered && state === "mastered" && <CheckBadge />}
        {state === "locked" && <LockBadge />}
        {!isAutoMastered && state === "review_needed" && <ReviewBadge />}

        <div
          className="text-[13px] font-semibold leading-tight pl-2"
          style={{
            fontFamily: "'Crimson Pro', serif",
            color: isLocked || isAutoMastered ? "#6e645a" : "#1a1614",
          }}
        >
          {data.title}
        </div>
        <div
          className="text-[9.5px] mt-1 tracking-[0.06em] pl-2"
          style={{
            fontFamily: "JetBrains Mono, monospace",
            color: textColor,
            opacity: 0.9,
          }}
        >
          {isAutoMastered ? "already known" : isLocked ? "locked" : cfg.label}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
    </>
  );
}

export const LearningNodeCard = memo(function LearningNodeCard(
  props: NodeProps,
) {
  const data = props.data as unknown as RoadmapNode & { _level?: number };
  if (data.isBranchingPoint) return <BranchingNode data={data} />;
  return (
    <StandardNode
      data={data}
      selected={!!props.selected}
      level={data._level ?? 0}
    />
  );
});

LearningNodeCard.displayName = "LearningNodeCard";
