import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  BriefcaseIcon,
  TrendingUpIcon,
  HeartIcon,
  AwardIcon,
  EyeIcon,
  BookOpenIcon,
  WrenchIcon,
  VideoIcon,
  CheckCircle2Icon,
  ZapIcon,
  ChevronsRightIcon,
  ChevronLeftIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useEnrollMutation, type EnrollResult } from "@/api/enrollments";
import { getDomainMeta } from "../lib/domainIcons";
import type {
  Domain,
  FamiliarityLevel,
  LearningGoal,
  PreferredLearningStyle,
} from "@/types";
import { useYenetaSettingsStore } from "@/store/settings.store";

// ── Types ─────────────────────────────────────────────────────────────────────

interface EnrollDialogProps {
  domain: Domain;
  open: boolean;
  onClose: () => void;
}

interface PersonalizationForm {
  familiarityLevel: FamiliarityLevel | "";
  learningGoal: LearningGoal | "";
  weeklyHours: string;
  aboutSelf: string;
  preferredLearningStyle: PreferredLearningStyle | "";
  priorSkills: string;
}

function createInitialForm(defaults: {
  weeklyHoursGoal: number;
  familiarityLevel: FamiliarityLevel;
  learningGoal: LearningGoal;
}): PersonalizationForm {
  return {
    familiarityLevel: defaults.familiarityLevel,
    learningGoal: defaults.learningGoal,
    weeklyHours: String(defaults.weeklyHoursGoal),
    aboutSelf: "",
    preferredLearningStyle: "",
    priorSkills: "",
  };
}

// ── Option tables ─────────────────────────────────────────────────────────────

const FAMILIARITY_OPTIONS: {
  value: FamiliarityLevel;
  label: string;
  desc: string;
}[] = [
  {
    value: "beginner",
    label: "Beginner",
    desc: "Little to no prior experience",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    desc: "Some experience, looking to advance",
  },
  {
    value: "advanced",
    label: "Advanced",
    desc: "Solid foundation, filling gaps",
  },
];

const GOAL_OPTIONS: {
  value: LearningGoal;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "get_job", label: "Get a job", icon: <BriefcaseIcon size={13} /> },
  {
    value: "upskill",
    label: "Upskill at work",
    icon: <TrendingUpIcon size={13} />,
  },
  { value: "hobby", label: "Personal interest", icon: <HeartIcon size={13} /> },
  {
    value: "certification",
    label: "Get certified",
    icon: <AwardIcon size={13} />,
  },
];

const LEARNING_STYLE_OPTIONS: {
  value: PreferredLearningStyle;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "visual", label: "Visual", icon: <EyeIcon size={13} /> },
  { value: "reading", label: "Reading", icon: <BookOpenIcon size={13} /> },
  { value: "hands_on", label: "Hands-on", icon: <WrenchIcon size={13} /> },
  { value: "video", label: "Video", icon: <VideoIcon size={13} /> },
];

// ── Shared sub-components ─────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="block text-[10px] tracking-[0.1em] uppercase mb-1.5"
      style={{ fontFamily: "JetBrains Mono, monospace", color: "#9a9088" }}
    >
      {children}
    </label>
  );
}

// ── Step 1 — intro ────────────────────────────────────────────────────────────

function Step1({
  domain,
  meta,
  onNext,
  onClose,
}: {
  domain: Domain;
  meta: ReturnType<typeof getDomainMeta>;
  onNext: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-[22px] mb-3"
          style={{
            background: meta.color,
            color: meta.accent,
            fontFamily: "monospace",
          }}
        >
          {meta.icon}
        </div>
        <DialogTitle
          className="text-[22px]"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            color: "#3d342a",
          }}
        >
          Enroll in {domain.name}
        </DialogTitle>
        <DialogDescription
          style={{
            color: "#6e645a",
            fontFamily: "'Crimson Pro', serif",
            fontSize: 14,
          }}
        >
          {domain.description}
        </DialogDescription>
      </DialogHeader>

      <p
        className="text-[14px] leading-relaxed"
        style={{ color: "#6e645a", fontFamily: "'Crimson Pro', serif" }}
      >
        Before we generate your roadmap, we'd like to personalise it based on
        your background, goals, and available time.
      </p>

      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 rounded-lg px-4 py-2.5 text-[14px] border transition-colors hover:bg-[#ebe6db]"
          style={{
            borderColor: "#d6cfbf",
            color: "#6e645a",
            fontFamily: "'Crimson Pro', serif",
          }}
        >
          Cancel
        </button>
        <button
          onClick={onNext}
          className="flex-1 rounded-lg px-4 py-2.5 text-[14px] font-semibold transition-all active:scale-[0.98]"
          style={{
            background: "oklch(0.62 0.18 28)",
            color: "#faf7f1",
            fontFamily: "'Crimson Pro', serif",
          }}
        >
          Personalise →
        </button>
      </div>
    </>
  );
}

