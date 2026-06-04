// ─── RoadmapPage ──────────────────────────────────────────────────────────────
// Route: /enrollments/:id/roadmap
// Composes ProgressSidebar + RoadmapCanvas + NodeDetailDrawer.
// Data is fetched via TanStack Query hooks (see src/api/progress.ts).

import React, { useState, useCallback, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";

import { ProgressSidebar } from "./components/ProgressSidebar";
import { RoadmapCanvas } from "./components/RoadmapCanvas";
import { NodeDetailDrawer } from "./components/NodeDetailDrawer";

import type {
  RoadmapData,
  RoadmapNode,
  ProgressStats,
  BranchPath,
} from "./roadmap.types";

// ── API hooks ─────────────────────────────────────────────────────────────────
function useRoadmapQuery(enrollmentId: string) {
  return useQuery({
    queryKey: ["roadmap", enrollmentId],
    queryFn: () =>
      apiClient
        .get<RoadmapData>(`/enrollments/${enrollmentId}/roadmap`)
        .then((r) => r.data),
    enabled: Boolean(enrollmentId),
  });
}

function useProgressStatsQuery(enrollmentId: string) {
  return useQuery({
    queryKey: ["progress-stats", enrollmentId],
    queryFn: () =>
      apiClient
        .get<ProgressStats>(`/enrollments/${enrollmentId}/progress/stats`)
        .then((r) => r.data),
    enabled: Boolean(enrollmentId),
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
/** Return the first unlocked, not-yet-mastered node as the "next up" suggestion */
function deriveNextNode(nodes: RoadmapNode[]): RoadmapNode | null {
  return (
    nodes.find(
      (n) =>
        n.unlocked &&
        !n.isBranchingPoint &&
        (n.masteryState === "not_started" ||
          n.masteryState === "review_needed"),
    ) ?? null
  );
}

// ── Nav brand mark (pure CSS — no image) ─────────────────────────────────────
function BrandMark() {
  return (
    <span
      className="relative inline-block w-6 h-6 rounded-full flex-shrink-0"
      style={{ border: "1.5px solid #1a1614" }}
    >
      <span
        className="absolute"
        style={{
          left: "50%",
          top: 3,
          bottom: 3,
          width: 1.5,
          transform: "translateX(-50%)",
          background: "#1a1614",
        }}
      />
      <span
        className="absolute"
        style={{
          top: "50%",
          left: 3,
          right: 3,
          height: 1.5,
          transform: "translateY(-50%)",
          background: "oklch(0.62 0.18 28)",
        }}
      />
    </span>
  );
}

// ── Page skeleton ─────────────────────────────────────────────────────────────
function RoadmapSkeleton() {
  return (
    <div
      className="flex-1 flex items-center justify-center"
      style={{ color: "#9a9088" }}
    >
      <span className="font-mono text-xs tracking-widest animate-pulse">
        loading roadmap…
      </span>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function RoadmapPage() {
  const { id: enrollmentId = "" } = useParams<{ id: string }>();

  const { data: roadmap, isLoading: roadmapLoading } =
    useRoadmapQuery(enrollmentId);
  const { data: stats } = useProgressStatsQuery(enrollmentId);

  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [branchPath, setBranchPath] = useState<BranchPath>(
    () => roadmap?.selectedBranchPath ?? "frontend",
  );

  const nextNode = useMemo(
    () => (roadmap ? deriveNextNode(roadmap.nodes) : null),
    [roadmap],
  );

  const handleNodeClick = useCallback((node: RoadmapNode) => {
    setSelectedNode(node);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  // Default stats while loading
  const safeStats: ProgressStats = stats ?? {
    masteredCount: 0,
    inProgressCount: 0,
    reviewNeededCount: 0,
    notStartedCount: 0,
    rerelearnCount: 0,
    lockedCount: 0,
    totalNodes: 0,
    completionPercent: 0,
  };

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{
        fontFamily: "'Crimson Pro', Georgia, serif",
        background: "#f3efe7",
        color: "#1a1614",
      }}
    >
      {/* ── Topbar ── */}
      <header
        className="flex-shrink-0 h-[58px] flex items-center gap-2 px-6 z-40"
        style={{
          background: "color-mix(in srgb, #f3efe7 92%, transparent)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid #d6cfbf",
        }}
      >
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
          <BrandMark />
          <span
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 20,
              letterSpacing: "-0.01em",
            }}
          >
            Yeneta
            <em style={{ fontStyle: "italic", color: "#6e645a" }}>.learn</em>
          </span>
        </Link>

        <span style={{ color: "#c2b9a6", margin: "0 2px" }}>/</span>
        <nav
          className="flex items-center gap-1.5 text-[13px]"
          style={{ fontFamily: "JetBrains Mono, monospace", color: "#6e645a" }}
        >
          <Link
            to="/catalog"
            className="hover:text-[oklch(0.62_0.18_28)] transition-colors"
          >
            Catalog
          </Link>
          <span style={{ color: "#c2b9a6" }}>/</span>
          <Link
            to={`/domains/${roadmap?.nodes[0]?.slug ?? ""}`}
            className="hover:text-[oklch(0.62_0.18_28)] transition-colors"
          >
            Web Development
          </Link>
          <span style={{ color: "#c2b9a6" }}>/</span>
          <span style={{ color: "#1a1614", fontWeight: 600 }}>Roadmap</span>
        </nav>

        <div className="flex-1" />

        <button
          className="w-[34px] h-[34px] rounded-lg border grid place-items-center transition-colors"
          style={{ borderColor: "#d6cfbf", color: "#6e645a" }}
          title="Notifications"
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
        <div
          className="w-8 h-8 rounded-full grid place-items-center cursor-pointer flex-shrink-0"
          style={{
            background: "#1a1614",
            color: "#f3efe7",
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 15,
          }}
        >
          A
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left sidebar */}
        <ProgressSidebar
          domainName="Web Development"
          enrolledAt="Enrolled 14 days ago · Frontend path"
          selectedBranchPath={branchPath}
          stats={safeStats}
          nextNode={nextNode}
          onBranchChange={setBranchPath}
          onNextNodeClick={handleNodeClick}
        />

        {/* Canvas */}
        {roadmapLoading || !roadmap ? (
          <RoadmapSkeleton />
        ) : (
          <RoadmapCanvas
            roadmapNodes={roadmap.nodes}
            roadmapEdges={roadmap.edges}
            onNodeClick={handleNodeClick}
          />
        )}
      </div>

      {/* Detail drawer — portals into body via shadcn Sheet */}
      <NodeDetailDrawer
        node={selectedNode}
        open={drawerOpen}
        onClose={closeDrawer}
      />
    </div>
  );
}
