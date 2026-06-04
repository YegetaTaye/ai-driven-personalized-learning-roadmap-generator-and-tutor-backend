import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExplanationStream } from '@/api/explanation';
import { MASTERY_CONFIG } from '@/lib/masteryConfig';
import { useMyLearningStore } from '@/store/myLearning.store';
import { InlineQuiz } from './InlineQuiz';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { ReadAloudButton } from '@/components/ui/ReadAloudButton';
import { useReadAloud } from '@/hooks/useReadAloud';
import type { RoadmapNode } from '@/types';

interface Explanation {
  summary: string;
  keyPoints: string[];
  commonMistakes?: string[];
}

interface LearnContentProps {
  node: RoadmapNode;
  enrollmentId: string;
  onExplanationRequested: () => void;
  onExplanationData?: (explanation: Explanation | null) => void;
}

/** Blinking cursor shown while the stream is active */
function StreamCursor() {
  return (
    <span
      className="inline-block w-[2px] h-[1em] ml-0.5 align-middle animate-pulse"
      style={{ background: 'oklch(0.62 0.18 28)', borderRadius: 1 }}
    />
  );
}

function StreamingPlaceholder() {
  return (
    <div className="flex flex-col gap-5 py-4">
      {/* First skeleton line fades in quickly, rest pulse */}
      <div className="flex flex-col gap-2.5 animate-pulse">
        <div className="h-3 rounded w-1/3" style={{ background: '#ebe6db' }} />
        <div className="h-4 rounded w-full" style={{ background: '#ebe6db' }} />
        <div className="h-4 rounded w-5/6" style={{ background: '#ebe6db' }} />
      </div>
      <p
        className="text-[12px] text-center mt-2"
        style={{ fontFamily: 'JetBrains Mono, monospace', color: '#9a9088' }}
      >
        Generating explanation…
      </p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[10px] tracking-[0.12em] uppercase mb-2"
      style={{ fontFamily: 'JetBrains Mono, monospace', color: '#9a9088' }}
    >
      {children}
    </div>
  );
}