// ── Step 2 — personalisation form ────────────────────────────────────────────

function Step2({
  form,
  onChange,
  onBack,
  onSubmit,
  isPending,
  error,
}: {
  form: PersonalizationForm;
  onChange: (patch: Partial<PersonalizationForm>) => void;
  onBack: () => void;
  onSubmit: () => void;
  isPending: boolean;
  error: string | null;
}) {
  return (
    /* Full-height flex column — fills whatever DialogContent gives us */
    <div className="flex flex-col min-h-0 flex-1">
      {/* ── Static header ───────────────────────────────────────────────── */}
      <DialogHeader className="shrink-0 pb-3">
        <DialogTitle
          className="text-[20px]"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            color: "#3d342a",
          }}
        >
          Tell us about yourself
        </DialogTitle>
        <DialogDescription
          style={{
            color: "#6e645a",
            fontFamily: "'Crimson Pro', serif",
            fontSize: 14,
          }}
        >
          This helps us tailor the roadmap to your needs.
        </DialogDescription>
      </DialogHeader>

      {/* ── Scrollable form body ─────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
        <div className="flex flex-col gap-4 pb-1">
          {/* Experience level */}
          <div>
            <FieldLabel>Your experience level</FieldLabel>
            <div className="flex flex-col gap-1.5">
              {FAMILIARITY_OPTIONS.map((opt) => {
                const selected = form.familiarityLevel === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => onChange({ familiarityLevel: opt.value })}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] border text-left transition-all"
                    style={{
                      borderColor: selected ? "oklch(0.62 0.18 28)" : "#d6cfbf",
                      background: selected
                        ? "color-mix(in srgb, oklch(0.62 0.18 28) 8%, #faf7f1)"
                        : "#faf7f1",
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                      style={{
                        borderColor: selected
                          ? "oklch(0.62 0.18 28)"
                          : "#c2b9a6",
                      }}
                    >
                      {selected && (
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ background: "oklch(0.62 0.18 28)" }}
                        />
                      )}
                    </div>
                    <div>
                      <div
                        className="text-[13px] font-medium"
                        style={{
                          fontFamily: "'Crimson Pro', serif",
                          color: "#1a1614",
                        }}
                      >
                        {opt.label}
                      </div>
                      <div
                        className="text-[12px]"
                        style={{
                          fontFamily: "'Crimson Pro', serif",
                          color: "#9a9088",
                        }}
                      >
                        {opt.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Learning goal */}
          <div>
            <FieldLabel>Your goal</FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              {GOAL_OPTIONS.map((opt) => {
                const selected = form.learningGoal === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => onChange({ learningGoal: opt.value })}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-[8px] border text-left transition-all"
                    style={{
                      borderColor: selected
                        ? "oklch(0.55 0.13 250)"
                        : "#d6cfbf",
                      background: selected
                        ? "color-mix(in srgb, oklch(0.55 0.13 250) 10%, #faf7f1)"
                        : "#faf7f1",
                    }}
                  >
                    <span
                      className="shrink-0"
                      style={{
                        color: selected ? "oklch(0.45 0.13 250)" : "#9a9088",
                      }}
                    >
                      {opt.icon}
                    </span>
                    <span
                      className="text-[13px]"
                      style={{
                        fontFamily: "'Crimson Pro', serif",
                        color: "#1a1614",
                      }}
                    >
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Weekly hours */}
          <div>
            <FieldLabel>Hours per week you can commit</FieldLabel>
            <input
              type="number"
              min={1}
              max={80}
              placeholder="e.g. 10"
              value={form.weeklyHours}
              onChange={(e) => onChange({ weeklyHours: e.target.value })}
              className="w-full px-3 py-2 rounded-[8px] border text-[14px] outline-none focus:ring-2"
              style={{
                borderColor: "#d6cfbf",
                background: "#faf7f1",
                fontFamily: "'Crimson Pro', serif",
                color: "#1a1614",
              }}
            />
          </div>

          {/* Learning style */}
          <div>
            <FieldLabel>Preferred learning style</FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              {LEARNING_STYLE_OPTIONS.map((opt) => {
                const selected = form.preferredLearningStyle === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() =>
                      onChange({ preferredLearningStyle: opt.value })
                    }
                    className="flex items-center gap-2 px-3 py-2.5 rounded-[8px] border text-left transition-all"
                    style={{
                      borderColor: selected
                        ? "oklch(0.55 0.13 150)"
                        : "#d6cfbf",
                      background: selected
                        ? "color-mix(in srgb, oklch(0.55 0.13 150) 10%, #faf7f1)"
                        : "#faf7f1",
                    }}
                  >
                    <span
                      className="shrink-0"
                      style={{
                        color: selected ? "oklch(0.45 0.13 150)" : "#9a9088",
                      }}
                    >
                      {opt.icon}
                    </span>
                    <span
                      className="text-[13px]"
                      style={{
                        fontFamily: "'Crimson Pro', serif",
                        color: "#1a1614",
                      }}
                    >
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prior skills */}
          <div>
            <FieldLabel>
              Skills you already know{" "}
              <span
                style={{
                  color: "#c2b9a6",
                  textTransform: "none",
                  letterSpacing: 0,
                }}
              >
                (optional)
              </span>
            </FieldLabel>
            <textarea
              rows={2}
              placeholder="e.g. HTML, CSS, basic JavaScript, Git…"
              value={form.priorSkills}
              onChange={(e) => onChange({ priorSkills: e.target.value })}
              className="w-full px-3 py-2 rounded-[8px] border text-[14px] outline-none focus:ring-2 resize-none"
              style={{
                borderColor: "#d6cfbf",
                background: "#faf7f1",
                fontFamily: "'Crimson Pro', serif",
                color: "#1a1614",
              }}
            />
          </div>

          {/* About self */}
          <div>
            <FieldLabel>
              Tell us about yourself{" "}
              <span
                style={{
                  color: "#c2b9a6",
                  textTransform: "none",
                  letterSpacing: 0,
                }}
              >
                (optional)
              </span>
            </FieldLabel>
            <textarea
              rows={2}
              placeholder="e.g. I'm a self-taught developer looking to transition into frontend engineering…"
              value={form.aboutSelf}
              onChange={(e) => onChange({ aboutSelf: e.target.value })}
              className="w-full px-3 py-2 rounded-[8px] border text-[14px] outline-none focus:ring-2 resize-none"
              style={{
                borderColor: "#d6cfbf",
                background: "#faf7f1",
                fontFamily: "'Crimson Pro', serif",
                color: "#1a1614",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Static footer — error + action buttons ───────────────────────── */}
      <div
        className="shrink-0 flex flex-col gap-2 pt-3 mt-1"
        style={{ borderTop: "1px solid #e8e2d9" }}
      >
        {error && (
          <p
            className="text-[13px] rounded-lg px-3 py-2"
            style={{
              background: "#fef2f2",
              color: "#b91c1c",
              fontFamily: "'Crimson Pro', serif",
            }}
          >
            {error}
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[14px] border transition-colors hover:bg-[#ebe6db]"
            style={{
              borderColor: "#d6cfbf",
              color: "#6e645a",
              fontFamily: "'Crimson Pro', serif",
            }}
          >
            <ChevronLeftIcon size={14} />
            Back
          </button>
          <button
            onClick={onSubmit}
            disabled={isPending}
            className="flex-1 rounded-lg px-4 py-2.5 text-[14px] font-semibold transition-all active:scale-[0.98] disabled:opacity-60"
            style={{
              background: "oklch(0.62 0.18 28)",
              color: "#faf7f1",
              fontFamily: "'Crimson Pro', serif",
            }}
          >
            {isPending ? "Generating roadmap…" : "Start learning →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Step 3 — confirmation ─────────────────────────────────────────────────────

function Step3({
  result,
  onNavigate,
}: {
  result: EnrollResult;
  onNavigate: () => void;
}) {
  const { totalNodes, unlockedNodes, personalization } = result;
  const { skippedNodes, supplementaryNodes, unlockAcceleration } =
    personalization;
  const hasPersonalization =
    skippedNodes > 0 || supplementaryNodes > 0 || unlockAcceleration;

  return (
    <>
      <DialogHeader>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
          style={{
            background: "color-mix(in srgb, oklch(0.60 0.13 150) 12%, #faf7f1)",
            border: "1px solid oklch(0.75 0.1 150)",
            color: "oklch(0.50 0.13 150)",
          }}
        >
          <CheckCircle2Icon size={22} />
        </div>
        <DialogTitle
          className="text-[22px]"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            color: "#3d342a",
          }}
        >
          Roadmap ready!
        </DialogTitle>
        <DialogDescription
          style={{
            color: "#6e645a",
            fontFamily: "'Crimson Pro', serif",
            fontSize: 14,
          }}
        >
          Your personalized learning path has been created.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-3">
        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2">
          <div
            className="rounded-[8px] border px-3 py-2.5"
            style={{ borderColor: "#d6cfbf", background: "#f3efe7" }}
          >
            <div
              className="text-[22px] font-medium"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                color: "#1a1614",
              }}
            >
              {totalNodes}
            </div>
            <div
              className="text-[10px] tracking-[0.08em] uppercase"
              style={{
                fontFamily: "JetBrains Mono, monospace",
                color: "#9a9088",
              }}
            >
              Total nodes
            </div>
          </div>
          <div
            className="rounded-[8px] border px-3 py-2.5"
            style={{ borderColor: "#d6cfbf", background: "#f3efe7" }}
          >
            <div
              className="text-[22px] font-medium"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                color: "#1a1614",
              }}
            >
              {unlockedNodes}
            </div>
            <div
              className="text-[10px] tracking-[0.08em] uppercase"
              style={{
                fontFamily: "JetBrains Mono, monospace",
                color: "#9a9088",
              }}
            >
              Unlocked
            </div>
          </div>
        </div>

        {/* Personalisation summary */}
        {hasPersonalization && (
          <div
            className="rounded-[10px] border p-3 flex flex-col gap-2"
            style={{
              borderColor: "oklch(0.82 0.1 70)",
              background: "color-mix(in srgb, oklch(0.72 0.13 70) 8%, #faf7f1)",
            }}
          >
            <div
              className="text-[10px] tracking-[0.12em] uppercase"
              style={{
                fontFamily: "JetBrains Mono, monospace",
                color: "#9a9088",
              }}
            >
              Personalized for you
            </div>
            <div className="flex flex-col gap-1.5">
              {skippedNodes > 0 && (
                <div
                  className="flex items-center gap-2 text-[14px]"
                  style={{
                    fontFamily: "'Crimson Pro', serif",
                    color: "#3a342e",
                  }}
                >
                  <ChevronsRightIcon
                    size={13}
                    style={{ color: "#b0a898", flexShrink: 0 }}
                  />
                  Skipped {skippedNodes} node{skippedNodes !== 1 ? "s" : ""} you
                  already know
                </div>
              )}
              {supplementaryNodes > 0 && (
                <div
                  className="flex items-center gap-2 text-[14px]"
                  style={{
                    fontFamily: "'Crimson Pro', serif",
                    color: "#3a342e",
                  }}
                >
                  <span
                    className="text-[13px] font-bold shrink-0 leading-none"
                    style={{ color: "oklch(0.55 0.13 250)", width: 13 }}
                  >
                    +
                  </span>
                  Added {supplementaryNodes} supplementary node
                  {supplementaryNodes !== 1 ? "s" : ""}
                </div>
              )}
              {unlockAcceleration && (
                <div
                  className="flex items-center gap-2 text-[14px]"
                  style={{
                    fontFamily: "'Crimson Pro', serif",
                    color: "#3a342e",
                  }}
                >
                  <ZapIcon
                    size={13}
                    style={{ color: "oklch(0.60 0.13 150)", flexShrink: 0 }}
                  />
                  {unlockAcceleration === "advanced"
                    ? "Advanced unlock — easy nodes pre-mastered"
                    : "Intermediate unlock — foundational nodes opened"}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onNavigate}
        className="w-full rounded-lg px-4 py-2.5 text-[14px] font-semibold transition-all active:scale-[0.98]"
        style={{
          background: "oklch(0.62 0.18 28)",
          color: "#faf7f1",
          fontFamily: "'Crimson Pro', serif",
        }}
      >
        Open roadmap →
      </button>
    </>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

export function EnrollDialog({ domain, open, onClose }: EnrollDialogProps) {
  const navigate = useNavigate();
  const meta = getDomainMeta(domain.slug);
  const enroll = useEnrollMutation();
  const learningDefaults = useYenetaSettingsStore((s) => s.learningDefaults);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<PersonalizationForm>(() =>
    createInitialForm(learningDefaults),
  );
  const [enrollResult, setEnrollResult] = useState<EnrollResult | null>(null);

  function getErrorMessage(err: unknown): string {
    if (axios.isAxiosError(err)) {
      const backendMessage = err.response?.data?.error?.message;
      if (typeof backendMessage === "string" && backendMessage.trim()) {
        return backendMessage;
      }
    }
    return "Enrollment failed. Please try again.";
  }

  useEffect(() => {
    if (open) {
      setStep(1);
      setError(null);
      setForm(createInitialForm(learningDefaults));
      setEnrollResult(null);
    }
  }, [open, learningDefaults]);

  const onChange = (patch: Partial<PersonalizationForm>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const handleClose = () => {
    setStep(1);
    setError(null);
    setForm(createInitialForm(learningDefaults));
    setEnrollResult(null);
    onClose();
  };

  const handleSubmit = async () => {
    setError(null);
    try {
      const result = await enroll.mutateAsync({
        domainId: domain.id,
        ...(form.familiarityLevel && {
          familiarityLevel: form.familiarityLevel,
        }),
        ...(form.learningGoal && { learningGoal: form.learningGoal }),
        ...(form.weeklyHours && {
          weeklyHours: parseInt(form.weeklyHours, 10),
        }),
        ...(form.aboutSelf.trim() && { aboutSelf: form.aboutSelf.trim() }),
        ...(form.preferredLearningStyle && {
          preferredLearningStyle: form.preferredLearningStyle,
        }),
        ...(form.priorSkills.trim() && {
          priorSkills: form.priorSkills.trim(),
        }),
      });
      setEnrollResult(result);
      setStep(3);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        className="max-w-md"
        style={{
          background: "#faf7f1",
          borderColor: "#d6cfbf",
          /* Height constraint + flex so Step 2 can scroll internally */
          display: "flex",
          flexDirection: "column",
          maxHeight: "calc(100dvh - 2.5rem)",
          overflow: "hidden",
          /* Keep Radix gap-4 grid spacing via row-gap on step 1 & 3 children;
             Step 2 manages its own layout */
        }}
      >
        {step === 1 && (
          <Step1
            domain={domain}
            meta={meta}
            onNext={() => setStep(2)}
            onClose={handleClose}
          />
        )}
        {step === 2 && (
          <Step2
            form={form}
            onChange={onChange}
            onBack={() => setStep(1)}
            onSubmit={handleSubmit}
            isPending={enroll.isPending}
            error={error}
          />
        )}
        {step === 3 && enrollResult && (
          <Step3
            result={enrollResult}
            onNavigate={() => {
              const id = enrollResult.enrollment.id;
              handleClose();
              navigate(`/enrollments/${id}/roadmap`);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
