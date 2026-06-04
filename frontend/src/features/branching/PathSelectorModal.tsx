import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useSelectPathMutation, useSwitchPathMutation, type BranchingPoint } from '@/api/branching';
import { useDomainsQuery } from '@/api/domains';
import { PathCard, PATH_META } from './components/PathCard';
import type { BranchPath } from '@/types';

// Map each specialisation path to the domain slug it leads to in the catalogue
const PATH_TO_DOMAIN_SLUG: Record<BranchPath, string> = {
  frontend:     'frontend-development',
  backend:      'backend-development',
  data_science: 'data-science',
};

// What to explore next after choosing each path — keyed by selected branchPath
const NEXT_STEP: Record<BranchPath, { label: string; hint: string }> = {
  frontend: {
    label: 'Advanced Frontend Engineering',
    hint: 'Dive into architecture patterns, micro-frontends, and performance optimisation.',
  },
  backend: {
    label: 'Backend & Full-Stack Integration',
    hint: 'Build scalable APIs, server-side rendering, and production-grade deployments.',
  },
  data_science: {
    label: 'Data Science & Analytics',
    hint: 'Explore ML models, observability analytics, and data-driven performance work.',
  },
};

interface PathSelectorModalProps {
  enrollmentId: string;
  branchingPoint: BranchingPoint;
  currentPath?: BranchPath | null;
  open: boolean;
  onClose: () => void;
}

export function PathSelectorModal({
  enrollmentId,
  branchingPoint,
  currentPath,
  open,
  onClose,
}: PathSelectorModalProps) {
  const [selected, setSelected] = useState<BranchPath | null>(null);
  const [succeeded, setSucceeded] = useState(false);
  const selectMutation = useSelectPathMutation(enrollmentId);
  const switchMutation = useSwitchPathMutation(enrollmentId);
  const { data: allDomains } = useDomainsQuery();
  const navigate = useNavigate();

  const isSwitch = Boolean(currentPath);
  const activeMutation = isSwitch ? switchMutation : selectMutation;
  const paths = branchingPoint.paths;

  // Find the catalogue domain for the chosen path (if it exists)
  const nextDomainSlug = selected ? PATH_TO_DOMAIN_SLUG[selected] : null;
  const nextDomain = nextDomainSlug
    ? allDomains?.find((d) => d.slug === nextDomainSlug)
    : null;

  // Reset state when dialog opens
  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setSelected(null);
      setSucceeded(false);
      onClose();
    }
  };

  const handleConfirm = async () => {
    if (!selected) return;
    try {
      if (isSwitch) {
        await switchMutation.mutateAsync(selected);
      } else {
        await selectMutation.mutateAsync(selected);
      }
      setSucceeded(true);
      // Don't auto-close — let the user decide to explore the next domain or stay
    } catch {
      // error handled by tanstack query
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-lg"
        style={{ background: '#faf7f1', borderColor: '#d6cfbf' }}
      >
        {/* ── Success state ── */}
        {succeeded && selected ? (
          <div className="flex flex-col items-center gap-5 py-6 text-center">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-[24px]"
              style={{ background: 'color-mix(in srgb, oklch(0.60 0.13 150) 14%, #faf7f1)', border: '1.5px solid oklch(0.60 0.13 150)' }}
            >
              {PATH_META[selected]?.icon ?? '✓'}
            </div>
            <div>
              <p
                className="text-[24px]"
                style={{ fontFamily: "'Cormorant Garamond', serif", color: '#1a1614' }}
              >
                {PATH_META[selected]?.label} path unlocked!
              </p>
              <p
                className="text-[14px] mt-1 max-w-[320px] mx-auto leading-relaxed"
                style={{ fontFamily: "'Crimson Pro', serif", color: '#6e645a' }}
              >
                {NEXT_STEP[selected]?.hint}
              </p>
            </div>
            {/* Next domain CTA */}
            <div
              className="rounded-[10px] border px-4 py-3 max-w-xs w-full text-left"
              style={{ borderColor: '#d6cfbf', background: '#f3efe7' }}
            >
              <p className="text-[10px] tracking-widest uppercase mb-1" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#9a9088' }}>
                What's next
              </p>
              <p className="text-[14px]" style={{ fontFamily: "'Crimson Pro', serif", color: '#1a1614' }}>
                {nextDomain?.name ?? NEXT_STEP[selected]?.label}
              </p>
              {nextDomain && (
                <p className="text-[12px] mt-0.5" style={{ fontFamily: "'Crimson Pro', serif", color: '#9a9088' }}>
                  {NEXT_STEP[selected]?.hint}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 flex-wrap justify-center">
              {nextDomain && (
                <button
                  onClick={() => {
                    onClose();
                    navigate(`/catalog/${nextDomain.slug}`);
                  }}
                  className="px-5 py-2.5 rounded-full text-[15px] transition-all hover:opacity-90"
                  style={{ background: '#1a1614', color: '#f3efe7', fontFamily: "'Crimson Pro', serif" }}
                >
                  Explore {nextDomain.name} →
                </button>
              )}
              <button
                onClick={() => {
                  setSucceeded(false);
                  setSelected(null);
                  onClose();
                }}
                className="px-5 py-2.5 rounded-full text-[15px] border transition-all hover:bg-[#ebe6db]"
                style={{ borderColor: '#d6cfbf', color: '#6e645a', fontFamily: "'Crimson Pro', serif" }}
              >
                {nextDomain ? 'Stay on this course' : 'Continue'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="text-[32px] mb-2">🔀</div>
              <DialogTitle
                className="text-[24px]"
                style={{ fontFamily: "'Cormorant Garamond', serif", color: '#3d342a' }}
              >
                {isSwitch ? 'Switch Your Path' : 'Choose Your Learning Path'}
              </DialogTitle>
              <DialogDescription
                style={{ fontFamily: "'Crimson Pro', serif", color: '#6e645a', fontSize: 15 }}
              >
                {isSwitch
                  ? 'Switch your specialisation at any time. Your progress on all shared nodes is always kept.'
                  : `You've completed the core curriculum. Choose the advanced path that fits your goals — only nodes for your chosen specialisation will be shown.`}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-3 gap-3 mt-2">
              {paths.map((path) => (
                <PathCard
                  key={path.branchPath}
                  path={path}
                  selected={selected === path.branchPath}
                  current={currentPath === path.branchPath}
                  onSelect={() => setSelected(path.branchPath)}
                  isPending={activeMutation.isPending}
                />
              ))}
            </div>

            {activeMutation.isError && (
              <p className="text-[13px] text-center" style={{ color: '#b91c1c', fontFamily: "'Crimson Pro', serif" }}>
                Something went wrong. Please try again.
              </p>
            )}

            <div className="flex gap-3 mt-2">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg text-[14px] border transition-colors hover:bg-[#ebe6db]"
                style={{ borderColor: '#d6cfbf', color: '#6e645a', fontFamily: "'Crimson Pro', serif" }}
              >
                {isSwitch ? 'Cancel' : 'Decide later'}
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selected || activeMutation.isPending}
                className="flex-1 rounded-lg px-4 py-2.5 text-[14px] font-semibold transition-all disabled:opacity-50"
                style={{ background: 'oklch(0.62 0.18 28)', color: '#faf7f1', fontFamily: "'Crimson Pro', serif" }}
              >
                {activeMutation.isPending
                  ? 'Updating…'
                  : isSwitch
                  ? 'Switch path'
                  : 'Start this path →'}
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