export function LearnContent({ node, enrollmentId, onExplanationRequested, onExplanationData }: LearnContentProps) {
  const navigate = useNavigate();
  const hasVisited = useMyLearningStore((s) => s.visitedExplanationNodeIds.includes(node.id));
  const markExplanationVisited = useMyLearningStore((s) => s.markExplanationVisited);
  const [enabled, setEnabled] = useState(() => hasVisited && node.unlocked);
  const [view, setView] = useState<'explanation' | 'quiz'>('explanation');
  const { state: readState, toggle: toggleRead } = useReadAloud();

  const { sections, isStreaming, isDone, isError } = useExplanationStream(node.id, enabled);

  // Notify parent once when the explanation stream finishes.
  // `sections` is intentionally excluded from deps — parseStreamSections() returns a
  // new object reference on every render, which would cause an infinite update loop.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isDone && sections.summary) {
      onExplanationData?.({
        summary: sections.summary,
        keyPoints: sections.keyPoints,
        commonMistakes: sections.commonMistakes,
      });
    }
  }, [isDone, onExplanationData]);

  const cfg = MASTERY_CONFIG[node.masteryState];
  const isLocked = !node.unlocked;
  // Allow quiz once the node is unlocked and the stream is either done or hasn't started
  const canTakeQuiz = node.unlocked && (!enabled || isDone);

  if (view === 'quiz') {
    return <InlineQuiz nodeId={node.id} enrollmentId={enrollmentId} onBack={() => setView('explanation')} />;
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Node header */}
      <div className="px-8 pt-8 pb-6 border-b" style={{ borderColor: '#e8e2d9' }}>
        <div className="flex items-center gap-3 mb-3">
          <span
            className="inline-flex items-center text-[10px] tracking-[0.1em] uppercase px-2 py-1 rounded-full border font-mono"
            style={{ color: cfg.textColor, borderColor: cfg.borderColor, background: cfg.backgroundColor }}
          >
            {cfg.label}
          </span>
          {node.difficultyLevel != null && (
            <div className="flex gap-0.5">
              {[1, 2, 3].map((i) => (
                <svg key={i} width="10" height="10" viewBox="0 0 10 10">
                  <polygon
                    points="5,1 6.2,3.8 9,4.2 7,6.2 7.5,9 5,7.6 2.5,9 3,6.2 1,4.2 3.8,3.8"
                    fill={i <= node.difficultyLevel! ? 'oklch(0.62 0.18 28)' : '#d6cfbf'}
                  />
                </svg>
              ))}
            </div>
          )}
        </div>
        <h1
          className="text-[34px] font-medium leading-tight tracking-[-0.015em] mb-2"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: '#1a1614' }}
        >
          {node.title}
        </h1>
        {node.description && (
          <p
            className="text-[16px] leading-relaxed"
            style={{ fontFamily: "'Crimson Pro', serif", color: '#5a524a' }}
          >
            {node.description}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-4 mt-4">
          {node.estimatedHours != null && (
            <span className="text-[12px] font-mono" style={{ color: '#9a9088' }}>
              {Number(node.estimatedHours)}h estimated
            </span>
          )}
          {node.attemptsCount > 0 && (
            <span className="text-[12px] font-mono" style={{ color: '#9a9088' }}>
              {node.attemptsCount} attempt{node.attemptsCount !== 1 ? 's' : ''}
            </span>
          )}
          {node.bestQuizScore != null && (
            <span className="text-[12px] font-mono" style={{ color: '#9a9088' }}>
              Best score: {node.bestQuizScore}%
            </span>
          )}
        </div>
      </div>

      {/* AI Explanation body */}
      <div className="flex-1 px-8 py-7">
        {!enabled && (
          <div className="flex flex-col items-center gap-4 py-14">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-[22px]"
              style={{ background: '#f3efe7', border: '1px solid #d6cfbf' }}
            >
              ✦
            </div>
            <div className="text-center max-w-sm">
              <p
                className="text-[18px] mb-1"
                style={{ fontFamily: "'Cormorant Garamond', serif", color: '#1a1614' }}
              >
                {isLocked ? 'This node is locked' : 'AI-powered explanation'}
              </p>
              <p
                className="text-[14px]"
                style={{ fontFamily: "'Crimson Pro', serif", color: '#6e645a' }}
              >
                {isLocked
                  ? 'Complete prerequisite nodes first to unlock learning content and explanation generation.'
                  : 'Get a clear, concise explanation of this topic tailored for learners.'}
              </p>
            </div>
            <button
              className="px-6 py-2.5 rounded-full text-[15px] transition-all hover:opacity-90 disabled:opacity-45 disabled:cursor-not-allowed"
              style={{
                fontFamily: "'Crimson Pro', serif",
                background: isLocked ? '#ebe6db' : '#1a1614',
                color: isLocked ? '#9a9088' : '#f3efe7',
              }}
              disabled={isLocked}
              onClick={() => {
                if (isLocked) return;
                markExplanationVisited(node.id);
                setEnabled(true);
                onExplanationRequested();
              }}
            >
              {isLocked ? '🔒 Locked until prerequisites are done' : 'Generate explanation'}
            </button>
          </div>
        )}

        {/* While the stream is running but no content yet → skeleton */}
        {enabled && isStreaming && !sections.summary && <StreamingPlaceholder />}

        {enabled && isError && (
          <p
            className="text-[14px] py-10 text-center italic"
            style={{ fontFamily: "'Crimson Pro', serif", color: '#9a9088' }}
          >
            Could not generate explanation. Please try again later.
          </p>
        )}

        {/* Progressive streaming render — sections appear as tokens arrive */}
        {enabled && !isError && sections.summary && (
          <div className="flex flex-col gap-8 max-w-2xl">

            {/* Summary — appears first and grows as the model streams */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <SectionLabel>Summary</SectionLabel>
                {isDone && (
                  <ReadAloudButton
                    text={[
                      sections.summary,
                      sections.whyItMatters ? 'Why it matters. ' + sections.whyItMatters : '',
                      sections.keyPoints.length ? 'Key points. ' + sections.keyPoints.join('. ') : '',
                      sections.example ? 'Example. ' + sections.example : '',
                      sections.commonMistakes.length ? 'Common mistakes. ' + sections.commonMistakes.join('. ') : '',
                    ].filter(Boolean).join(' ')}
                    state={readState}
                    onToggle={toggleRead}
                  />
                )}
              </div>
              <div className="text-[17px]">
                <MarkdownRenderer context="content">{sections.summary}</MarkdownRenderer>
                {isStreaming && !sections.whyItMatters && !sections.keyPoints.length && <StreamCursor />}
              </div>
            </div>

            {/* Why it matters — motivational context */}
            {sections.whyItMatters && (
              <div
                className="rounded-[10px] border-l-2 pl-4 py-1"
                style={{ borderColor: 'oklch(0.62 0.18 28)' }}
              >
                <SectionLabel>Why it matters</SectionLabel>
                <div className="text-[16px]" style={{ fontFamily: "'Crimson Pro', serif", color: '#5a524a' }}>
                  <MarkdownRenderer context="content">{sections.whyItMatters}</MarkdownRenderer>
                  {isStreaming && !sections.keyPoints.length && <StreamCursor />}
                </div>
              </div>
            )}

            {/* Key Points — render as they arrive */}
            {sections.keyPoints.length > 0 && (
              <div>
                <SectionLabel>Key points</SectionLabel>
                <div className="flex flex-col gap-3">
                  {sections.keyPoints.map((point, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span
                        className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono mt-0.5"
                        style={{ background: 'oklch(0.62 0.18 28)', color: '#fff' }}
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <MarkdownRenderer context="content">{point}</MarkdownRenderer>
                        {isStreaming && !sections.example && !sections.commonMistakes.length && i === sections.keyPoints.length - 1 && (
                          <StreamCursor />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Example — concrete code/scenario */}
            {sections.example && (
              <div>
                <SectionLabel>Example</SectionLabel>
                <div
                  className="rounded-[10px] border p-4 text-[14px]"
                  style={{ borderColor: '#d6cfbf', background: '#f3efe7', fontFamily: 'JetBrains Mono, monospace' }}
                >
                  <MarkdownRenderer context="code">{sections.example}</MarkdownRenderer>
                  {isStreaming && !sections.commonMistakes.length && <StreamCursor />}
                </div>
              </div>
            )}

            {/* Common Mistakes — render when section appears */}
            {sections.commonMistakes.length > 0 && (
              <div>
                <SectionLabel>Common mistakes</SectionLabel>
                <div
                  className="rounded-[10px] border p-4 flex flex-col gap-2.5"
                  style={{ borderColor: '#f0d9c8', background: 'color-mix(in srgb, oklch(0.62 0.18 28) 5%, #faf7f1)' }}
                >
                  {sections.commonMistakes.map((mistake, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="shrink-0 text-[13px] mt-0.5" style={{ color: 'oklch(0.62 0.18 28)' }}>⚠</span>
                      <div className="min-w-0 flex-1" style={{ color: '#5a3020' }}>
                        <MarkdownRenderer context="content">{mistake}</MarkdownRenderer>
                        {isStreaming && i === sections.commonMistakes.length - 1 && <StreamCursor />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div
        className="px-8 py-5 border-t flex items-center gap-3"
        style={{ borderColor: '#e8e2d9', background: '#faf7f1' }}
      >
        <button
          className="px-6 py-2.5 rounded-full text-[15px] transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            fontFamily: "'Crimson Pro', serif",
            background: canTakeQuiz ? '#1a1614' : '#ebe6db',
            color: canTakeQuiz ? '#f3efe7' : '#9a9088',
          }}
          disabled={!canTakeQuiz}
          onClick={() => canTakeQuiz && setView('quiz')}
        >
          Take quiz →
        </button>
        <button
          className="px-5 py-2.5 rounded-full text-[15px] border transition-all hover:bg-muted"
          style={{ fontFamily: "'Crimson Pro', serif", borderColor: '#c2b9a6', color: '#6e645a' }}
          onClick={() => navigate(`/enrollments/${enrollmentId}/roadmap`)}
        >
          Back to roadmap
        </button>
      </div>
    </div>
  );
}
