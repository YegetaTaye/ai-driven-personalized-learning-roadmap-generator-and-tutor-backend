import { Link, useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { BrandMark } from "@/components/layout/BrandMark";
import { Button } from "@/components/ui/button";
import { useAttemptReviewQuery } from "@/api/quizzes";
import { AnswerReview } from "./components/AnswerReview";

export default function AttemptReviewPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: attempt, isLoading, isError } = useAttemptReviewQuery(id);

  const pageBackground = "#f3efe7";

  if (isLoading) {
    return (
      <div
        className="flex flex-1 items-center justify-center"
        style={{ background: pageBackground }}
      >
        <span
          className="font-mono text-xs tracking-widest animate-pulse"
          style={{ color: "#9a9088" }}
        >
          loading review…
        </span>
      </div>
    );
  }

  if (isError || !attempt) {
    return (
      <div
        className="flex flex-1 items-center justify-center flex-col gap-4"
        style={{ background: pageBackground }}
      >
        <p style={{ fontFamily: "'Crimson Pro', serif", color: "#6e645a" }}>
          Attempt not found.
        </p>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          Go back
        </Button>
      </div>
    );
  }

  const submittedMap = new Map(
    (attempt.answers as { questionId: string; answer: string }[]).map((a) => [
      a.questionId,
      a.answer,
    ]),
  );

  const correct = attempt.quiz.questions.filter(
    (q) => submittedMap.get(q.id) === q.correctAnswer,
  ).length;

  const scorePercent = Math.round(Number(attempt.scorePercent));

  return (
    <div
      className="flex flex-col flex-1 min-h-0 overflow-y-auto"
      style={{
        fontFamily: "'Crimson Pro', Georgia, serif",
        background: pageBackground,
        color: "#1a1614",
      }}
    >
      {/* Topbar */}
      <header
        className="sticky top-0 h-14 flex items-center gap-2 px-6 z-40"
        style={{
          background: "color-mix(in srgb, #f3efe7 92%, transparent)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid #d6cfbf",
        }}
      >
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <BrandMark size={22} />
          <span
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 20,
              letterSpacing: "-0.01em",
              color: "#3d342a",
            }}
          >
            Yeneta
            <em style={{ fontStyle: "italic", color: "#6e645a" }}>.learn</em>
          </span>
        </Link>
        <span style={{ color: "#c2b9a6", margin: "0 6px" }}>/</span>
        <nav
          className="flex items-center gap-1.5 text-[13px]"
          style={{ fontFamily: "JetBrains Mono, monospace", color: "#6e645a" }}
        >
          <Link to="/dashboard" className="hover:text-accent transition-colors">
            Dashboard
          </Link>
          <span style={{ color: "#c2b9a6" }}>/</span>
          <span style={{ color: "#1a1614", fontWeight: 600 }}>Review</span>
        </nav>
      </header>

      {/* Body */}
      <div className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="mb-6">
          <div
            className="text-[12px] tracking-[0.12em] uppercase mb-1"
            style={{
              fontFamily: "JetBrains Mono, monospace",
              color: "#9a9088",
            }}
          >
            attempt review
          </div>
          <h1
            className="text-[30px] font-medium leading-tight"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            {attempt.node.title}
          </h1>
          <div
            className="flex items-center gap-4 mt-2 text-[13px]"
            style={{
              color: "#6e645a",
              fontFamily: "JetBrains Mono, monospace",
            }}
          >
            <span>
              {scorePercent}% · {correct}/{attempt.quiz.questions.length}{" "}
              correct
            </span>
            <span>·</span>
            <span>{format(new Date(attempt.completedAt), "MMM d, yyyy")}</span>
            <span
              className="px-2 py-0.5 rounded-full border text-[10px] uppercase tracking-widest"
              style={{
                borderColor: "#d6cfbf",
                color: attempt.outcome.includes("pass")
                  ? "oklch(0.60 0.13 150)"
                  : "oklch(0.60 0.18 28)",
              }}
            >
              {attempt.outcome.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Questions */}
        <div className="flex flex-col gap-4">
          {attempt.quiz.questions.map((q) => (
            <AnswerReview
              key={q.id}
              question={q}
              submitted={submittedMap.get(q.id)}
            />
          ))}
        </div>

        {/* Footer actions */}
        <div className="flex gap-3 mt-8">
          <Button
            className="rounded-full h-10 px-6"
            style={{
              background: "#1a1614",
              color: "#f3efe7",
              fontFamily: "'Crimson Pro', serif",
              fontSize: 15,
            }}
            onClick={() => navigate(-1)}
          >
            ← Back
          </Button>
          <Button
            variant="outline"
            className="rounded-full h-10 px-6"
            style={{
              borderColor: "#c2b9a6",
              fontFamily: "'Crimson Pro', serif",
              fontSize: 15,
            }}
            onClick={() => navigate(`/quiz/${attempt.nodeId}`)}
          >
            Retake quiz
          </Button>
        </div>
      </div>
    </div>
  );
}
