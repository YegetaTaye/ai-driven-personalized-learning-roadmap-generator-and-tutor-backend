import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRoadmapQuery } from "@/api/progress";
import { useEnrollmentsQuery } from "@/api/enrollments";
import { useBreadcrumbStore } from "@/store/breadcrumbStore";
import { useMyLearningStore } from "@/store/myLearning.store";
import { LearnSidebar } from "./components/LearnSidebar";
import { LearnContent } from "./components/LearnContent";
import { AiInstructorPanel } from "./components/AiInstructorPanel";
import type { RoadmapNode } from "@/types";

interface Explanation {
  summary: string;
  keyPoints: string[];
  commonMistakes?: string[];
}

function Spinner() {
  return (
    <div className="flex-1 flex items-center justify-center h-full">
      <span
        className="text-[12px] tracking-widest animate-pulse"
        style={{ fontFamily: "JetBrains Mono, monospace", color: "#9a9088" }}
      >
        loading…
      </span>
    </div>
  );
}

export default function LearnPage() {
  const { id: enrollmentId = "", nodeId = "" } = useParams<{
    id: string;
    nodeId: string;
  }>();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showInstructor, setShowInstructor] = useState(true);
  const [explanation, setExplanation] = useState<Explanation | null>(null);

  const { data: roadmap, isLoading: roadmapLoading } =
    useRoadmapQuery(enrollmentId);
  const { data: enrollments } = useEnrollmentsQuery();

  const { setBreadcrumbs, clearBreadcrumbs } = useBreadcrumbStore();
  const addToMyLearning = useMyLearningStore((s) => s.add);
  const updateLastNode = useMyLearningStore((s) => s.updateLastNode);
  const enrollment = enrollments?.find((e) => e.id === enrollmentId);

  useEffect(() => {
    const crumbs = [
      { label: "Catalog", to: "/catalog" },
      ...(enrollment
        ? [
            {
              label: enrollment.domain.name,
              to: `/catalog/${enrollment.domain.slug}`,
            },
          ]
        : []),
      { label: "Roadmap", to: `/enrollments/${enrollmentId}/roadmap` },
      { label: "Learn" },
    ];
    setBreadcrumbs(crumbs);
    return () => clearBreadcrumbs();
  }, [enrollment, enrollmentId, setBreadcrumbs, clearBreadcrumbs]);

  const nodes = (roadmap?.nodes ?? []) as RoadmapNode[];
  const activeNode = nodes.find((n) => n.id === nodeId) ?? null;

  // If node is missing or locked, redirect to the first unlocked node.
  // Use primitive deps (id/flag) instead of the whole objects to avoid running
  // on every render when roadmap?.nodes ?? [] creates a new array reference.
  useEffect(() => {
    if (
      !roadmapLoading &&
      nodes.length > 0 &&
      (!activeNode || !activeNode.unlocked)
    ) {
      const first = nodes.find((n) => n.unlocked) ?? nodes[0];
      navigate(`/enrollments/${enrollmentId}/learn/${first.id}`, {
        replace: true,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roadmapLoading, activeNode?.id, activeNode?.unlocked, enrollmentId]);

  // Track last visited node in My Learning store (only updates entries already added)
  useEffect(() => {
    if (nodeId) updateLastNode(enrollmentId, nodeId);
  }, [enrollmentId, nodeId, updateLastNode]);

  // Reset explanation context when the active node changes
  useEffect(() => {
    setExplanation(null);
    setShowInstructor(true);
  }, [nodeId]);

  if (roadmapLoading) return <Spinner />;

  if (!activeNode) return null;

  return (
    <div
      className="flex h-full overflow-hidden"
      style={{ background: "#faf7f1" }}
    >
      {/* Sidebar toggle button (mobile / collapsed) */}
      <button
        className="absolute top-4 z-10 flex items-center justify-center w-6 h-6 rounded-full border shadow-sm transition-all"
        style={{
          left: sidebarOpen ? "calc(280px - 12px)" : "8px",
          background: "#faf7f1",
          borderColor: "#d6cfbf",
          color: "#6e645a",
          fontSize: 10,
        }}
        onClick={() => setSidebarOpen((v) => !v)}
        aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        {sidebarOpen ? "‹" : "›"}
      </button>

      {/* Left sidebar */}
      {sidebarOpen && (
        <aside
          className="shrink-0 border-r overflow-hidden flex flex-col"
          style={{ width: 280, borderColor: "#d6cfbf" }}
        >
          <LearnSidebar
            nodes={nodes}
            activeNodeId={nodeId}
            enrollmentId={enrollmentId}
          />
        </aside>
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-hidden flex flex-col">
        <LearnContent
          key={activeNode.id}
          node={activeNode}
          enrollmentId={enrollmentId}
          onExplanationRequested={() => {
            if (enrollment) {
              addToMyLearning({
                enrollmentId,
                domainName: enrollment.domain.name,
                domainSlug: enrollment.domain.slug,
                lastNodeId: activeNode.id,
              });
            }
          }}
          onExplanationData={setExplanation}
        />
      </main>

      {/* AI Instructor right panel */}
      {showInstructor && (
        <AiInstructorPanel
          node={activeNode}
          explanation={explanation}
          onClose={() => setShowInstructor(false)}
          enrollmentId={enrollmentId}
        />
      )}
    </div>
  );
}
