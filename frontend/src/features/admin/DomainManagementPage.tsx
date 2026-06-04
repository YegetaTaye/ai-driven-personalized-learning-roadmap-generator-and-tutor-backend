import { useState } from 'react';
import { useDomainsQuery, useDeleteDomainMutation } from '@/api/domains';
import { useAuth } from '@/hooks/useAuth';
import type { Domain } from '@/types';
import { DomainForm } from './components/DomainForm';
import { OntologyVersionList } from './components/OntologyVersionList';

export default function DomainManagementPage() {
  const { isAdmin } = useAuth();
  const { data: domains, isLoading } = useDomainsQuery();
  const deleteMutation = useDeleteDomainMutation();
  const [formDomain, setFormDomain] = useState<Domain | null | 'new'>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[28px] leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#1a1614' }}>
          Domains
        </h1>
        <button
          onClick={() => setFormDomain('new')}
          className="px-4 py-2 rounded-[8px] text-[13px] transition-colors hover:opacity-90"
          style={{ background: '#1a1614', color: '#faf7f1', fontFamily: "'Crimson Pro', serif" }}
        >
          + Create Domain
        </button>
      </div>

      {/* Domain cards */}
      {isLoading ? (
        <div className="flex flex-col gap-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-[12px]" style={{ background: '#ebe6db' }} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {(domains ?? []).map((domain) => (
            <div
              key={domain.id}
              className="border rounded-[12px] overflow-hidden"
              style={{ borderColor: '#d6cfbf', background: '#faf7f1' }}
            >
              {/* Domain header row */}
              <div className="flex items-center gap-4 px-5 py-4">
                {domain.iconUrl ? (
                  <img src={domain.iconUrl} alt="" className="w-9 h-9 rounded-[8px] object-cover" />
                ) : (
                  <div
                    className="w-9 h-9 rounded-[8px] grid place-items-center text-[18px]"
                    style={{ background: '#ebe6db' }}
                  >
                    📦
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="text-[17px]" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#1a1614' }}>
                    {domain.name}
                  </div>
                  {domain.description && (
                    <div className="text-[13px] truncate" style={{ fontFamily: "'Crimson Pro', serif", color: '#9a9088' }}>
                      {domain.description}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setFormDomain(domain)}
                    className="px-3 py-1.5 rounded-[8px] text-[12px] hover:bg-[#ebe6db] transition-colors"
                    style={{ fontFamily: 'JetBrains Mono, monospace', color: '#6e645a', border: '1px solid #d6cfbf' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setExpandedId(expandedId === domain.id ? null : domain.id)}
                    className="px-3 py-1.5 rounded-[8px] text-[12px] hover:bg-[#ebe6db] transition-colors"
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      color: expandedId === domain.id ? '#faf7f1' : '#6e645a',
                      background: expandedId === domain.id ? '#1a1614' : 'transparent',
                      border: '1px solid #d6cfbf',
                    }}
                  >
                    {expandedId === domain.id ? '▲ Ontologies' : '▼ Ontologies'}
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(domain.id)}
                    className="px-3 py-1.5 rounded-[8px] text-[12px] transition-colors hover:bg-[#fce8e8]"
                    style={{ fontFamily: 'JetBrains Mono, monospace', color: 'oklch(0.52 0.18 25)', border: '1px solid oklch(0.80 0.08 25)' }}
                    title={isAdmin ? 'Delete domain' : 'Delete (only if not yet published)'}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Ontology versions accordion */}
              {expandedId === domain.id && (
                <div className="px-5 pb-5 pt-1 border-t" style={{ borderColor: '#ebe6db' }}>
                  <OntologyVersionList domainId={domain.id} />
                </div>
              )}

              {/* Inline delete confirmation */}
              {confirmDeleteId === domain.id && (
                <div
                  className="px-5 py-4 border-t flex items-center gap-3 flex-wrap"
                  style={{ borderColor: 'oklch(0.88 0.06 25)', background: 'oklch(0.97 0.02 25)' }}
                >
                  <span className="text-[14px] flex-1" style={{ fontFamily: "'Crimson Pro', serif", color: 'oklch(0.42 0.18 25)' }}>
                    {isAdmin
                      ? `Delete "${domain.name}" and all its ontologies, nodes, and enrollments? This cannot be undone.`
                      : `Delete "${domain.name}"? Only allowed if no ontology is published or verified.`}
                  </span>
                  <button
                    disabled={deleteMutation.isPending}
                    onClick={async () => {
                      try {
                        await deleteMutation.mutateAsync({ id: domain.id, slug: domain.slug });
                        setConfirmDeleteId(null);
                        if (expandedId === domain.id) setExpandedId(null);
                      } catch {
                        // error shown via mutation state
                      }
                    }}
                    className="px-4 py-1.5 rounded-[8px] text-[13px] transition-colors disabled:opacity-50"
                    style={{ background: 'oklch(0.52 0.18 25)', color: '#fff', fontFamily: "'Crimson Pro', serif" }}
                  >
                    {deleteMutation.isPending ? 'Deleting…' : 'Yes, delete'}
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="px-4 py-1.5 rounded-[8px] text-[13px] border transition-colors hover:bg-[#ebe6db]"
                    style={{ borderColor: '#d6cfbf', color: '#6e645a', fontFamily: "'Crimson Pro', serif" }}
                  >
                    Cancel
                  </button>
                  {deleteMutation.isError && (
                    <p className="w-full text-[12px] mt-1" style={{ fontFamily: "'Crimson Pro', serif", color: 'oklch(0.52 0.18 25)' }}>
                      {(deleteMutation.error as { response?: { data?: { error?: { message?: string } } } })
                        ?.response?.data?.error?.message ?? 'Failed to delete. Try again.'}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}

          {(!domains || domains.length === 0) && (
            <div
              className="border rounded-2xl px-8 py-10 text-center"
              style={{ borderColor: '#d6cfbf', borderStyle: 'dashed', background: '#f3efe7' }}
            >
              <p className="text-[16px] italic" style={{ fontFamily: "'Cormorant Garamond', serif", color: '#6e645a' }}>
                No domains yet — create the first one
              </p>
            </div>
          )}
        </div>
      )}

      {/* Create / edit form modal */}
      {formDomain !== null && (
        <DomainForm
          domain={formDomain === 'new' ? undefined : formDomain}
          onClose={() => setFormDomain(null)}
        />
      )}
    </div>
  );
}
