import { useState, useReducer, useEffect } from 'react';
import { useMicroQuizMutation, useSubmitMicroAttemptMutation, type MicroQuiz } from '@/api/decay';
import { QuizQuestion } from '@/features/quiz/components/QuizQuestion';
import { QuizProgressBar } from '@/features/quiz/components/QuizProgressBar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { QuizQuestion as QuizQuestionType } from '@/types';

interface MicroQuizModalProps {
  nodeId: string;
  nodeTitle: string;
  enrollmentId: string;
  open: boolean;
  onClose: () => void;
}

type Phase = 'loading' | 'taking' | 'submitting' | 'pass' | 'fail' | 'error';

interface State {
  phase: Phase;
  quiz: MicroQuiz | null;
  questions: QuizQuestionType[];
  currentIndex: number;
  answers: Record<string, string>;
  scorePercent: number;
  startedAt: string;
}

type Action =
  | { type: 'QUIZ_LOADED'; quiz: MicroQuiz; startedAt: string }
  | { type: 'SELECT'; questionId: string; answer: string }
  | { type: 'NEXT' }
  | { type: 'SUBMIT_START' }
  | { type: 'DONE'; scorePercent: number; passed: boolean }
  | { type: 'ERROR' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'QUIZ_LOADED':
      return { ...state, phase: 'taking', quiz: action.quiz, questions: action.quiz.questions, startedAt: action.startedAt };
    case 'SELECT':
      return { ...state, answers: { ...state.answers, [action.questionId]: action.answer } };
    case 'NEXT':
      return { ...state, currentIndex: Math.min(state.currentIndex + 1, state.questions.length - 1) };
    case 'SUBMIT_START':
      return { ...state, phase: 'submitting' };
    case 'DONE':
      return { ...state, phase: action.passed ? 'pass' : 'fail', scorePercent: action.scorePercent };
    case 'ERROR':
      return { ...state, phase: 'error' };
    default:
      return state;
  }
}

const initial: State = {
  phase: 'loading',
  quiz: null,
  questions: [],
  currentIndex: 0,
  answers: {},
  scorePercent: 0,
  startedAt: '',
};

export function MicroQuizModal({ nodeId, nodeTitle, enrollmentId, open, onClose }: MicroQuizModalProps) {
  const [state, dispatch] = useReducer(reducer, initial);
  const [didLoad, setDidLoad] = useState(false);

  const generateMutation = useMicroQuizMutation();
  const submitMutation = useSubmitMicroAttemptMutation();

  // Generate the micro-quiz as soon as the modal opens
  useEffect(() => {
    if (!open) return;
    if (didLoad) return;
    setDidLoad(true);
    generateMutation.mutateAsync(nodeId)
      .then((quiz) => dispatch({ type: 'QUIZ_LOADED', quiz, startedAt: new Date().toISOString() }))
      .catch(() => dispatch({ type: 'ERROR' }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Handle dialog close triggered by user (Escape / click-outside)
  const handleOpen = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
      setTimeout(() => setDidLoad(false), 300);
    }
  };

  const q = state.questions[state.currentIndex];
  const isLastQuestion = state.currentIndex === state.questions.length - 1;
  const currentAnswer = q ? state.answers[q.id] : undefined;

  const handleNext = () => {
    if (isLastQuestion) {
      handleSubmit();
    } else {
      dispatch({ type: 'NEXT' });
    }
  };

  const handleSubmit = async () => {
    if (!state.quiz) return;
    dispatch({ type: 'SUBMIT_START' });
    try {
      const result = await submitMutation.mutateAsync({
        quizId: state.quiz.id,
        nodeId,
        payload: {
          enrollmentId,
          answers: Object.entries(state.answers).map(([questionId, answer]) => ({ questionId, answer })),
          startedAt: state.startedAt,
        },
      });
      dispatch({ type: 'DONE', scorePercent: result.scorePercent, passed: result.passed });
    } catch {
      dispatch({ type: 'ERROR' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent
        className="max-w-lg"
        style={{ background: '#faf7f1', borderColor: '#d6cfbf' }}
      >
        {/* Loading */}
        {(state.phase === 'loading' || generateMutation.isPending) && (
          <div className="flex flex-col items-center gap-3 py-8">
            <span className="text-[12px] animate-pulse" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#9a9088' }}>
              Generating micro-quiz…
            </span>
          </div>
        )}

        {/* Error */}
        {state.phase === 'error' && (
          <div className="py-6 text-center">
            <p className="text-[15px]" style={{ fontFamily: "'Crimson Pro', serif", color: '#9a9088' }}>
              Failed to load quiz. Please try again.
            </p>
            <button onClick={onClose} className="mt-4 text-sm underline" style={{ color: '#6e645a' }}>Close</button>
          </div>
        )}

        {/* Taking */}
        {(state.phase === 'taking' || state.phase === 'submitting') && q && (
          <>
            <DialogHeader>
              <DialogTitle
                className="text-[18px]"
                style={{ fontFamily: "'Cormorant Garamond', serif", color: '#1a1614' }}
              >
                Quick Review: {nodeTitle}
              </DialogTitle>
            </DialogHeader>

            <div className="mt-1 mb-4">
              <QuizProgressBar current={state.currentIndex + 1} total={state.questions.length} />
            </div>

            <QuizQuestion
              question={q}
              selectedAnswer={currentAnswer}
              onSelect={(answer) => dispatch({ type: 'SELECT', questionId: q.id, answer })}
            />

            <div className="flex justify-end mt-5">
              <button
                onClick={handleNext}
                disabled={!currentAnswer || state.phase === 'submitting'}
                className="px-5 py-2.5 rounded-full text-[15px] transition-all active:scale-[0.98] disabled:opacity-40"
                style={{ background: '#1a1614', color: '#faf7f1', fontFamily: "'Crimson Pro', serif" }}
              >
                {state.phase === 'submitting' ? 'Submitting…' : isLastQuestion ? 'Submit' : 'Next →'}
              </button>
            </div>
          </>
        )}

        {/* Pass outcome */}
        {state.phase === 'pass' && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <span className="text-[48px]">✓</span>
            <div>
              <p className="text-[22px]" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#1a1614' }}>
                Knowledge retained!
              </p>
              <p className="text-[14px] mt-1" style={{ fontFamily: "'Crimson Pro', serif", color: '#6e645a' }}>
                Score: {state.scorePercent.toFixed(0)}% · Node remains mastered.
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-full text-[15px]"
              style={{ background: '#1a1614', color: '#faf7f1', fontFamily: "'Crimson Pro', serif" }}
            >
              Continue
            </button>
          </div>
        )}

        {/* Fail outcome */}
        {state.phase === 'fail' && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <span className="text-[48px]">📚</span>
            <div>
              <p className="text-[22px]" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#1a1614' }}>
                Needs review
              </p>
              <p className="text-[14px] mt-1 max-w-xs" style={{ fontFamily: "'Crimson Pro', serif", color: '#6e645a' }}>
                Score: {state.scorePercent.toFixed(0)}% · Node moved to In Progress — revisit the resources and retake the full quiz.
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-full text-[15px] border"
              style={{ borderColor: '#d6cfbf', color: '#6e645a', fontFamily: "'Crimson Pro', serif" }}
            >
              Got it
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
