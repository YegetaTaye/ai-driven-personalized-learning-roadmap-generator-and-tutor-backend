import {
  useReducer,
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import {
  Link,
  useParams,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { ReadAloudButton } from "@/components/ui/ReadAloudButton";
import { useReadAloud } from "@/hooks/useReadAloud";
import { BrandMark } from "@/components/layout/BrandMark";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuizQuery, useSubmitAttemptMutation } from "@/api/quizzes";
import { QuizQuestion } from "./components/QuizQuestion";
import { QuizProgressBar } from "./components/QuizProgressBar";
import { QuizTimer } from "./components/QuizTimer";
import { OutcomeScreen } from "./components/OutcomeScreen";
import type { AttemptResult } from "@/types";

// ── State machine ─────────────────────────────────────────────────────────────

type QuizPhase = "loading" | "ready" | "taking" | "submitting" | "outcome";

interface QuizState {
  phase: QuizPhase;
  currentQuestion: number;
  answers: Record<string, string>;
  startedAt: Date | null;
  result: AttemptResult | null;
  shuffledOptions: Record<string, string[]>;
}

type QuizAction =
  | { type: "START"; shuffledOptions: Record<string, string[]> }
  | { type: "SELECT"; questionId: string; answer: string }
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_DONE"; result: AttemptResult }
  | { type: "RETRY" };

function reducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "START":
      return {
        ...state,
        phase: "taking",
        startedAt: new Date(),
        shuffledOptions: action.shuffledOptions,
        answers: {},
      };
    case "SELECT":
      return {
        ...state,
        answers: { ...state.answers, [action.questionId]: action.answer },
      };
    case "NEXT":
      return { ...state, currentQuestion: state.currentQuestion + 1 };
    case "PREV":
      return {
        ...state,
        currentQuestion: Math.max(0, state.currentQuestion - 1),
      };
    case "SUBMIT_START":
      return { ...state, phase: "submitting" };
    case "SUBMIT_DONE":
      return { ...state, phase: "outcome", result: action.result };
    case "RETRY":
      return {
        phase: "ready",
        currentQuestion: 0,
        answers: {},
        startedAt: null,
        result: null,
        shuffledOptions: {},
      };
    default:
      return state;
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function QuizPage() {
  const { nodeId = "" } = useParams<{ nodeId: string }>();
  const [searchParams] = useSearchParams();
  const enrollmentId = searchParams.get("enrollment") ?? "";
  const navigate = useNavigate();

  const [exitOpen, setExitOpen] = useState(false);
  const { data: quiz, isLoading, isError } = useQuizQuery(nodeId);
  const submitMutation = useSubmitAttemptMutation();

  const [state, dispatch] = useReducer(reducer, {
    phase: "loading",
    currentQuestion: 0,
    answers: {},
    startedAt: null,
    result: null,
    shuffledOptions: {},
  });

  const {
    state: readState,
    toggle: toggleRead,
    stop: stopRead,
  } = useReadAloud();

  // Stop reading when the learner moves to a different question
  useEffect(() => {
    stopRead();
  }, [state.currentQuestion, stopRead]);

  const readyRef = useRef(false);
  useEffect(() => {
    if (quiz && !readyRef.current) {
      readyRef.current = true;
      dispatch({ type: "RETRY" }); // RETRY resets to 'ready' phase
    }
  }, [quiz]);

  const handleStart = useCallback(() => {
    if (!quiz) return;
    const opts: Record<string, string[]> = {};
    quiz.questions.forEach((q) => {
      opts[q.id] = shuffle(q.options ?? []);
    });
    dispatch({ type: "START", shuffledOptions: opts });
  }, [quiz]);

  const handleSelect = useCallback((questionId: string, answer: string) => {
    dispatch({ type: "SELECT", questionId, answer });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!quiz || !state.startedAt) return;
    dispatch({ type: "SUBMIT_START" });
    try {
      const result = await submitMutation.mutateAsync({
        quizId: quiz.id,
        payload: {
          enrollmentId,
          answers: quiz.questions.map((q) => ({
            questionId: q.id,
            answer: state.answers[q.id] ?? "",
          })),
          startedAt: state.startedAt.toISOString(),
        },
      });
      dispatch({ type: "SUBMIT_DONE", result });
    } catch {
      dispatch({ type: "RETRY" });
    }
  }, [quiz, state.startedAt, state.answers, enrollmentId, submitMutation]);

  const questions = quiz?.questions ?? [];
  const currentQ = questions[state.currentQuestion];
  const isLast = state.currentQuestion === questions.length - 1;
  const hasAnswered = currentQ ? Boolean(state.answers[currentQ.id]) : false;
  const allAnswered = questions.every((q) => Boolean(state.answers[q.id]));

  // Resolve shuffled options for current question
  const currentOptions = useMemo(() => {
    if (!currentQ) return [];
    return state.shuffledOptions[currentQ.id] ?? currentQ.options ?? [];
  }, [currentQ, state.shuffledOptions]);

  const pageBackground = "#f3efe7";

  if (isLoading || state.phase === "loading") {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{
          background: pageBackground,
          fontFamily: "'Crimson Pro', Georgia, serif",
        }}
      >
        <span
          className="font-mono text-xs tracking-widest animate-pulse"
          style={{ color: "#9a9088" }}
        >
          loading quiz…
        </span>
      </div>
    );
  }

  if (isError || !quiz) {
    return (
      <div
        className="flex h-screen items-center justify-center flex-col gap-4"
        style={{ background: pageBackground }}
      >
        <p style={{ fontFamily: "'Crimson Pro', serif", color: "#6e645a" }}>
          No quiz available for this node yet.
        </p>
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          style={{ fontFamily: "'Crimson Pro', serif" }}
        >
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{
        fontFamily: "'Crimson Pro', Georgia, serif",
        background: pageBackground,
        color: "#1a1614",
      }}
    >
      {/* Topbar */}
      <header
        className="shrink-0 h-14 flex items-center gap-2 px-6 z-40"
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
        <span
          className="text-[13px]"
          style={{ fontFamily: "JetBrains Mono, monospace", color: "#6e645a" }}
        >
          Quiz
        </span>

        {state.phase === "taking" && state.startedAt && (
          <div className="ml-auto">
            <QuizTimer startedAt={state.startedAt} />
          </div>
        )}
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {state.phase === "ready" && (
          <div className="flex flex-col items-center justify-center h-full gap-6 px-6">
            <div className="text-center max-w-sm">
              <div
                className="text-[12px] tracking-[0.12em] uppercase mb-3"
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  color: "#9a9088",
                }}
              >
                Ready to begin
              </div>
              <h1
                className="text-[32px] font-medium leading-tight mb-2"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                {questions.length}-question quiz
              </h1>
              <p className="text-[16px]" style={{ color: "#6e645a" }}>
                Select the best answer for each question. You can go back and
                change answers before submitting.
              </p>
            </div>
            <Button
              className="rounded-full h-11 px-8 text-[16px]"
              style={{
                background: "#1a1614",
                color: "#f3efe7",
                fontFamily: "'Crimson Pro', serif",
              }}
              onClick={handleStart}
            >
              Start quiz →
            </Button>
          </div>
        )}

        {state.phase === "taking" && currentQ && (
          <div className="flex flex-col h-full">
            {/* Progress */}
            <div
              className="px-6 pt-5 pb-4 border-b"
              style={{ borderColor: "#d6cfbf" }}
            >
              <QuizProgressBar
                current={state.currentQuestion + 1}
                total={questions.length}
              />
            </div>

            {/* Question */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <p
                  className="text-[20px] leading-snug flex-1"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    color: "#1a1614",
                    fontWeight: 500,
                  }}
                >
                  {currentQ.questionText}
                </p>
                <ReadAloudButton
                  text={`${currentQ.questionText}. Options: ${currentOptions.map((o, i) => `${["A", "B", "C", "D"][i]}: ${o}`).join(". ")}`}
                  state={readState}
                  onToggle={toggleRead}
                />
              </div>
              <QuizQuestion
                question={{ ...currentQ, options: currentOptions }}
                selectedAnswer={state.answers[currentQ.id]}
                onSelect={(answer) => handleSelect(currentQ.id, answer)}
                hideQuestionText
              />
            </div>

            {/* Navigation */}
            <div
              className="px-6 pb-6 pt-3 border-t flex items-center gap-3"
              style={{ borderColor: "#d6cfbf" }}
            >
              {state.currentQuestion > 0 && (
                <Button
                  variant="outline"
                  className="rounded-full h-10 px-5"
                  style={{
                    borderColor: "#c2b9a6",
                    fontFamily: "'Crimson Pro', serif",
                    fontSize: 15,
                  }}
                  onClick={() => dispatch({ type: "PREV" })}
                >
                  ← Back
                </Button>
              )}

              <div className="flex-1" />

              {isLast ? (
                <Button
                  className="rounded-full h-10 px-6 text-[15px]"
                  style={{
                    background: allAnswered ? "#1a1614" : "#ebe6db",
                    color: allAnswered ? "#f3efe7" : "#9a9088",
                    fontFamily: "'Crimson Pro', serif",
                  }}
                  disabled={!allAnswered || submitMutation.isPending}
                  onClick={handleSubmit}
                >
                  Submit
                </Button>
              ) : (
                <Button
                  className="rounded-full h-10 px-6 text-[15px]"
                  style={{
                    background: hasAnswered ? "#1a1614" : "#ebe6db",
                    color: hasAnswered ? "#f3efe7" : "#9a9088",
                    fontFamily: "'Crimson Pro', serif",
                  }}
                  disabled={!hasAnswered}
                  onClick={() => dispatch({ type: "NEXT" })}
                >
                  Next →
                </Button>
              )}

              {/* Exit confirmation */}
              <Button
                variant="ghost"
                className="rounded-full h-10 px-4 text-[14px]"
                style={{ fontFamily: "'Crimson Pro', serif", color: "#9a9088" }}
                onClick={() => setExitOpen(true)}
              >
                Exit
              </Button>
              <Dialog open={exitOpen} onOpenChange={setExitOpen}>
                <DialogContent style={{ fontFamily: "'Crimson Pro', serif" }}>
                  <DialogHeader>
                    <DialogTitle
                      style={{ fontFamily: "'Cormorant Garamond', serif" }}
                    >
                      Exit quiz?
                    </DialogTitle>
                    <DialogDescription>
                      Your progress will be lost and this attempt will not be
                      recorded.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setExitOpen(false)}
                    >
                      Stay
                    </Button>
                    <Button onClick={() => navigate(-1)}>Exit</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}

        {state.phase === "submitting" && (
          <div className="flex h-full items-center justify-center">
            <span
              className="font-mono text-xs tracking-widest animate-pulse"
              style={{ color: "#9a9088" }}
            >
              submitting…
            </span>
          </div>
        )}

        {state.phase === "outcome" && state.result && (
          <OutcomeScreen
            result={state.result}
            enrollmentId={enrollmentId}
            attemptId={state.result.attempt.id}
            onRetry={() => dispatch({ type: "RETRY" })}
          />
        )}
      </div>
    </div>
  );
}
